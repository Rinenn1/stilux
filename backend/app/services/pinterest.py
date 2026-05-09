import logging
import httpx

logger = logging.getLogger(__name__)

PINTEREST_API_BASE = "https://api.pinterest.com/v5"


async def get_boards(access_token: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{PINTEREST_API_BASE}/boards",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"page_size": 25},
        )
        resp.raise_for_status()
        return resp.json().get("items", [])


async def get_pins(access_token: str, board_id: str, limit: int = 25) -> list[dict]:
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{PINTEREST_API_BASE}/boards/{board_id}/pins",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"page_size": min(limit, 25)},
        )
        resp.raise_for_status()
        return resp.json().get("items", [])


async def get_all_recent_pins(access_token: str, max_pins: int = 30) -> list[dict]:
    try:
        boards = await get_boards(access_token)
        if not boards:
            return []
        pins: list[dict] = []
        per_board = max(3, max_pins // min(len(boards), 8))
        for board in boards[:8]:
            board_pins = await get_pins(access_token, board["id"], limit=per_board)
            for pin in board_pins:
                pin["_board_name"] = board.get("name", "")
            pins.extend(board_pins)
            if len(pins) >= max_pins:
                break
        return pins[:max_pins]
    except Exception as exc:
        logger.warning("Pinterest pin fetch failed: %s", exc)
        return []


def build_pinterest_context(pins: list[dict]) -> str:
    if not pins:
        return ""
    lines = [
        "=== PINTEREST STYLE INSPIRATION ===",
        "The user has saved these fashion inspirations on Pinterest:",
    ]
    for pin in pins:
        title = (pin.get("title") or "").strip()
        desc = (pin.get("description") or "").strip()[:120]
        board = pin.get("_board_name", "")
        parts = [p for p in [title, desc] if p]
        text = " — ".join(parts) if parts else None
        if text:
            suffix = f" [{board}]" if board else ""
            lines.append(f"• {text}{suffix}")
    if len(lines) <= 2:
        return ""
    lines.append(
        "\nUse these inspirations to: "
        "1) suggest outfits that match their pinned aesthetic, "
        "2) point out when a wardrobe item aligns with their Pinterest taste, "
        "3) identify style gaps — things they pin but don't own."
    )
    return "\n".join(lines)
