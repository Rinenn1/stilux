import asyncio
import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request, BackgroundTasks
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db, AsyncSessionLocal
from app.api.auth import get_current_user
from app.models.wardrobe import WardrobeItem
from app.services.tagger import tag_wardrobe_item
from app.services import storage
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/wardrobe", tags=["wardrobe"])
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def _run_tagging(item_id: int, image_url: str):
    async with AsyncSessionLocal() as db:
        try:
            tags = await tag_wardrobe_item(image_url)
            result = await db.execute(select(WardrobeItem).where(WardrobeItem.id == item_id))
            item = result.scalar_one_or_none()
            if item:
                for field, value in tags.items():
                    if hasattr(item, field):
                        setattr(item, field, value)
                item.tagging_complete = True
                await db.commit()
        except Exception as exc:
            logger.error("Tagging failed for item %d: %s", item_id, exc)
            result = await db.execute(select(WardrobeItem).where(WardrobeItem.id == item_id))
            item = result.scalar_one_or_none()
            if item:
                item.tagging_error = True
                await db.commit()


@router.post("/upload")
async def upload_item(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    _ = get_current_user(request)
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Only JPEG, PNG, WebP images allowed")

    file_bytes = await file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(400, f"File exceeds {settings.max_upload_size_mb}MB limit")

    filename, image_url = await storage.upload(
        storage.BUCKET_WARDROBE, file.filename or "item.jpg", file_bytes, file.content_type
    )

    item = WardrobeItem(filename=filename, original_name=file.filename, file_path=image_url)
    db.add(item)
    await db.commit()
    await db.refresh(item)

    background_tasks.add_task(_run_tagging, item.id, image_url)
    return {"id": item.id, "tagging_complete": False}


@router.post("/upload-bulk")
async def upload_bulk(
    request: Request,
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    _ = get_current_user(request)
    results = []
    for file in files:
        if file.content_type not in ALLOWED_TYPES:
            results.append({"filename": file.filename, "error": "Invalid type"})
            continue
        file_bytes = await file.read()
        filename, image_url = await storage.upload(
            storage.BUCKET_WARDROBE, file.filename or "item.jpg", file_bytes, file.content_type
        )
        item = WardrobeItem(filename=filename, original_name=file.filename, file_path=image_url)
        db.add(item)
        await db.commit()
        await db.refresh(item)
        background_tasks.add_task(_run_tagging, item.id, image_url)
        results.append({"id": item.id, "filename": file.filename})
    return results


@router.get("/items")
async def list_items(request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(WardrobeItem).order_by(WardrobeItem.created_at.desc()))
    items = result.scalars().all()
    return [_item_dict(i) for i in items]


@router.get("/items/{item_id}")
async def get_item(item_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(WardrobeItem).where(WardrobeItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
    return _item_dict(item)


class ItemUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    color: str | None = None
    formality: str | None = None
    season: str | None = None
    occasions: list[str] | None = None
    style_notes: str | None = None
    tags: list[str] | None = None


@router.patch("/items/{item_id}")
async def update_item(item_id: int, body: ItemUpdate, request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(WardrobeItem).where(WardrobeItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    await db.commit()
    return _item_dict(item)


@router.delete("/items/{item_id}")
async def delete_item(item_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(WardrobeItem).where(WardrobeItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
    await storage.delete(storage.BUCKET_WARDROBE, item.filename)
    await db.delete(item)
    await db.commit()
    return {"ok": True}


@router.get("/items/{item_id}/image")
async def get_image(item_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(WardrobeItem).where(WardrobeItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item or not item.file_path:
        raise HTTPException(404, "Image not found")
    return RedirectResponse(item.file_path)


def _item_dict(item: WardrobeItem) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "color": item.color,
        "formality": item.formality,
        "season": item.season,
        "occasions": item.occasions,
        "style_notes": item.style_notes,
        "tags": item.tags,
        "tagging_complete": item.tagging_complete,
        "tagging_error": item.tagging_error,
        "original_name": item.original_name,
        "created_at": item.created_at.isoformat(),
        "image_url": item.file_path,
    }
