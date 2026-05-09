import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.api.auth import get_current_user
from app.models.profile import Profile
from app.config import settings

router = APIRouter(prefix="/profile", tags=["profile"])
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/body-photo")
async def upload_body_photo(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    _ = get_current_user(request)
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, WebP images allowed")

    file_bytes = await file.read()
    upload_dir = Path(settings.upload_dir) / "profile"
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix.lower() or ".jpg"
    filename = f"body_{uuid.uuid4().hex}{ext}"
    file_path = upload_dir / filename
    file_path.write_bytes(file_bytes)

    result = await db.execute(select(Profile))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = Profile(body_photo_path=str(file_path))
        db.add(profile)
    else:
        if profile.body_photo_path:
            Path(profile.body_photo_path).unlink(missing_ok=True)
        profile.body_photo_path = str(file_path)

    await db.commit()
    return {"ok": True, "body_photo_url": "/profile/body-photo"}


@router.get("/body-photo")
async def get_body_photo(request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(Profile))
    profile = result.scalar_one_or_none()
    if not profile or not profile.body_photo_path or not Path(profile.body_photo_path).exists():
        raise HTTPException(404, "Body photo not set")
    return FileResponse(profile.body_photo_path)


@router.get("/")
async def get_profile(request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(Profile))
    profile = result.scalar_one_or_none()
    return {
        "has_body_photo": bool(profile and profile.body_photo_path and Path(profile.body_photo_path).exists()),
        "style_preferences": profile.style_preferences if profile else [],
        "fit_preferences": profile.fit_preferences if profile else {},
        "color_comfort": profile.color_comfort if profile else [],
    }


class PreferencesUpdate(BaseModel):
    style_preferences: list[str] | None = None
    fit_preferences: dict | None = None
    color_comfort: list[str] | None = None


@router.patch("/preferences")
async def update_preferences(body: PreferencesUpdate, request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(Profile))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = Profile()
        db.add(profile)

    if body.style_preferences is not None:
        profile.style_preferences = body.style_preferences
    if body.fit_preferences is not None:
        profile.fit_preferences = body.fit_preferences
    if body.color_comfort is not None:
        profile.color_comfort = body.color_comfort

    await db.commit()
    return {"ok": True}
