"""Convert trade quantity to notional for leveraged trades

Revision ID: a1b2c3d4e5f6
Revises: 77790d8c0077
Create Date: 2026-05-26 23:50:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '77790d8c0077'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Store notional quantity: quantity * leverage for leveraged trades."""
    op.execute(
        """
        UPDATE trades
        SET quantity = quantity * leverage
        WHERE leverage IS NOT NULL AND leverage > 1
        """
    )


def downgrade() -> None:
    """Revert notional quantity back to base units."""
    op.execute(
        """
        UPDATE trades
        SET quantity = quantity / leverage
        WHERE leverage IS NOT NULL AND leverage > 1
        """
    )
