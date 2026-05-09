from datetime import datetime
from sqlalchemy import String, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Profile(Base):
    __tablename__ = "profile"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)  # single-user, always id=1
    body_photo_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    style_preferences: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")
    fit_preferences: Mapped[dict] = mapped_column(JSON, default=dict, server_default="{}")
    color_comfort: Mapped[list] = mapped_column(JSON, default=list, server_default="[]")
    pinterest_access_token: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    pinterest_refresh_token: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
