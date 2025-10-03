from datetime import datetime

from backend.src.domain.trade.enums import TradeType
from backend.src.errors.trade_validators import (
    validate_stop_loss,
    validate_take_profit,
    validate_closed_at, validate_close_trade,
)

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
    ):
        self.symbol = symbol
        self.type = type
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

        # бизнес-валидация
        validate_stop_loss(self)
        validate_take_profit(self)
        validate_closed_at(self)
        validate_close_trade(self)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'symbol': self.symbol,
            'type': self.type.value,
            'open_price': self.open_price,
            'quantity': self.quantity,
            'opened_at': self.opened_at.isoformat(),
            'take_profit': self.take_profit,
            'stop_loss': self.stop_loss,
            'leverage': self.leverage,
            'close_price': self.close_price,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
        }