from datetime import datetime
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.database import get_db
from app.api.auth import get_current_user
from app.models.wear_log import WearLog

router = APIRouter(prefix="/wear-log", tags=["wear-log"])


class ManualLogRequest(BaseModel):
    item_ids: list[int]
    note: str | None = None
    worn_at: datetime | None = None


@router.post("/")
async def log_outfit(body: ManualLogRequest, request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    log = WearLog(
        item_ids=body.item_ids,
        source="manual",
        worn_at=body.worn_at or datetime.utcnow(),
        note=body.note,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return {"id": log.id, "ok": True}


@router.get("/")
async def get_logs(request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(WearLog).order_by(WearLog.worn_at.desc()).limit(50))
    logs = result.scalars().all()
    return [
        {
            "id": l.id,
            "item_ids": l.item_ids,
            "source": l.source,
            "worn_at": l.worn_at.isoformat(),
            "note": l.note,
        }
        for l in logs
    ]


@router.delete("/{log_id}")
async def delete_log(log_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    _ = get_current_user(request)
    result = await db.execute(select(WearLog).where(WearLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(404, "Log entry not found")
    await db.delete(log)
    await db.commit()
    return {"ok": True}
