"""Tests for trade metrics and summary calculations."""

from datetime import datetime, timedelta, timezone

from ..domain.trade.enums import TradeType
from ..domain.trade.trade_domain import TradeDomain
from ..services.trade_metrics import compute_summary, matches_tags


def _trade(
    *,
    open_price: float = 100,
    close_price: float | None = None,
    quantity: float = 10,
    trade_type: TradeType = TradeType.buy,
    opened_at: datetime | None = None,
    closed_at: datetime | None = None,
    tags: list[str] | None = None,
) -> TradeDomain:
    now = datetime.now(timezone.utc)
    resolved_opened_at = opened_at or (now - timedelta(days=1))
    resolved_closed_at = closed_at
    if close_price is not None and resolved_closed_at is None:
        resolved_closed_at = now
    return TradeDomain(
        symbol="BTCUSDT",
        type=trade_type,
        open_price=open_price,
        quantity=quantity,
        opened_at=resolved_opened_at,
        close_price=close_price,
        closed_at=resolved_closed_at,
        tags=tags,
    )


class TestMatchesTags:
    def test_no_filter_matches_all(self):
        assert matches_tags(["a"], None) is True
        assert matches_tags(None, []) is True

    def test_or_semantics(self):
        assert matches_tags(["breakout", "scalp"], ["scalp"]) is True
        assert matches_tags(["breakout"], ["scalp"]) is False
        assert matches_tags(None, ["scalp"]) is False


class TestComputeSummary:
    def test_trade_domain_coerces_string_type_for_pnl(self):
        """TradeDomain must normalize DB string type so PnL direction is correct."""
        now = datetime.now(timezone.utc)
        trade = TradeDomain(
            symbol="BTCUSDT",
            type="buy",
            open_price=100,
            quantity=10,
            opened_at=now - timedelta(days=1),
            close_price=110,
            closed_at=now,
        )
        result = compute_summary([trade])
        assert result["total_pnl"] == 100.0

    def test_open_equity_excludes_closed(self):
        open_trade = _trade(close_price=None, closed_at=None)
        closed_trade = _trade(
            close_price=110,
            closed_at=datetime.now(timezone.utc),
        )
        result = compute_summary([open_trade, closed_trade])
        assert result["open_equity"] == 100 * 10

    def test_total_pnl_buy_trade_from_orm_style_type(self):
        """Buy trades must not be treated as sells when type is coerced from DB string."""
        winner = _trade(
            close_price=110,
            closed_at=datetime.now(timezone.utc),
            trade_type=TradeType.buy,
        )
        result = compute_summary([winner])
        assert result["total_pnl"] == 100.0

    def test_total_pnl_sums_closed_trades(self):
        winner = _trade(close_price=110, closed_at=datetime.now(timezone.utc))
        loser = _trade(
            close_price=90,
            closed_at=datetime.now(timezone.utc),
            trade_type=TradeType.buy,
        )
        result = compute_summary([winner, loser])
        assert result["total_pnl"] == 0.0

    def test_last_7_days_uses_opened_at(self):
        now = datetime.now(timezone.utc)
        recent = _trade(
            close_price=110,
            closed_at=now,
            opened_at=now - timedelta(days=2),
        )
        old = _trade(
            close_price=120,
            closed_at=now - timedelta(days=29),
            opened_at=now - timedelta(days=30),
        )
        result = compute_summary([recent, old])
        assert result["pnl_last_7_days"] == 100.0
        assert result["volume_last_7_days"] == (100 + 110) * 10
