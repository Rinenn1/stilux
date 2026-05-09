from datetime import datetime
from sqlalchemy import String, Text, DateTime, Boolean, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class WardrobeItem(Base):
    __tablename__ = "wardrobe_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    filename: Mapped[str] = mapped_column(String(255))
    original_name: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(String(500))

    # AI-generated tags (editable)
    name: Mapped[str] = mapped_column(String(200), default="")
    category: Mapped[str] = mapped_column(String(50), default="")      # tops, bottoms, shoes, outerwear, accessories
    color: Mapped[str] = mapped_column(String(100), default="")
    formality: Mapped[str] = mapped_column(String(50), default="")     # casual, smart-casual, formal
    season: Mapped[str] = mapped_column(String(100), default="")       # spring, summer, autumn, winter, all
    occasions: Mapped[list] = mapped_column(JSON, default=list)        # [work, casual, date, workout, formal, travel]
    style_notes: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[list] = mapped_column(JSON, default=list)             # extra free-form tags
    tagging_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    tagging_error: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
