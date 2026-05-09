from urllib.parse import urlencode
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
from app.config import settings
from app.database import get_db
from app.api.auth import get_current_user
from app.models.profile import Profile

router = APIRouter(prefix="/pinterest", tags=["pinterest"])

_AUTH_URL = "https://www.pinterest.com/oauth/"
_TOKEN_URL = "https://api.pinterest.com/v5/oauth/token"
_SCOPES = "boards:read,boards:read_secret,pins:read"


@router.get("/status")
async def pinterest_status(request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    if not settings.pinterest_client_id:
        return {"connected": False, "configured": False}
    result = await db.execute(select(Profile))
    profile = result.scalar_one_or_none()
    return {
        "connected": bool(profile and profile.pinterest_access_token),
        "configured": True,
    }


@router.get("/auth")
async def pinterest_auth(request: Request):
    _ = get_current_user(request)
    if not settings.pinterest_client_id:
        raise HTTPException(400, "Pinterest not configured — add PINTEREST_CLIENT_ID to .env")
    params = urlencode({
        "client_id": settings.pinterest_client_id,
        "redirect_uri": settings.pinterest_redirect_uri,
        "response_type": "code",
        "scope": _SCOPES,
    })
    return RedirectResponse(f"{_AUTH_URL}?{params}")


@router.get("/callback")
async def pinterest_callback(code: str, request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            _TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.pinterest_redirect_uri,
            },
            auth=(settings.pinterest_client_id, settings.pinterest_client_secret),
        )
    if resp.status_code != 200:
        raise HTTPException(400, f"Pinterest token exchange failed: {resp.text}")

    token_data = resp.json()
    result = await db.execute(select(Profile))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = Profile()
        db.add(profile)
    profile.pinterest_access_token = token_data["access_token"]
    profile.pinterest_refresh_token = token_data.get("refresh_token")
    await db.commit()
    return RedirectResponse(f"{settings.frontend_url}/profile?pinterest=connected")


@router.post("/disconnect")
async def pinterest_disconnect(request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(Profile))
    profile = result.scalar_one_or_none()
    if profile:
        profile.pinterest_access_token = None
        profile.pinterest_refresh_token = None
        await db.commit()
    return {"ok": True}
