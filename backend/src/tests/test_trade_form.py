"""
Tests for trade form validation covering the API payload sent from the journal
trade form (camelCase TradeForm model -> TradeDomain).

Mirrors frontend flow:
  trade-form.svelte -> journal/+page.server.ts -> POST/PUT /trades
"""

import pytest
from pydantic import ValidationError
from pydantic_core import PydanticCustomError

from ..models.trade.trade_form import TradeForm


# =============================================================================
# SUCCESS CASES
# =============================================================================

class TestValidTradeForm:
    """Tests for successful trade form scenarios."""

    def test_valid_trade_form_minimal(self, valid_trade_form: dict):
        """Minimal required fields from a new trade submission."""
        trade_form = TradeForm(**valid_trade_form)
        trade = trade_form.to_trade()

        assert trade.symbol == "BTCUSDT"
        assert trade.type.value == "buy"
        assert trade.open_price == 100
        assert trade.quantity == 10
        assert trade.take_profit is None
        assert trade.stop_loss is None
        assert trade.leverage is None
        assert trade.close_price is None
        assert trade.closed_at is None
        assert trade.comment is None
        assert trade.tags is None

    def test_valid_trade_form_full(self, valid_trade_form: dict):
        """Complete trade with optional fields populated."""
        payload = {
            **valid_trade_form,
            "takeProfit": 150.0,
            "stopLoss": 80.0,
            "useLeverage": True,
            "leverage": 5,
            "closePrice": 120.0,
            "closedAt": "2025-01-05T15:00:00Z",
            "comment": "Breakout entry",
            "tags": ["breakout", "scalp"],
        }

        trade_form = TradeForm(**payload)
        trade = trade_form.to_trade()

        assert trade.take_profit == 150
        assert trade.stop_loss == 80
        assert trade.leverage == 5
        assert trade.close_price == 120
        assert trade.comment == "Breakout entry"
        assert trade.tags == ["breakout", "scalp"]

    def test_leverage_ignored_when_use_leverage_false(self, valid_trade_form: dict):
        """Frontend sends leverage=1 with useLeverage=false; backend stores None."""
        payload = {**valid_trade_form, "useLeverage": False, "leverage": 10}

        trade = TradeForm(**payload).to_trade()

        assert trade.leverage is None

    def test_leverage_persisted_when_use_leverage_true(self, valid_trade_form: dict):
        """Leveraged form stores leverage from payload."""
        payload = {**valid_trade_form, "useLeverage": True, "leverage": 10, "quantity": 1000}

        trade = TradeForm(**payload).to_trade()

        assert trade.leverage == 10
        assert trade.quantity == 1000

    def test_edit_mode_preserves_id_and_created_at(self, valid_trade_form: dict):
        """Update payload includes id and createdAt from the form."""
        payload = {
            **valid_trade_form,
            "id": 42,
            "createdAt": "2024-12-01T08:00:00Z",
        }

        trade = TradeForm(**payload).to_trade()

        assert trade.id == 42
        assert trade.created_at.isoformat().startswith("2024-12-01T08:00:00")

    def test_tags_normalized_deduped_and_trimmed(self, valid_trade_form: dict):
        """Tags are trimmed, deduplicated case-insensitively, empties dropped."""
        payload = {
            **valid_trade_form,
            "tags": [" breakout ", "BREAKOUT", "scalp"],
        }

        trade_form = TradeForm(**payload)

        assert trade_form.tags == ["breakout", "scalp"]
        assert trade_form.to_trade().tags == ["breakout", "scalp"]

    def test_empty_tags_become_none(self, valid_trade_form: dict):
        """Empty tag list is stored as None."""
        trade_form = TradeForm(**valid_trade_form, tags=[])

        assert trade_form.tags is None
        assert trade_form.to_trade().tags is None

    def test_whitespace_only_tags_become_none(self, valid_trade_form: dict):
        """Whitespace-only tags are dropped; result is None when nothing remains."""
        trade_form = TradeForm(**valid_trade_form, tags=["  ", ""])

        assert trade_form.tags is None


# =============================================================================
# PYDANTIC VALIDATION ERRORS (ValidationError from TradeForm)
# =============================================================================

class TestSymbolValidation:
    """Tests for symbol field validation."""

    def test_symbol_empty(self, valid_trade_form: dict):
        with pytest.raises(ValidationError):
            TradeForm(**{**valid_trade_form, "symbol": ""})

    def test_symbol_too_long(self, valid_trade_form: dict):
        with pytest.raises(ValidationError):
            TradeForm(**{**valid_trade_form, "symbol": "VERYLONGSYMBOL123"})


