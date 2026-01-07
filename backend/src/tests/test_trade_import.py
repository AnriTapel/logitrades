"""
Tests for trade import validation covering:
- Data type errors (ValueError from normalize_csv_row)
- Pydantic validation errors (ValidationError from TradeImportModel)
- Business logic errors (PydanticCustomError from TradeDomain)
"""

import pytest
from pydantic import ValidationError
from pydantic_core import PydanticCustomError

from ..utils.normalize_csv_row import normalize_csv_row
from ..models.trade.trade_import import TradeImport
from ..errors.import_errors import format_import_error


# =============================================================================
# SUCCESS CASES
# =============================================================================

class TestValidTradeImport:
    """Tests for successful trade import scenarios."""

    def test_valid_trade_import(self, fields_mapping: dict, valid_row: dict):
        """Complete valid trade passes all validations."""
        row = {
            **valid_row,
            "Take Profit": "150",
            "Stop Loss": "80",
            "Leverage": "2",
            "Close price": "120",
            "Closed At": "2025-01-05T15:00:00Z",
        }

        normalized = normalize_csv_row(row, fields_mapping)
        trade_import = TradeImport(**normalized)
        trade = trade_import.to_trade()

        assert trade.symbol == "BTCUSDT"
        assert trade.type.value == "buy"
        assert trade.open_price == 100
        assert trade.quantity == 10
        assert trade.take_profit == 150
        assert trade.stop_loss == 80
        assert trade.leverage == 2
        assert trade.close_price == 120

    def test_valid_trade_minimal(self, fields_mapping: dict, valid_row: dict):
        """Minimal required fields only."""
        normalized = normalize_csv_row(valid_row, fields_mapping)
        trade_import = TradeImport(**normalized)
        trade = trade_import.to_trade()

        assert trade.symbol == "BTCUSDT"
        assert trade.type.value == "buy"
        assert trade.open_price == 100
        assert trade.quantity == 10
        assert trade.take_profit is None
        assert trade.stop_loss is None
        assert trade.leverage is None
        assert trade.close_price is None
        assert trade.closed_at is None


# =============================================================================
# DATA TYPE ERRORS (ValueError from normalize_csv_row)
# =============================================================================

class TestDataTypeErrors:
    """Tests for ValueError raised during CSV normalization."""

    def test_open_price_not_number(self, fields_mapping: dict, valid_row: dict):
        """Open price with non-numeric value raises ValueError."""
        row = {**valid_row, "Open price": "abc"}

        with pytest.raises(ValueError):
            normalize_csv_row(row, fields_mapping)

    def test_quantity_not_number(self, fields_mapping: dict, valid_row: dict):
        """Quantity with non-numeric value raises ValueError."""
        row = {**valid_row, "Amount": "ten"}

        with pytest.raises(ValueError):
            normalize_csv_row(row, fields_mapping)

    def test_take_profit_not_number(self, fields_mapping: dict, valid_row: dict):
        """Take profit with non-numeric value raises ValueError."""
        row = {**valid_row, "Take Profit": "high"}

        with pytest.raises(ValueError):
            normalize_csv_row(row, fields_mapping)

    def test_stop_loss_not_number(self, fields_mapping: dict, valid_row: dict):
        """Stop loss with non-numeric value raises ValueError."""
        row = {**valid_row, "Stop Loss": "low"}

        with pytest.raises(ValueError):
            normalize_csv_row(row, fields_mapping)

    def test_close_price_not_number(self, fields_mapping: dict, valid_row: dict):
        """Close price with non-numeric value raises ValueError."""
        row = {**valid_row, "Close price": "xyz"}

        with pytest.raises(ValueError):
            normalize_csv_row(row, fields_mapping)

    def test_leverage_not_integer(self, fields_mapping: dict, valid_row: dict):
        """Leverage with float value raises ValueError."""
        row = {**valid_row, "Leverage": "1.5"}

        with pytest.raises(ValueError):
            normalize_csv_row(row, fields_mapping)


# =============================================================================
# PYDANTIC VALIDATION ERRORS (ValidationError from TradeImportModel)
# =============================================================================

