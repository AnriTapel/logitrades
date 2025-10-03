from typing import TYPE_CHECKING
from backend.src.domain.trade.enums import TradeType
from backend.src.errors.closed_at_errors import closed_at_before_opened_at_error, close_trade_data_error
from backend.src.errors.stop_loss_errors import stop_loss_too_low_error, stop_loss_too_high_error
from backend.src.errors.take_profit_errors import take_profit_too_low_error, take_profit_too_high_error

if TYPE_CHECKING:
    from backend.src.domain.trade.trade_domain import TradeDomain

def validate_stop_loss(trade: "TradeDomain") -> None:
    trade_type = trade.type
    stop_loss = trade.stop_loss
    open_price = trade.open_price
    if stop_loss is None:
        return
    if trade_type == TradeType.buy and stop_loss >= open_price:
        raise stop_loss_too_high_error()
    if trade_type == TradeType.sell and stop_loss <= open_price:
        raise stop_loss_too_low_error()

def validate_take_profit(trade: "TradeDomain") -> None:
    trade_type = trade.type
    take_profit = trade.take_profit
    open_price = trade.open_price
    if take_profit is None:
        return
    if trade_type == TradeType.buy and take_profit <= open_price:
        raise take_profit_too_low_error()
    if trade_type == TradeType.sell and take_profit >= open_price:
        raise take_profit_too_high_error()

def validate_closed_at(trade: "TradeDomain") -> None:
    opened_at = trade.opened_at
    closed_at = trade.closed_at
    if closed_at is None:
        return
    if closed_at is not None and opened_at is not None and closed_at <= opened_at:
        raise closed_at_before_opened_at_error()

def validate_close_trade(trade: "TradeDomain") -> None:
    closed_at = trade.closed_at
    close_price = trade.close_price
    if closed_at is None and close_price is None:
        return
    if closed_at is not None and close_price is not None:
        return
    raise close_trade_data_error()