from datetime import datetime
from sqlalchemy import String, Text, DateTime, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), server_default="New chat")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int | None] = mapped_column(ForeignKey("chat_sessions.id"), nullable=True)
    role: Mapped[str] = mapped_column(String(20))          # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text)
    extra: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class OutfitSuggestion(Base):
    __tablename__ = "outfit_suggestions"

    id: Mapped[int] = mapped_column(primary_key=True)
    conversation_id: Mapped[int] = mapped_column()
    outfit_index: Mapped[int] = mapped_column()            # 1-5
    item_ids: Mapped[list] = mapped_column(JSON)
    occasion: Mapped[str] = mapped_column(String(50))
    reasoning: Mapped[str] = mapped_column(Text)
    mockup_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    accepted: Mapped[bool | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
