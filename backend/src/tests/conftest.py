import pytest


@pytest.fixture
def fields_mapping() -> dict[str, str]:
    """Common fields mapping matching CSV headers to model fields."""
    return {
        "symbol": "Ticker",
        "trade_type": "Type",
        "open_price": "Open price",
        "quantity": "Amount",
        "opened_at": "Opened At",
        "take_profit": "Take Profit",
        "stop_loss": "Stop Loss",
        "leverage": "Leverage",
        "close_price": "Close price",
        "closed_at": "Closed At",
        "created_at": "Created At",
    }


@pytest.fixture
def valid_row() -> dict[str, str]:
    """A valid CSV row with all fields populated."""
    return {
        "Ticker": "BTCUSDT",
        "Type": "buy",
        "Open price": "100",
        "Amount": "10",
        "Opened At": "2025-01-01T10:00:00Z",
        "Take Profit": "",
        "Stop Loss": "",
        "Leverage": "",
        "Close price": "",
        "Closed At": "",
        "Created At": "",
    }