class TestSymbolValidation:
    """Tests for symbol field validation."""

    def test_symbol_empty(self, fields_mapping: dict, valid_row: dict):
        """Empty symbol raises ValidationError."""
        row = {**valid_row, "Ticker": ""}

        normalized = normalize_csv_row(row, fields_mapping)

        with pytest.raises(ValidationError) as exc_info:
            TradeImport(**normalized)

        formatted_error = format_import_error(1, exc_info.value)
        assert "Symbol is required." in formatted_error

    def test_symbol_whitespace_only(self, fields_mapping: dict, valid_row: dict):
        """Whitespace-only symbol raises ValidationError."""
        row = {**valid_row, "Ticker": "   "}

        normalized = normalize_csv_row(row, fields_mapping)

        with pytest.raises(ValidationError) as exc_info:
            TradeImport(**normalized)

        formatted_error = format_import_error(1, exc_info.value)
        assert "Symbol is required." in formatted_error

    def test_symbol_too_long(self, fields_mapping: dict, valid_row: dict):
        """Symbol exceeding 16 characters raises ValidationError."""
        row = {**valid_row, "Ticker": "VERYLONGSYMBOL123"}

        normalized = normalize_csv_row(row, fields_mapping)

        with pytest.raises(ValidationError) as exc_info:
            TradeImport(**normalized)

        formatted_error = format_import_error(1, exc_info.value)
        assert "Symbol must be 16 characters or less." in formatted_error


class TestTradeTypeValidation:
    """Tests for trade_type field validation."""

    def test_trade_type_invalid(self, fields_mapping: dict, valid_row: dict):
        """Invalid trade type raises ValidationError."""
        row = {**valid_row, "Type": "short"}

        normalized = normalize_csv_row(row, fields_mapping)

        with pytest.raises(ValidationError) as exc_info:
            TradeImport(**normalized)

        formatted_error = format_import_error(1, exc_info.value)
        assert "Trade type must be 'buy' or 'sell'." in formatted_error

    def test_trade_type_long(self, fields_mapping: dict, valid_row: dict):
        """'long' as trade type raises ValidationError."""
        row = {**valid_row, "Type": "long"}

        normalized = normalize_csv_row(row, fields_mapping)

        with pytest.raises(ValidationError) as exc_info:
            TradeImport(**normalized)

        formatted_error = format_import_error(1, exc_info.value)
        assert "Trade type must be 'buy' or 'sell'." in formatted_error


class TestOpenPriceValidation:
    """Tests for open_price field validation."""

    def test_open_price_zero(self, fields_mapping: dict, valid_row: dict):
        """Zero open price raises ValidationError."""
        row = {**valid_row, "Open price": "0"}

        normalized = normalize_csv_row(row, fields_mapping)

        with pytest.raises(ValidationError) as exc_info:
            TradeImport(**normalized)

        formatted_error = format_import_error(1, exc_info.value)
        assert "Open price must be greater than 0." in formatted_error

    def test_open_price_negative(self, fields_mapping: dict, valid_row: dict):
        """Negative open price raises ValidationError."""
        row = {**valid_row, "Open price": "-50"}

        normalized = normalize_csv_row(row, fields_mapping)

        with pytest.raises(ValidationError) as exc_info:
            TradeImport(**normalized)

        formatted_error = format_import_error(1, exc_info.value)
        assert "Open price must be greater than 0." in formatted_error


class TestQuantityValidation:
    """Tests for quantity field validation."""

    def test_quantity_zero(self, fields_mapping: dict, valid_row: dict):
        """Zero quantity raises ValidationError."""
        row = {**valid_row, "Amount": "0"}

        normalized = normalize_csv_row(row, fields_mapping)

        with pytest.raises(ValidationError) as exc_info:
            TradeImport(**normalized)

        formatted_error = format_import_error(1, exc_info.value)
        assert "Quantity must be greater than 0." in formatted_error

    def test_quantity_negative(self, fields_mapping: dict, valid_row: dict):
        """Negative quantity raises ValidationError."""
        row = {**valid_row, "Amount": "-5"}

        normalized = normalize_csv_row(row, fields_mapping)

        with pytest.raises(ValidationError) as exc_info:
            TradeImport(**normalized)

        formatted_error = format_import_error(1, exc_info.value)
        assert "Quantity must be greater than 0." in formatted_error


