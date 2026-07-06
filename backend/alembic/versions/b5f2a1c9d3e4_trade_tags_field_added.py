"""trade tags field added

Revision ID: b5f2a1c9d3e4
Revises: 4e3ee8fdaccd
Create Date: 2026-07-05 16:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b5f2a1c9d3e4'
down_revision: Union[str, Sequence[str], None] = '4e3ee8fdaccd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'trades',
        sa.Column('tags', sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('trades', 'tags')
