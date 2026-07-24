"""add portfolios and subscription plan

Revision ID: f0a1b2c3d4e5
Revises: e9f0a1b2c3d4
Create Date: 2026-07-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f0a1b2c3d4e5"
down_revision: Union[str, Sequence[str], None] = "e9f0a1b2c3d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("plan", sa.String(), nullable=False, server_default="free"),
    )

    op.create_table(
        "portfolios",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("starting_capital", sa.Float(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.String(), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("status", sa.String(), nullable=False, server_default="active"),
        sa.Column("created_at", sa.String(), nullable=True),
    )
    op.create_index("ix_portfolios_user_id", "portfolios", ["user_id"])
    op.create_index("ix_portfolios_id", "portfolios", ["id"])

    op.create_table(
        "balance_transactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("portfolio_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("occurred_at", sa.String(), nullable=False),
        sa.Column("note", sa.String(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=True),
    )
    op.create_index(
        "ix_balance_transactions_portfolio_id",
        "balance_transactions",
        ["portfolio_id"],
    )
    op.create_index(
        "ix_balance_transactions_user_id",
        "balance_transactions",
        ["user_id"],
    )
    op.create_index("ix_balance_transactions_id", "balance_transactions", ["id"])

    op.add_column("trades", sa.Column("portfolio_id", sa.Integer(), nullable=True))

    # Backfill: one default portfolio per user, link trades, ensure plan=free
    conn = op.get_bind()
    users = conn.execute(sa.text("SELECT id, created_at FROM users")).fetchall()
    for user_id, created_at in users:
        started = created_at or "1970-01-01T00:00:00Z"
        result = conn.execute(
            sa.text(
                """
                INSERT INTO portfolios
                    (user_id, name, starting_capital, started_at, is_default, status, created_at)
                VALUES
                    (:user_id, 'Default', 0, :started_at, true, 'active', :created_at)
                RETURNING id
                """
            ),
            {
                "user_id": user_id,
                "started_at": started,
                "created_at": started,
            },
        )
        portfolio_id = result.scalar_one()
        conn.execute(
            sa.text(
                "UPDATE trades SET portfolio_id = :portfolio_id WHERE user_id = :user_id"
            ),
            {"portfolio_id": portfolio_id, "user_id": user_id},
        )

    op.alter_column("trades", "portfolio_id", nullable=False)
    op.create_index("ix_trades_portfolio_id", "trades", ["portfolio_id"])
    op.create_index(
        "ix_trades_user_id_portfolio_id",
        "trades",
        ["user_id", "portfolio_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_trades_user_id_portfolio_id", table_name="trades")
    op.drop_index("ix_trades_portfolio_id", table_name="trades")
    op.drop_column("trades", "portfolio_id")

    op.drop_index("ix_balance_transactions_id", table_name="balance_transactions")
    op.drop_index(
        "ix_balance_transactions_user_id", table_name="balance_transactions"
    )
    op.drop_index(
        "ix_balance_transactions_portfolio_id",
        table_name="balance_transactions",
    )
    op.drop_table("balance_transactions")

    op.drop_index("ix_portfolios_id", table_name="portfolios")
    op.drop_index("ix_portfolios_user_id", table_name="portfolios")
    op.drop_table("portfolios")

    op.drop_column("users", "plan")
