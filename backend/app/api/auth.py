from datetime import datetime, timedelta
from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import RedirectResponse
import httpx
from jose import jwt
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def create_session_token(email: str) -> str:
    payload = {"sub": email, "exp": datetime.utcnow() + timedelta(days=30)}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def verify_session_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session")


def get_current_user(request: Request) -> str:
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    email = verify_session_token(token)
    if email != settings.allowed_email:
        raise HTTPException(status_code=403, detail="Access denied")
    return email


@router.get("/login")
async def login():
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{query}")


@router.get("/callback")
async def callback(code: str, response: Response):
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        tokens = token_resp.json()
        user_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        user_info = user_resp.json()

    email = user_info.get("email", "")
    if email != settings.allowed_email:
        raise HTTPException(status_code=403, detail="Access denied")

    session_token = create_session_token(email)
    redirect = RedirectResponse(url=settings.frontend_url)
    redirect.set_cookie("session", session_token, httponly=True, samesite="lax", max_age=30 * 86400)
    return redirect


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("session")
    return {"ok": True}


@router.get("/me")
async def me(request: Request):
    email = get_current_user(request)
    return {"email": email}
