"""add chat sessions and pinterest tokens

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chat_sessions",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("title", sa.String(200), server_default="New chat", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.add_column("conversations", sa.Column("session_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_conv_session", "conversations", "chat_sessions", ["session_id"], ["id"]
    )

    # Migrate any existing conversations into a "Previous chats" session
    op.execute(sa.text(
        "INSERT INTO chat_sessions (title) "
        "SELECT 'Previous chats' WHERE EXISTS (SELECT 1 FROM conversations)"
    ))
    op.execute(sa.text(
        "UPDATE conversations SET session_id = ("
        "  SELECT id FROM chat_sessions ORDER BY id ASC LIMIT 1"
        ") WHERE session_id IS NULL"
    ))

    op.add_column("profile", sa.Column("pinterest_access_token", sa.String(2000), nullable=True))
    op.add_column("profile", sa.Column("pinterest_refresh_token", sa.String(2000), nullable=True))


def downgrade() -> None:
    op.drop_column("profile", "pinterest_refresh_token")
    op.drop_column("profile", "pinterest_access_token")
    op.drop_constraint("fk_conv_session", "conversations", type_="foreignkey")
    op.drop_column("conversations", "session_id")
    op.drop_table("chat_sessions")
