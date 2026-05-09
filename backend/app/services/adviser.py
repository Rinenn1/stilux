import json
import logging
import re
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import anthropic
import httpx
from app.config import settings
from app.models.wardrobe import WardrobeItem
from app.models.wear_log import WearLog
from app.models.conversation import Conversation

logger = logging.getLogger(__name__)

anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

SYSTEM_PROMPT = """You are a personal fashion adviser with full knowledge of the user's wardrobe.
Your job is to suggest outfits that are stylish, appropriate for the occasion, and practical.

When asked for outfit suggestions:
1. Return exactly 5 outfit suggestions as a JSON array inside <outfits> tags.
2. Each outfit must use ONLY items from the provided wardrobe (by item ID).
3. Exclude any items in the "recently_worn" list.
4. Consider color coordination, formality matching, and occasion fit.
5. If the occasion implies weather (e.g. outdoor events) and specific items seem weather-inappropriate, note it as a caution.

Outfit JSON format:
{
  "outfits": [
    {
      "index": 1,
      "item_ids": [1, 5, 12],
      "occasion": "casual",
      "reasoning": "2-3 sentence explanation of why this works",
      "cautions": "optional string, e.g. 'suede shoes may not suit rain'"
    }
  ]
}

For general chat outside of outfit requests, respond naturally as a fashion adviser.
Never make up items not in the wardrobe list."""


def _wardrobe_context(items: list[WardrobeItem], recently_worn_ids: set[int]) -> str:
    lines = ["=== WARDROBE ==="]
    for item in items:
        worn_flag = " [RECENTLY WORN - EXCLUDE]" if item.id in recently_worn_ids else ""
        lines.append(
            f"ID:{item.id} | {item.name} | {item.category} | {item.color} | "
            f"{item.formality} | occasions:{','.join(item.occasions)} | "
            f"season:{item.season} | tags:{','.join(item.tags)}{worn_flag}"
        )
    return "\n".join(lines)


def _is_credit_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "credit balance" in msg or "insufficient_quota" in msg or (
        isinstance(exc, anthropic.BadRequestError) and "credit" in msg
    )


async def _call_anthropic(messages: list[dict], system: str) -> str:
    response = await anthropic_client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2000,
        system=system,
        messages=messages,
    )
    return response.content[0].text


async def _call_deepseek(messages: list[dict], system: str) -> str:
    payload = {
        "model": "deepseek-chat",
        "max_tokens": 2000,
        "messages": [{"role": "system", "content": system}] + messages,
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            DEEPSEEK_API_URL,
            headers={"Authorization": f"Bearer {settings.deepseek_api_key}"},
            json=payload,
        )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


async def get_recently_worn_ids(db: AsyncSession) -> set[int]:
    cutoff = datetime.utcnow() - timedelta(days=7)
    result = await db.execute(select(WearLog).where(WearLog.worn_at >= cutoff))
    logs = result.scalars().all()
    ids = set()
    for log in logs:
        ids.update(log.item_ids)
    return ids


async def get_conversation_history(
    db: AsyncSession, session_id: int | None = None, limit: int = 20
) -> list[dict]:
    query = select(Conversation).order_by(Conversation.created_at.desc()).limit(limit)
    if session_id is not None:
        query = query.where(Conversation.session_id == session_id)
    result = await db.execute(query)
    messages = result.scalars().all()
    return [{"role": m.role, "content": m.content} for m in reversed(messages)]


async def chat(
    user_message: str,
    db: AsyncSession,
    wardrobe_items: list[WardrobeItem],
    recently_worn_ids: set[int],
    session_id: int | None = None,
    pinterest_context: str | None = None,
) -> tuple[str, list[dict] | None]:
    """Returns (assistant_text, outfits_json_or_None). Falls back to DeepSeek on credit errors."""
    wardrobe_ctx = _wardrobe_context(wardrobe_items, recently_worn_ids)
    history = await get_conversation_history(db, session_id)
    messages = history + [{"role": "user", "content": user_message}]
    extra = f"\n\n{pinterest_context}" if pinterest_context else ""
    system = f"{SYSTEM_PROMPT}\n\n{wardrobe_ctx}{extra}"

    try:
        reply = await _call_anthropic(messages, system)
    except Exception as exc:
        if _is_credit_error(exc) and settings.deepseek_api_key:
            logger.warning("Anthropic credit exhausted — falling back to DeepSeek")
            reply = await _call_deepseek(messages, system)
        else:
            raise

    outfits = _parse_outfits(reply)
    return reply, outfits


def _parse_outfits(reply: str) -> list[dict] | None:
    # Primary: <outfits>...</outfits> XML tags (intended format for Claude)
    if "<outfits>" in reply:
        try:
            start = reply.index("<outfits>") + len("<outfits>")
            end = reply.index("</outfits>")
            parsed = json.loads(reply[start:end].strip())
            outfits = parsed if isinstance(parsed, list) else parsed.get("outfits")
            if outfits:
                return outfits
        except (ValueError, json.JSONDecodeError):
            pass

    # Fallback: ```json code block (DeepSeek ignores XML tag instructions)
    for block in re.findall(r"```(?:json)?\s*([\s\S]*?)\s*```", reply):
        try:
            parsed = json.loads(block)
            candidates = parsed if isinstance(parsed, list) else parsed.get("outfits")
            if candidates and isinstance(candidates, list) and candidates[0].get("item_ids"):
                return candidates
        except (ValueError, json.JSONDecodeError):
            pass

    return None


async def chat_swap(
    occasion: str,
    wardrobe_items: list[WardrobeItem],
    exclude_ids: set[int],
) -> list[dict] | None:
    """Generate one alternative outfit for the given occasion, excluding exclude_ids."""
    wardrobe_ctx = _wardrobe_context(wardrobe_items, exclude_ids)
    prompt = (
        f"The user wants a fresh alternative outfit for: {occasion}.\n"
        "Suggest exactly 1 new outfit using ONLY items NOT marked [RECENTLY WORN - EXCLUDE]. "
        "Return it as a JSON array inside <outfits> tags with index: 1."
    )
    messages = [{"role": "user", "content": prompt}]
    system = f"{SYSTEM_PROMPT}\n\n{wardrobe_ctx}"

    try:
        reply = await _call_anthropic(messages, system)
    except Exception as exc:
        if _is_credit_error(exc) and settings.deepseek_api_key:
            reply = await _call_deepseek(messages, system)
        else:
            raise

    return _parse_outfits(reply)
