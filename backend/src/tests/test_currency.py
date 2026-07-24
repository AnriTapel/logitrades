"""Tests for user/portfolio currency persistence."""

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from ..db import Base, UserORM
from ..domain.currency import CurrencyCode, DEFAULT_CURRENCY, parse_currency_code
from ..domain.portfolio.enums import PortfolioStatus, SubscriptionPlan
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
            currency=DEFAULT_CURRENCY,
        )
    )
    session.commit()
    yield session
    session.close()


def _set_plan(db, plan: SubscriptionPlan):
    user = db.query(UserORM).filter(UserORM.id == 1).first()
    user.plan = plan.value
    db.commit()


class TestParseCurrency:
    def test_valid_codes(self):
        for code in CurrencyCode:
            assert parse_currency_code(code.value) == code.value

    def test_invalid_rejected(self):
        with pytest.raises(ValueError):
            parse_currency_code("XXX")

    def test_none_defaults_usd(self):
        assert parse_currency_code(None) == DEFAULT_CURRENCY


class TestUserCurrency:
    def test_free_syncs_default_portfolio(self, db_session):
        default = portfolio_service.create_default_portfolio(db_session, 1)
        assert default.currency == DEFAULT_CURRENCY

        user = portfolio_service.update_user_currency(db_session, 1, "EUR")
        assert user.currency == "EUR"

        refreshed = portfolio_service.get_default_portfolio(db_session, 1)
        assert refreshed is not None
        assert refreshed.currency == "EUR"

    def test_pro_does_not_rewrite_portfolios(self, db_session):
        _set_plan(db_session, SubscriptionPlan.pro)
        default = portfolio_service.create_default_portfolio(db_session, 1)
        assert default.currency == "USD"

        portfolio_service.update_user_currency(db_session, 1, "GBP")
        refreshed = portfolio_service.get_default_portfolio(db_session, 1)
        assert refreshed is not None
        assert refreshed.currency == "USD"

        user = db_session.query(UserORM).filter(UserORM.id == 1).first()
        assert user.currency == "GBP"

    def test_invalid_currency_rejected(self, db_session):
        with pytest.raises(HTTPException) as exc:
            portfolio_service.update_user_currency(db_session, 1, "XXX")
        assert exc.value.status_code == 400


class TestPortfolioCurrency:
    def test_create_inherits_user_currency(self, db_session):
        _set_plan(db_session, SubscriptionPlan.max)
        portfolio_service.update_user_currency(db_session, 1, "JPY")
        portfolio_service.create_default_portfolio(db_session, 1)
        created = portfolio_service.create_portfolio(db_session, 1, name="Extra")
        assert created.currency == "JPY"

    def test_create_explicit_currency(self, db_session):
        _set_plan(db_session, SubscriptionPlan.max)
        portfolio_service.create_default_portfolio(db_session, 1)
        created = portfolio_service.create_portfolio(
            db_session, 1, name="Extra", currency="CHF"
        )
        assert created.currency == "CHF"

    def test_patch_currency(self, db_session):
        _set_plan(db_session, SubscriptionPlan.pro)
        default = portfolio_service.create_default_portfolio(db_session, 1)
        patched = portfolio_service.patch_portfolio(
            db_session, 1, default.id, currency="AUD"
        )
        assert patched.currency == "AUD"

    def test_patch_currency_blocked_when_archived(self, db_session):
        _set_plan(db_session, SubscriptionPlan.max)
        default = portfolio_service.create_default_portfolio(db_session, 1)
        extra = portfolio_service.create_portfolio(db_session, 1, name="Extra")
        portfolio_service.patch_portfolio(
            db_session, 1, extra.id, status=PortfolioStatus.archived
        )
        with pytest.raises(HTTPException) as exc:
            portfolio_service.patch_portfolio(
                db_session, 1, extra.id, currency="EUR"
            )
        assert exc.value.status_code == 403
        # default still active and writable
        assert default.status == PortfolioStatus.active.value