class TestLeverageValidation:
    """Tests for leverage field validation."""

    def test_leverage_zero(self, fields_mapping: dict, valid_row: dict):
        """Zero leverage raises ValidationError."""
        row = {**valid_row, "Leverage": "0"}

        normalized = normalize_csv_row(row, fields_mapping)

        with pytest.raises(ValidationError) as exc_info:
            TradeImport(**normalized)

        formatted_error = format_import_error(1, exc_info.value)
        assert "Leverage must be greater than 0." in formatted_error

    def test_leverage_negative(self, fields_mapping: dict, valid_row: dict):
        """Negative leverage raises ValidationError."""
        row = {**valid_row, "Leverage": "-2"}

        normalized = normalize_csv_row(row, fields_mapping)

        with pytest.raises(ValidationError) as exc_info:
            TradeImport(**normalized)

        formatted_error = format_import_error(1, exc_info.value)
        assert "Leverage must be greater than 0." in formatted_error


class TestDateTimeValidation:
    """Tests for datetime field validation."""

    def test_opened_at_invalid_format(self, fields_mapping: dict, valid_row: dict):
        """Invalid opened_at format raises error."""
        row = {**valid_row, "Opened At": "not-a-date"}

        with pytest.raises((ValidationError, ValueError, AssertionError)):
            normalized = normalize_csv_row(row, fields_mapping)
            TradeImport(**normalized)

    def test_closed_at_invalid_format(self, fields_mapping: dict, valid_row: dict):
        """Invalid closed_at format raises ValidationError."""
        row = {**valid_row, "Closed At": "invalid", "Close price": "150"}

        normalized = normalize_csv_row(row, fields_mapping)

        with pytest.raises(ValidationError) as exc_info:
            TradeImport(**normalized)

        formatted_error = format_import_error(1, exc_info.value)
        assert "Closed at must be a valid date/time." in formatted_error


# =============================================================================
# BUSINESS LOGIC ERRORS (PydanticCustomError from TradeDomain)
# =============================================================================

class TestStopLossBusinessLogic:
    """Tests for stop loss business logic validation."""

    def test_stop_loss_too_high_for_buy(self, fields_mapping: dict, valid_row: dict):
        """Buy trade with stop loss >= open price raises error."""
        row = {**valid_row, "Type": "buy", "Open price": "100", "Stop Loss": "110"}

        normalized = normalize_csv_row(row, fields_mapping)
        trade_import = TradeImport(**normalized)

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_import.to_trade()

        assert exc_info.value.message_template == "For buy trades, stop loss must be less than open price."

    def test_stop_loss_equal_to_open_price_for_buy(self, fields_mapping: dict, valid_row: dict):
        """Buy trade with stop loss == open price raises error."""
        row = {**valid_row, "Type": "buy", "Open price": "100", "Stop Loss": "100"}

        normalized = normalize_csv_row(row, fields_mapping)
        trade_import = TradeImport(**normalized)

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_import.to_trade()

        assert exc_info.value.message_template == "For buy trades, stop loss must be less than open price."

    def test_stop_loss_too_low_for_sell(self, fields_mapping: dict, valid_row: dict):
        """Sell trade with stop loss <= open price raises error."""
        row = {**valid_row, "Type": "sell", "Open price": "100", "Stop Loss": "90"}

        normalized = normalize_csv_row(row, fields_mapping)
        trade_import = TradeImport(**normalized)

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_import.to_trade()

        assert exc_info.value.message_template == "For sell trades, stop loss must be greater than open price."

    def test_stop_loss_equal_to_open_price_for_sell(self, fields_mapping: dict, valid_row: dict):
        """Sell trade with stop loss == open price raises error."""
        row = {**valid_row, "Type": "sell", "Open price": "100", "Stop Loss": "100"}

        normalized = normalize_csv_row(row, fields_mapping)
        trade_import = TradeImport(**normalized)

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_import.to_trade()

        assert exc_info.value.message_template == "For sell trades, stop loss must be greater than open price."


