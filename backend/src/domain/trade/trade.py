from datetime import datetime
from typing import Optional
from pydantic.dataclasses import dataclass

from .enums import TradeType


@dataclass
class Trade:
    symbol: str
    type: TradeType 
    open_price: float
    quantity: float
    opened_at: datetime
    take_profit: Optional[float] = None
    stop_loss: Optional[float] = None
    leverage: Optional[float] = None
    close_price: Optional[float] = None
    closed_at: Optional[datetime] = None
    id: Optional[int] = None
    created_at: Optional[datetime] = None

    def dict(self) -> dict:
        """Convert the Trade object to a dictionary suitable for SQLAlchemy"""
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'symbol': self.symbol,
            'type': self.type.value,  # Convert enum to string value
            'open_price': self.open_price,
            'quantity': self.quantity,
            'opened_at': self.opened_at.isoformat(),
            'take_profit': self.take_profit,
            'stop_loss': self.stop_loss,
            'leverage': self.leverage,
            'close_price': self.close_price,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
        }

    