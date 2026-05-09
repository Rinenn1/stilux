import re
from pathlib import Path
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.api.auth import get_current_user
from app.models.wardrobe import WardrobeItem
from app.models.conversation import Conversation, OutfitSuggestion, ChatSession
from app.models.wear_log import WearLog
from app.models.profile import Profile
from app.services.adviser import chat, chat_swap, get_recently_worn_ids
from app.services.mockup import generate_all_mockups

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: int | None = None


@router.post("/")
async def send_message(body: ChatRequest, request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)

    # Resolve or create session
    if body.session_id:
        sess_result = await db.execute(select(ChatSession).where(ChatSession.id == body.session_id))
        session = sess_result.scalar_one_or_none()
        if not session:
            raise HTTPException(404, "Session not found")
    else:
        session = ChatSession(title=body.message[:60])
        db.add(session)
        await db.flush()

    wardrobe_result = await db.execute(select(WardrobeItem).where(WardrobeItem.tagging_complete == True))
    wardrobe_items = wardrobe_result.scalars().all()

    recently_worn_ids = await get_recently_worn_ids(db)

    # Optionally build Pinterest context
    pinterest_ctx = None
    if True:  # always check; function is a no-op if not connected
        profile_result = await db.execute(select(Profile))
        prof = profile_result.scalar_one_or_none()
        if prof and prof.pinterest_access_token:
            from app.services.pinterest import get_all_recent_pins, build_pinterest_context
            pins = await get_all_recent_pins(prof.pinterest_access_token)
            if pins:
                pinterest_ctx = build_pinterest_context(pins)

    reply, outfits = await chat(
        body.message, db, wardrobe_items, recently_worn_ids,
        session_id=session.id, pinterest_context=pinterest_ctx,
    )

    # Strip machine-readable outfit data so users see clean text
    display_reply = reply
    if "<outfits>" in reply and "</outfits>" in reply:
        start = reply.index("<outfits>")
        end = reply.index("</outfits>") + len("</outfits>")
        display_reply = (display_reply[:start] + display_reply[end:]).strip()
    if outfits:
        display_reply = re.sub(
            r"```(?:json)?\s*\{[^`]*\"outfits\"[^`]*\}\s*```",
            "",
            display_reply,
            flags=re.DOTALL,
        ).strip()

    user_msg = Conversation(role="user", content=body.message, session_id=session.id)
    assistant_msg = Conversation(role="assistant", content=display_reply, session_id=session.id)
    db.add(user_msg)
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    saved_suggestions = []
    if outfits:
        for o in outfits:
            suggestion = OutfitSuggestion(
                conversation_id=assistant_msg.id,
                outfit_index=o["index"],
                item_ids=o["item_ids"],
                occasion=o.get("occasion", ""),
                reasoning=o.get("reasoning", ""),
            )
            db.add(suggestion)

        await db.commit()

        item_map = {i.id: i for i in wardrobe_items}
        suggestion_result = await db.execute(
            select(OutfitSuggestion).where(OutfitSuggestion.conversation_id == assistant_msg.id)
        )
        suggestions = suggestion_result.scalars().all()

        mockup_inputs = []
        for s in suggestions:
            item_paths = [item_map[iid].file_path for iid in s.item_ids if iid in item_map]
            names = [item_map[iid].name for iid in s.item_ids if iid in item_map]
            mockup_inputs.append({
                "item_paths": item_paths,
                "outfit_description": ", ".join(names),
                "occasion": s.occasion,
                "suggestion_id": s.id,
            })

        profile_result = await db.execute(select(Profile))
        profile = profile_result.scalar_one_or_none()
        body_photo = profile.body_photo_path if profile else None

        mockup_paths = []
        if body_photo and Path(body_photo).exists():
            mockup_paths = await generate_all_mockups(body_photo, mockup_inputs)
        else:
            mockup_paths = [None] * len(mockup_inputs)

        for s, path in zip(suggestions, mockup_paths):
            if path:
                s.mockup_path = path
        await db.commit()

        for s, mi in zip(suggestions, mockup_inputs):
            saved_suggestions.append({
                "id": s.id,
                "index": s.outfit_index,
                "item_ids": s.item_ids,
                "occasion": s.occasion,
                "reasoning": s.reasoning,
                "mockup_url": f"/chat/mockup/{s.id}" if s.mockup_path else None,
                "cautions": next((o.get("cautions") for o in outfits if o["index"] == s.outfit_index), None),
            })

    return {
        "reply": display_reply,
        "suggestions": saved_suggestions,
        "session_id": session.id,
    }


