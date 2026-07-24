"""Tests for portfolio_service."""

from datetime import datetime, timezone

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from ..db import Base, TradeORM, UserORM
from ..domain.portfolio.enums import (
    BalanceTransactionType,
    PortfolioStatus,
    SubscriptionPlan,
)
from ..services import portfolio_service


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    session.add(
        UserORM(
            id=1,
            username="trader",
            email="t@example.com",
            hashed_password="x",
            plan=SubscriptionPlan.free.value,
        )
    )
    session.commit()
    yield session
    session.close()


def _set_plan(db, plan: SubscriptionPlan):
    user = db.query(UserORM).filter(UserORM.id == 1).first()
    user.plan = plan.value
    db.commit()


class TestDefaultPortfolio:
    def test_create_and_get_default(self, db_session):
        portfolio = portfolio_service.create_default_portfolio(db_session, 1)
        assert portfolio.name == "Default"
        assert portfolio.is_default is True
        assert portfolio.starting_capital == 0.0

        fetched = portfolio_service.get_default_portfolio(db_session, 1)
        assert fetched is not None
        assert fetched.id == portfolio.id


class TestCreatePortfolioLimits:
    def test_free_cannot_create_beyond_default(self, db_session):
        portfolio_service.create_default_portfolio(db_session, 1)
        with pytest.raises(HTTPException) as exc:
            portfolio_service.create_portfolio(db_session, 1, name="Extra")
        assert exc.value.status_code == 403

    def test_max_can_create_up_to_five(self, db_session):
        _set_plan(db_session, SubscriptionPlan.max)
        portfolio_service.create_default_portfolio(db_session, 1)
        for i in range(4):
            portfolio_service.create_portfolio(db_session, 1, name=f"P{i}")
        with pytest.raises(HTTPException) as exc:
            portfolio_service.create_portfolio(db_session, 1, name="TooMany")
        assert exc.value.status_code == 403


class TestPatchAndDelete:
    def test_cannot_archive_last_active(self, db_session):
        portfolio = portfolio_service.create_default_portfolio(db_session, 1)
        with pytest.raises(HTTPException) as exc:
            portfolio_service.patch_portfolio(
                db_session,
                1,
                portfolio.id,
                status=PortfolioStatus.archived,
            )
        assert exc.value.status_code == 403

    def test_cannot_delete_default(self, db_session):
        portfolio = portfolio_service.create_default_portfolio(db_session, 1)
        with pytest.raises(HTTPException) as exc:
            portfolio_service.delete_portfolio(db_session, 1, portfolio.id)
        assert exc.value.status_code == 403

    def test_cannot_delete_with_trades(self, db_session):
        _set_plan(db_session, SubscriptionPlan.max)
        portfolio_service.create_default_portfolio(db_session, 1)
        extra = portfolio_service.create_portfolio(db_session, 1, name="Extra")
        db_session.add(
            TradeORM(
                user_id=1,
                symbol="BTC",
                type="buy",
                open_price=1,
                quantity=1,
                opened_at="2025-01-01T00:00:00Z",
                portfolio_id=extra.id,
            )
        )
        db_session.commit()
        with pytest.raises(HTTPException) as exc:
            portfolio_service.delete_portfolio(db_session, 1, extra.id)
        assert exc.value.status_code == 403
        assert "trades" in exc.value.detail.lower()

    def test_archived_only_allows_unarchive(self, db_session):
        _set_plan(db_session, SubscriptionPlan.max)
        default = portfolio_service.create_default_portfolio(db_session, 1)
        extra = portfolio_service.create_portfolio(db_session, 1, name="Extra")
        portfolio_service.patch_portfolio(
            db_session, 1, extra.id, status=PortfolioStatus.archived
        )
        with pytest.raises(HTTPException) as exc:
            portfolio_service.patch_portfolio(
                db_session, 1, extra.id, name="Nope"
            )
        assert exc.value.status_code == 403

        restored = portfolio_service.patch_portfolio(
            db_session, 1, extra.id, status=PortfolioStatus.active
        )
        assert restored.status == PortfolioStatus.active.value
        assert default.id is not None


class TestSummaryAndTransactions:
    def test_summary_math(self, db_session):
        _set_plan(db_session, SubscriptionPlan.pro)
        portfolio = portfolio_service.create_default_portfolio(db_session, 1)
        portfolio_service.patch_portfolio(
            db_session,
            1,
            portfolio.id,
            starting_capital=1000.0,
            started_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
        )
        portfolio_service.add_transaction(
            db_session,
            1,
            portfolio.id,
            type=BalanceTransactionType.deposit,
            amount=200,
            occurred_at=datetime(2025, 1, 2, tzinfo=timezone.utc),
        )
        portfolio_service.add_transaction(
            db_session,
            1,
            portfolio.id,
            type=BalanceTransactionType.withdrawal,
            amount=50,
            occurred_at=datetime(2025, 1, 3, tzinfo=timezone.utc),
        )
        db_session.add(
            TradeORM(
                user_id=1,
                symbol="BTC",
                type="buy",
                open_price=100,
                quantity=1,
                opened_at="2025-01-04T00:00:00Z",
                close_price=150,
                closed_at="2025-01-05T00:00:00Z",
                portfolio_id=portfolio.id,
            )
        )
        db_session.add(
            TradeORM(
                user_id=1,
                symbol="ETH",
                type="buy",
                open_price=50,
                quantity=2,
                opened_at="2025-01-06T00:00:00Z",
                portfolio_id=portfolio.id,
            )
        )
        db_session.commit()

        summary = portfolio_service.get_portfolio_summary(
            db_session, 1, portfolio.id
        )
        # cash = 1000 + 200 - 50 = 1150
        assert summary["cash"] == 1150.0
        assert summary["realized_pnl"] == 50.0
        assert summary["equity"] == 1200.0
        # trading_return = 1200 - 1000 - 150 = 50; return_pct = 0.05
        assert summary["return_pct"] == pytest.approx(0.05)
        assert summary["open_notional"] == 100.0

    def test_free_cannot_add_transaction(self, db_session):
        portfolio = portfolio_service.create_default_portfolio(db_session, 1)
        with pytest.raises(HTTPException) as exc:
            portfolio_service.add_transaction(
                db_session,
                1,
                portfolio.id,
                type=BalanceTransactionType.deposit,
                amount=10,
                occurred_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
            )
        assert exc.value.status_code == 403


class TestEnsureWritable:
    def test_archived_raises_403(self, db_session):
        _set_plan(db_session, SubscriptionPlan.max)
        portfolio_service.create_default_portfolio(db_session, 1)
        extra = portfolio_service.create_portfolio(db_session, 1, name="Extra")
        portfolio_service.patch_portfolio(
            db_session, 1, extra.id, status=PortfolioStatus.archived
        )
        with pytest.raises(HTTPException) as exc:
            portfolio_service.ensure_portfolio_writable(
                db_session, 1, extra.id
            )
        assert exc.value.status_code == 403

    def test_missing_raises_404(self, db_session):
        with pytest.raises(HTTPException) as exc:
            portfolio_service.ensure_portfolio_writable(db_session, 1, 999)
        assert exc.value.status_code == 404
