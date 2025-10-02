from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from backend.src.domain import TradeType, TradeDomain

class TradeForm(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=16, json_schema_extra={"example": "AAPL"})
    tradeType: TradeType = Field(..., json_schema_extra={"example": "buy"})
    openPrice: float = Field(..., gt=0, json_schema_extra={"example": 150.0})
    quantity: float = Field(..., json_schema_extra={"example": 10})
    openedAt: datetime = Field(..., json_schema_extra={"example": "2023-10-01T10:00:00Z"})
    takeProfit: Optional[float] = Field(None, json_schema_extra={"example": 160.0})
    stopLoss: Optional[float] = Field(None, json_schema_extra={"example": 140.0})
    useLeverage: bool = Field(..., json_schema_extra={"example": False})
    leverage: Optional[int] = Field(None, json_schema_extra={"example": 1.0})
    closePrice: Optional[float] = Field(None, json_schema_extra={"example": 155.0})
    closedAt: Optional[datetime] = Field(None, json_schema_extra={"example": "2023-10-05T15:30:00Z"})
    id: Optional[int] = Field(None, json_schema_extra={"example": 1})
    createdAt: Optional[datetime] = Field(None, json_schema_extra={"example": "2023-10-01T10:00:00Z"})

    def to_trade(self) -> "TradeDomain":
        return TradeDomain(
            id=self.id,
            symbol=self.symbol,
            type=self.tradeType,
            open_price=self.openPrice,
            quantity=self.quantity,
            opened_at=self.openedAt,
            take_profit=self.takeProfit,
            stop_loss=self.stopLoss,
            leverage=self.useLeverage and self.leverage or None,
            close_price=self.closePrice,
            closed_at=self.closedAt,
            created_at=self.createdAt
        )