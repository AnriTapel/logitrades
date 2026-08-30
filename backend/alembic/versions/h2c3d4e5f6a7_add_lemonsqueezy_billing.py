"""add lemonsqueezy billing columns and subscriptions table

Revision ID: h2c3d4e5f6a7
Revises: g1b2c3d4e5f6
Create Date: 2026-08-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "h2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "g1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("lemonsqueezy_customer_id", sa.String(), nullable=True),
    )
    op.create_index(
        "ix_users_lemonsqueezy_customer_id",
        "users",
        ["lemonsqueezy_customer_id"],
        unique=True,
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("lemonsqueezy_subscription_id", sa.String(), nullable=False),
        sa.Column("lemonsqueezy_customer_id", sa.String(), nullable=True),
        sa.Column("product_id", sa.String(), nullable=True),
        sa.Column("variant_id", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("renews_at", sa.String(), nullable=True),
        sa.Column("ends_at", sa.String(), nullable=True),
        sa.Column("trial_ends_at", sa.String(), nullable=True),
        sa.Column("card_brand", sa.String(), nullable=True),
        sa.Column("card_last_four", sa.String(), nullable=True),
        sa.Column("created_at", sa.String(), nullable=True),
        sa.Column("updated_at", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_subscriptions_id", "subscriptions", ["id"], unique=False)
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"], unique=False)
    op.create_index(
        "ix_subscriptions_lemonsqueezy_subscription_id",
        "subscriptions",
        ["lemonsqueezy_subscription_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_subscriptions_lemonsqueezy_subscription_id",
        table_name="subscriptions",
    )
    op.drop_index("ix_subscriptions_user_id", table_name="subscriptions")
    op.drop_index("ix_subscriptions_id", table_name="subscriptions")
    op.drop_table("subscriptions")
    op.drop_index("ix_users_lemonsqueezy_customer_id", table_name="users")
    op.drop_column("users", "lemonsqueezy_customer_id")
