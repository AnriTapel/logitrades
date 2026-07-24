"""add user and portfolio currency

Revision ID: g1b2c3d4e5f6
Revises: f0a1b2c3d4e5
Create Date: 2026-07-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "g1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f0a1b2c3d4e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("currency", sa.String(), nullable=False, server_default="USD"),
    )
    op.add_column(
        "portfolios",
        sa.Column("currency", sa.String(), nullable=False, server_default="USD"),
    )


def downgrade() -> None:
    op.drop_column("portfolios", "currency")
    op.drop_column("users", "currency")
