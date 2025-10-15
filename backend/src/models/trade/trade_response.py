from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ...domain.trade.enums import TradeType

class TradeResponse(BaseModel):
    id: Optional[int]
    created_at: Optional[datetime]
    symbol: str
    type: TradeType
    open_price: float
    quantity: float
    opened_at: datetime
    take_profit: Optional[float]
    stop_loss: Optional[float]
    leverage: Optional[float]
    close_price: Optional[float]
    closed_at: Optional[datetime]

    class Config:
        from_attributes = True  # чтобы можно было конвертить из ORM/объектов