@router.get("/sessions")
async def get_sessions(request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(ChatSession).order_by(ChatSession.created_at.desc()))
    sessions = result.scalars().all()
    return [{"id": s.id, "title": s.title, "created_at": s.created_at.isoformat()} for s in sessions]


@router.get("/history")
async def get_history(request: Request, session_id: int, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    msg_result = await db.execute(
        select(Conversation)
        .where(Conversation.session_id == session_id)
        .order_by(Conversation.created_at.asc())
    )
    messages = msg_result.scalars().all()

    sug_result = await db.execute(select(OutfitSuggestion).order_by(OutfitSuggestion.outfit_index.asc()))
    all_suggestions = sug_result.scalars().all()
    by_convo: dict[int, list[OutfitSuggestion]] = {}
    for s in all_suggestions:
        by_convo.setdefault(s.conversation_id, []).append(s)

    output = []
    for m in messages:
        entry: dict = {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()}
        if m.role == "assistant" and m.id in by_convo:
            entry["suggestions"] = [
                {
                    "id": s.id,
                    "index": s.outfit_index,
                    "item_ids": s.item_ids,
                    "occasion": s.occasion,
                    "reasoning": s.reasoning,
                    "mockup_url": f"/chat/mockup/{s.id}" if s.mockup_path else None,
                    "cautions": None,
                    "_accepted": bool(s.accepted),
                }
                for s in by_convo[m.id]
            ]
        output.append(entry)
    return output


@router.get("/mockup/{suggestion_id}")
async def get_mockup(suggestion_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(OutfitSuggestion).where(OutfitSuggestion.id == suggestion_id))
    s = result.scalar_one_or_none()
    if not s or not s.mockup_path or not Path(s.mockup_path).exists():
        raise HTTPException(404, "Mockup not found")
    return FileResponse(s.mockup_path, media_type="image/png")


class AcceptRequest(BaseModel):
    suggestion_id: int


@router.post("/accept")
async def accept_suggestion(body: AcceptRequest, request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(OutfitSuggestion).where(OutfitSuggestion.id == body.suggestion_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Suggestion not found")

    s.accepted = True
    log = WearLog(item_ids=s.item_ids, source="suggestion", suggestion_id=s.id)
    db.add(log)
    await db.commit()
    return {"ok": True}


class SwapRequest(BaseModel):
    suggestion_id: int


@router.post("/swap")
async def swap_suggestion(body: SwapRequest, request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(OutfitSuggestion).where(OutfitSuggestion.id == body.suggestion_id))
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(404, "Suggestion not found")

    wardrobe_result = await db.execute(select(WardrobeItem).where(WardrobeItem.tagging_complete == True))
    wardrobe_items = wardrobe_result.scalars().all()

    recently_worn_ids = await get_recently_worn_ids(db)
    exclude_ids = recently_worn_ids | set(s.item_ids)

    outfits = await chat_swap(s.occasion, wardrobe_items, exclude_ids)
    if not outfits:
        raise HTTPException(500, "Could not generate alternative outfit")

    new_outfit = outfits[0]
    s.item_ids = new_outfit["item_ids"]
    s.reasoning = new_outfit.get("reasoning", "")
    s.mockup_path = None
    await db.commit()

    profile_result = await db.execute(select(Profile))
    profile = profile_result.scalar_one_or_none()
    body_photo = profile.body_photo_path if profile else None
    item_map = {i.id: i for i in wardrobe_items}

    if body_photo and Path(body_photo).exists():
        item_paths = [item_map[iid].file_path for iid in s.item_ids if iid in item_map]
        names = [item_map[iid].name for iid in s.item_ids if iid in item_map]
        mockup_paths = await generate_all_mockups(body_photo, [{
            "item_paths": item_paths,
            "outfit_description": ", ".join(names),
            "occasion": s.occasion,
            "suggestion_id": s.id,
        }])
        if mockup_paths and mockup_paths[0]:
            s.mockup_path = mockup_paths[0]
            await db.commit()

    return {
        "id": s.id,
        "index": s.outfit_index,
        "item_ids": s.item_ids,
        "occasion": s.occasion,
        "reasoning": s.reasoning,
        "mockup_url": f"/chat/mockup/{s.id}" if s.mockup_path else None,
        "cautions": new_outfit.get("cautions"),
        "_accepted": bool(s.accepted),
    }
