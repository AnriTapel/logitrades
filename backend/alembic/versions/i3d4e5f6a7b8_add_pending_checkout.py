"""add pending checkout columns on users

Revision ID: i3d4e5f6a7b8
Revises: h2c3d4e5f6a7
Create Date: 2026-08-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "i3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "h2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("pending_checkout_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("pending_checkout_url", sa.String(), nullable=True))
    op.add_column("users", sa.Column("pending_checkout_variant", sa.String(), nullable=True))
    op.add_column("users", sa.Column("pending_checkout_expires_at", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "pending_checkout_expires_at")
    op.drop_column("users", "pending_checkout_variant")
    op.drop_column("users", "pending_checkout_url")
    op.drop_column("users", "pending_checkout_id")
