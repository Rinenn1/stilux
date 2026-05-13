from fastapi import APIRouter, Request, HTTPException
from jose import jwt as jose_jwt, jwk as jose_jwk
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

_SUPABASE_JWK = {
    "x": "3CtDmRyN6-TvqBgMLiQd3lPtHVvDb4pYM1DRpHdzEVQ",
    "y": "0gQ44Wfp5kDfe7njvYVTv-D2-zyd07a5KFYxvxsqMMI",
    "alg": "ES256",
    "crv": "P-256",
    "kid": "87be7cb1-bcc3-4355-a57c-1321b8b343a5",
    "kty": "EC",
}
_PUBLIC_KEY = jose_jwk.construct(_SUPABASE_JWK, algorithm="ES256")


def get_current_user(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header[7:]
    try:
        payload = jose_jwt.decode(
            token,
            _PUBLIC_KEY,
            algorithms=["ES256"],
            options={"verify_aud": False},
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    email = payload.get("email", "")
    if email != settings.allowed_email:
        raise HTTPException(status_code=403, detail="Access denied")
    return email


@router.get("/me")
async def me(request: Request):
    email = get_current_user(request)
    return {"email": email}
