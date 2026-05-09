"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "wardrobe_items",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("name", sa.String(200), server_default=""),
        sa.Column("category", sa.String(50), server_default=""),
        sa.Column("color", sa.String(100), server_default=""),
        sa.Column("formality", sa.String(50), server_default=""),
        sa.Column("season", sa.String(100), server_default=""),
        sa.Column("occasions", postgresql.JSON, server_default="[]"),
        sa.Column("style_notes", sa.Text, server_default=""),
        sa.Column("tags", postgresql.JSON, server_default="[]"),
        sa.Column("tagging_complete", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "wear_logs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("item_ids", postgresql.JSON, nullable=False),
        sa.Column("source", sa.String(20), nullable=False),
        sa.Column("suggestion_id", sa.Integer, nullable=True),
        sa.Column("worn_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("note", sa.String(500), nullable=True),
    )

    op.create_table(
        "conversations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("extra", postgresql.JSON, server_default="{}"),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "outfit_suggestions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("conversation_id", sa.Integer, nullable=False),
        sa.Column("outfit_index", sa.Integer, nullable=False),
        sa.Column("item_ids", postgresql.JSON, nullable=False),
        sa.Column("occasion", sa.String(50), nullable=False),
        sa.Column("reasoning", sa.Text, nullable=False),
        sa.Column("mockup_path", sa.String(500), nullable=True),
        sa.Column("accepted", sa.Boolean, nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        "profile",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("body_photo_path", sa.String(500), nullable=True),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("profile")
    op.drop_table("outfit_suggestions")
    op.drop_table("conversations")
    op.drop_table("wear_logs")
    op.drop_table("wardrobe_items")
