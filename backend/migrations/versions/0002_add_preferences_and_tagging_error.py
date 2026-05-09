"""add profile preferences and wardrobe tagging_error

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("wardrobe_items", sa.Column("tagging_error", sa.Boolean, server_default="false", nullable=False))

    op.add_column("profile", sa.Column("style_preferences", postgresql.JSON, server_default="[]", nullable=False))
    op.add_column("profile", sa.Column("fit_preferences", postgresql.JSON, server_default="{}", nullable=False))
    op.add_column("profile", sa.Column("color_comfort", postgresql.JSON, server_default="[]", nullable=False))


def downgrade() -> None:
    op.drop_column("wardrobe_items", "tagging_error")
    op.drop_column("profile", "style_preferences")
    op.drop_column("profile", "fit_preferences")
    op.drop_column("profile", "color_comfort")