class TestTradeTypeValidation:
    """Tests for tradeType field validation."""

    def test_trade_type_invalid(self, valid_trade_form: dict):
        with pytest.raises(ValidationError):
            TradeForm(**{**valid_trade_form, "tradeType": "short"})


class TestOpenPriceValidation:
    """Tests for openPrice field validation."""

    def test_open_price_zero(self, valid_trade_form: dict):
        with pytest.raises(ValidationError):
            TradeForm(**{**valid_trade_form, "openPrice": 0})

    def test_open_price_negative(self, valid_trade_form: dict):
        with pytest.raises(ValidationError):
            TradeForm(**{**valid_trade_form, "openPrice": -50})


class TestTagsValidation:
    """Tests for tags field validation (aligned with frontend tagSchema)."""

    def test_too_many_tags(self, valid_trade_form: dict):
        with pytest.raises(ValidationError) as exc_info:
            TradeForm(**{**valid_trade_form, "tags": ["a", "b", "c", "d"]})

        assert "Maximum 3 tags per trade" in str(exc_info.value)

    def test_tag_too_long(self, valid_trade_form: dict):
        with pytest.raises(ValidationError) as exc_info:
            TradeForm(**{**valid_trade_form, "tags": ["x" * 17]})

        assert "Each tag must be at most 16 characters" in str(exc_info.value)

    def test_tag_invalid_characters(self, valid_trade_form: dict):
        with pytest.raises(ValidationError) as exc_info:
            TradeForm(**{**valid_trade_form, "tags": ["bad tag"]})

        assert "Tags can contain only letters, numbers, - and _" in str(exc_info.value)


class TestRequiredFields:
    """Tests for required form fields."""

    def test_missing_use_leverage(self, valid_trade_form: dict):
        payload = {k: v for k, v in valid_trade_form.items() if k != "useLeverage"}

        with pytest.raises(ValidationError):
            TradeForm(**payload)

    def test_missing_trade_type(self, valid_trade_form: dict):
        payload = {k: v for k, v in valid_trade_form.items() if k != "tradeType"}

        with pytest.raises(ValidationError):
            TradeForm(**payload)


# =============================================================================
# BUSINESS LOGIC ERRORS (PydanticCustomError from TradeDomain)
# =============================================================================

class TestStopLossBusinessLogic:
    """Tests for stop loss business logic validation."""

    def test_stop_loss_too_high_for_buy(self, valid_trade_form: dict):
        trade_form = TradeForm(**{**valid_trade_form, "tradeType": "buy", "stopLoss": 110})

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_form.to_trade()

        assert exc_info.value.message_template == "For buy trades, stop loss must be less than open price."

    def test_stop_loss_too_low_for_sell(self, valid_trade_form: dict):
        trade_form = TradeForm(**{**valid_trade_form, "tradeType": "sell", "stopLoss": 90})

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_form.to_trade()

        assert exc_info.value.message_template == "For sell trades, stop loss must be greater than open price."


class TestTakeProfitBusinessLogic:
    """Tests for take profit business logic validation."""

    def test_take_profit_too_low_for_buy(self, valid_trade_form: dict):
        trade_form = TradeForm(**{**valid_trade_form, "tradeType": "buy", "takeProfit": 90})

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_form.to_trade()

        assert exc_info.value.message_template == "For buy trades, take profit must be greater than open price."

    def test_take_profit_too_high_for_sell(self, valid_trade_form: dict):
        trade_form = TradeForm(**{**valid_trade_form, "tradeType": "sell", "takeProfit": 110})

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_form.to_trade()

        assert exc_info.value.message_template == "For sell trades, take profit must be less than open price."


class TestClosedAtBusinessLogic:
    """Tests for closed_at business logic validation."""

    def test_closed_at_before_opened_at(self, valid_trade_form: dict):
        trade_form = TradeForm(**{
            **valid_trade_form,
            "openedAt": "2025-01-10T10:00:00Z",
            "closedAt": "2025-01-05T10:00:00Z",
            "closePrice": 150.0,
        })

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_form.to_trade()

        assert exc_info.value.message_template == "Close date must be after opened date."


class TestCloseTradeBusinessLogic:
    """Tests for close trade data completeness validation."""

    def test_close_price_without_closed_at(self, valid_trade_form: dict):
        trade_form = TradeForm(**{**valid_trade_form, "closePrice": 150.0})

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_form.to_trade()

        assert exc_info.value.message_template == "Provide both price and date to close trade."

    def test_closed_at_without_close_price(self, valid_trade_form: dict):
        trade_form = TradeForm(**{
            **valid_trade_form,
            "closedAt": "2025-01-05T15:00:00Z",
        })

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_form.to_trade()

        assert exc_info.value.message_template == "Provide both price and date to close trade."