class TestTakeProfitBusinessLogic:
    """Tests for take profit business logic validation."""

    def test_take_profit_too_low_for_buy(self, fields_mapping: dict, valid_row: dict):
        """Buy trade with take profit <= open price raises error."""
        row = {**valid_row, "Type": "buy", "Open price": "100", "Take Profit": "90"}

        normalized = normalize_csv_row(row, fields_mapping)
        trade_import = TradeImport(**normalized)

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_import.to_trade()

        assert exc_info.value.message_template == "For buy trades, take profit must be greater than open price."

    def test_take_profit_equal_to_open_price_for_buy(self, fields_mapping: dict, valid_row: dict):
        """Buy trade with take profit == open price raises error."""
        row = {**valid_row, "Type": "buy", "Open price": "100", "Take Profit": "100"}

        normalized = normalize_csv_row(row, fields_mapping)
        trade_import = TradeImport(**normalized)

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_import.to_trade()

        assert exc_info.value.message_template == "For buy trades, take profit must be greater than open price."

    def test_take_profit_too_high_for_sell(self, fields_mapping: dict, valid_row: dict):
        """Sell trade with take profit >= open price raises error."""
        row = {**valid_row, "Type": "sell", "Open price": "100", "Take Profit": "110"}

        normalized = normalize_csv_row(row, fields_mapping)
        trade_import = TradeImport(**normalized)

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_import.to_trade()

        assert exc_info.value.message_template == "For sell trades, take profit must be less than open price."

    def test_take_profit_equal_to_open_price_for_sell(self, fields_mapping: dict, valid_row: dict):
        """Sell trade with take profit == open price raises error."""
        row = {**valid_row, "Type": "sell", "Open price": "100", "Take Profit": "100"}

        normalized = normalize_csv_row(row, fields_mapping)
        trade_import = TradeImport(**normalized)

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_import.to_trade()

        assert exc_info.value.message_template == "For sell trades, take profit must be less than open price."


class TestClosedAtBusinessLogic:
    """Tests for closed_at business logic validation."""

    def test_closed_at_before_opened_at(self, fields_mapping: dict, valid_row: dict):
        """Closed at before opened at raises error."""
        row = {
            **valid_row,
            "Opened At": "2025-01-10T10:00:00Z",
            "Closed At": "2025-01-05T10:00:00Z",
            "Close price": "150",
        }

        normalized = normalize_csv_row(row, fields_mapping)
        trade_import = TradeImport(**normalized)

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_import.to_trade()

        assert exc_info.value.message_template == "Close date must be after opened date."

    def test_closed_at_equal_to_opened_at(self, fields_mapping: dict, valid_row: dict):
        """Closed at equal to opened at raises error."""
        row = {
            **valid_row,
            "Opened At": "2025-01-10T10:00:00Z",
            "Closed At": "2025-01-10T10:00:00Z",
            "Close price": "150",
        }

        normalized = normalize_csv_row(row, fields_mapping)
        trade_import = TradeImport(**normalized)

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_import.to_trade()

        assert exc_info.value.message_template == "Close date must be after opened date."


class TestCloseTradeBusinessLogic:
    """Tests for close trade data completeness validation."""

    def test_close_price_without_closed_at(self, fields_mapping: dict, valid_row: dict):
        """Close price without closed_at raises error."""
        row = {**valid_row, "Close price": "150", "Closed At": ""}

        normalized = normalize_csv_row(row, fields_mapping)
        trade_import = TradeImport(**normalized)

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_import.to_trade()

        assert exc_info.value.message_template == "Provide both price and date to close trade."

    def test_closed_at_without_close_price(self, fields_mapping: dict, valid_row: dict):
        """Closed_at without close price raises error."""
        row = {**valid_row, "Closed At": "2025-01-05T15:00:00Z", "Close price": ""}

        normalized = normalize_csv_row(row, fields_mapping)
        trade_import = TradeImport(**normalized)

        with pytest.raises(PydanticCustomError) as exc_info:
            trade_import.to_trade()

        assert exc_info.value.message_template == "Provide both price and date to close trade."

