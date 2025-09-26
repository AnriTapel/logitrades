from pydantic import BaseModel, Field, field_validator, ValidationInfo
from typing import Optional
from datetime import datetime

from ..errors.take_profit_errors import TakeProfitTooLowError, TakeProfitTooHightError
from ..errors.stop_loss_errors import StopLossTooLowError, StopLossTooHightError
from ..errors.closed_at_errors import ClosedAtBeforeOpenedAtError

from ..domain import TradeType, Trade

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

    @field_validator('stopLoss', mode='before')
    def check_stop_loss(cls, v, info: ValidationInfo):
        if v is not None:
            values = info.data
            type = values.get('tradeType')
            open_price = values.get('openPrice')
            if type == TradeType.buy and v >= open_price:
                raise StopLossTooHightError()
            if type == TradeType.sell and v <= open_price:
                raise StopLossTooLowError()
        return v
    
    @field_validator('takeProfit', mode='before')
    def check_take_profit(cls, v, info: ValidationInfo):
        if v is not None:
            values = info.data
            type = values.get('tradeType')
            open_price = values.get('openPrice')
            if type == TradeType.buy and v <= open_price:
                raise TakeProfitTooLowError()
            if type == TradeType.sell and v >= open_price:
                raise TakeProfitTooHightError()
        return v
    
    @field_validator('closedAt', mode='before')
    def check_closed_at(cls, v, info: ValidationInfo):
        values = info.data
        opened_at = values.get('openedAt')
        if v is not None and opened_at is not None and datetime.fromisoformat(v) <= opened_at:
            raise ClosedAtBeforeOpenedAtError()
        return v
    
    def to_trade(self) -> "Trade":
        return Trade(
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