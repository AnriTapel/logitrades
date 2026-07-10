from datetime import datetime

from .enums import TradeType
from ...errors.trade_validators import (
    validate_stop_loss,
    validate_take_profit,
    validate_closed_at, validate_close_trade,
)
from ...utils.datetime_utils import to_utc_iso_string

class TradeDomain:
    def __init__(
            self,
            symbol: str,
            type: TradeType,
            open_price: float,
            quantity: float,
            opened_at: datetime,
            take_profit: float | None = None,
            stop_loss: float | None = None,
            leverage: float | None = None,
            close_price: float | None = None,
            closed_at: datetime | None = None,
            id: int | None = None,
            created_at: datetime | None = None,
            comment: str | None = None,
            tags: list[str] | None = None,
    ):
        self.symbol = symbol
        self.type = TradeType(type) if isinstance(type, str) else type
        self.open_price = open_price
        self.quantity = quantity
        self.opened_at = opened_at
        self.take_profit = take_profit
        self.stop_loss = stop_loss
        self.leverage = leverage
        self.close_price = close_price
        self.closed_at = closed_at
        self.id = id
        self.created_at = created_at
        self.comment = comment
        self.tags = tags if tags else None

        validate_stop_loss(self)
        validate_take_profit(self)
        validate_closed_at(self)
        validate_close_trade(self)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'created_at': to_utc_iso_string(self.created_at) if self.created_at else None,
            'symbol': self.symbol,
            'type': self.type.value,
            'open_price': self.open_price,
            'quantity': self.quantity,
            'opened_at': to_utc_iso_string(self.opened_at),
            'take_profit': self.take_profit,
            'stop_loss': self.stop_loss,
            'leverage': self.leverage,
            'close_price': self.close_price,
            'closed_at': to_utc_iso_string(self.closed_at) if self.closed_at else None,
            'comment': self.comment,
            'tags': self.tags,
        }