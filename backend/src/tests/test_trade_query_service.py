"""Tests for trade list query service."""

from datetime import date, datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from ..db import Base, TradeORM
from ..domain.trade.enums import TradeType
from ..models.trade.trade_list_query import TradeListQuery
from ..services.trade_query_service import (
    _lower_bound_iso,
    _upper_bound_iso,
    get_facets,
    get_summary,
    list_trades,
)


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    session.add(
        TradeORM(
            user_id=1,
            symbol="btcusdt",
            type="buy",
            open_price=100,
            quantity=10,
            opened_at="2025-06-01T10:00:00Z",
            close_price=None,
            closed_at=None,
            created_at="2025-06-01T10:00:00Z",
            tags=["breakout"],
        )
    )
    session.add(
        TradeORM(
            user_id=1,
            symbol="ETHUSDT",
            type="sell",
            open_price=200,
            quantity=5,
            opened_at="2025-05-01T10:00:00Z",
            close_price=180,
            closed_at="2025-05-10T10:00:00Z",
            created_at="2025-05-01T10:00:00Z",
            tags=["scalp", "eth"],
        )
    )
    session.add(
        TradeORM(
            user_id=2,
            symbol="OTHER",
            type="buy",
            open_price=50,
            quantity=1,
            opened_at="2025-01-01T10:00:00Z",
            close_price=None,
            closed_at=None,
            created_at="2025-01-01T10:00:00Z",
        )
    )
    session.commit()
    yield session
    session.close()


class TestListTrades:
    def test_status_open(self, db_session):
        result = list_trades(
            db_session,
            1,
            TradeListQuery(status="open"),
        )
        assert result.total == 1
        assert result.items[0].symbol == "btcusdt"

    def test_status_closed(self, db_session):
        result = list_trades(
            db_session,
            1,
            TradeListQuery(status="closed"),
        )
        assert result.total == 1
        assert result.items[0].symbol == "ETHUSDT"

    def test_symbol_filter_case_insensitive(self, db_session):
        result = list_trades(
            db_session,
            1,
            TradeListQuery(status="open", symbol="BTC"),
        )
        assert result.total == 1

    def test_type_filter(self, db_session):
        result = list_trades(
            db_session,
            1,
            TradeListQuery(status="closed", type=TradeType.sell),
        )
        assert result.total == 1

    def test_pagination(self, db_session):
        result = list_trades(
            db_session,
            1,
            TradeListQuery(status="closed", limit=1, offset=0),
        )
        assert result.total == 1
        assert len(result.items) == 1
        assert result.limit == 1

    def test_paginate_false_returns_all(self, db_session):
        result = list_trades(
            db_session,
            1,
            TradeListQuery(status="closed", paginate=False),
        )
        assert result.total == 1
        assert result.limit is None

    def test_date_filter_on_closed_at(self, db_session):
        result = list_trades(
            db_session,
            1,
            TradeListQuery(
                status="closed",
                date_from=date(2025, 5, 9),
                date_to=date(2025, 5, 11),
            ),
        )
        assert result.total == 1

    def test_date_filter_excludes_out_of_range(self, db_session):
        result = list_trades(
            db_session,
            1,
            TradeListQuery(
                status="closed",
                date_from=date(2025, 6, 1),
            ),
        )
        assert result.total == 0

    def test_date_filter_accepts_iso_datetime(self, db_session):
        """Client DateTimePicker sends UTC ISO; backend must accept it."""
        result = list_trades(
            db_session,
            1,
            TradeListQuery(
                status="closed",
                date_from="2025-05-09T21:00:00.000Z",
                date_to="2025-05-10T21:00:00.000Z",
            ),
        )
        assert result.total == 1


class TestDateBoundNormalization:
    def test_date_only_bounds(self):
        assert _lower_bound_iso("2025-05-10") == "2025-05-10T00:00:00Z"
        assert _upper_bound_iso("2025-05-10") == "2025-05-10T23:59:59.999000Z"

    def test_iso_datetime_bounds(self):
        # Local midnight expressed as UTC — use as-is for from, +1 day for to
        assert _lower_bound_iso("2025-05-09T21:00:00.000Z") == "2025-05-09T21:00:00Z"
        assert _upper_bound_iso("2025-05-09T21:00:00.000Z") == "2025-05-10T20:59:59.999000Z"


class TestFacetsAndSummary:
    def test_facets_for_user(self, db_session):
        facets = get_facets(db_session, 1)
        assert facets.symbols == ["BTCUSDT", "ETHUSDT"]
        assert facets.tags == ["breakout", "eth", "scalp"]

    def test_summary_buy_trade_pnl(self, db_session):
        """Summary total_pnl must be correct for long (buy) closed trades."""
        db_session.add(
            TradeORM(
                user_id=1,
                symbol="LONG",
                type="buy",
                open_price=100,
                quantity=10,
                opened_at="2025-06-01T10:00:00Z",
                close_price=120,
                closed_at="2025-06-02T10:00:00Z",
                created_at="2025-06-01T10:00:00Z",
            )
        )
        db_session.commit()
        summary = get_summary(db_session, 1)
        # Existing closed sell +100, new closed buy +200 → total +300
        assert summary.total_pnl == 300.0

    def test_summary_for_user(self, db_session):
        summary = get_summary(db_session, 1)
        assert summary.open_equity == 1000
        assert summary.total_pnl == 100.0
