from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from ...domain.trade.enums import TradeType
from ...domain.trade.trade_domain import TradeDomain


class TradeImport(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=16, json_schema_extra={"example": "AAPL"})
    trade_type: TradeType = Field(..., json_schema_extra={"example": "buy"})
    open_price: float = Field(..., gt=0, json_schema_extra={"example": 150.0})
    quantity: float = Field(..., json_schema_extra={"example": 10})
    opened_at: datetime = Field(..., json_schema_extra={"example": "2023-10-01T10:00:00Z"})
    take_profit: Optional[float] = Field(None, json_schema_extra={"example": 160.0})
    stop_loss: Optional[float] = Field(None, json_schema_extra={"example": 140.0})
    leverage: Optional[int] = Field(None, json_schema_extra={"example": 1.0})
    close_price: Optional[float] = Field(None, json_schema_extra={"example": 155.0})
    closed_at: Optional[datetime] = Field(None, json_schema_extra={"example": "2023-10-05T15:30:00Z"})
    created_at: Optional[datetime] = Field(None, json_schema_extra={"example": "2023-10-01T10:00:00Z"})

    def to_trade(self) -> "TradeDomain":
        return TradeDomain(
            symbol=self.symbol,
            type=self.trade_type,
            open_price=self.open_price,
            quantity=self.quantity,
            opened_at=self.opened_at,
            take_profit=self.take_profit,
            stop_loss=self.stop_loss,
            leverage=self.leverage,
            close_price=self.close_price,
            closed_at=self.closed_at,
            created_at=self.created_at
        )