"""add trade list indexes

Revision ID: d8e1f2a3b4c5
Revises: b5f2a1c9d3e4
Create Date: 2026-07-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'd8e1f2a3b4c5'
down_revision: Union[str, Sequence[str], None] = 'b5f2a1c9d3e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('ix_trades_user_id_opened_at', 'trades', ['user_id', 'opened_at'])
    op.create_index('ix_trades_user_id_closed_at', 'trades', ['user_id', 'closed_at'])


def downgrade() -> None:
    op.drop_index('ix_trades_user_id_closed_at', table_name='trades')
    op.drop_index('ix_trades_user_id_opened_at', table_name='trades')
