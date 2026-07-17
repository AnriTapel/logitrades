"""add trade fee

Revision ID: e9f0a1b2c3d4
Revises: d8e1f2a3b4c5
Create Date: 2026-07-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e9f0a1b2c3d4'
down_revision: Union[str, Sequence[str], None] = 'd8e1f2a3b4c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('trades', sa.Column('fee', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('trades', 'fee')
