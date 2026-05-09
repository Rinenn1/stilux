from datetime import datetime
from sqlalchemy import Integer, DateTime, String, JSON, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class WearLog(Base):
    __tablename__ = "wear_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    item_ids: Mapped[list] = mapped_column(JSON)           # list of wardrobe item IDs in the outfit
    source: Mapped[str] = mapped_column(String(20))        # "suggestion" | "manual"
    suggestion_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    worn_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
