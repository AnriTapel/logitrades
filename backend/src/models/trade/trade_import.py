from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator
from pydantic_core import PydanticCustomError

from ...domain.trade.enums import TradeType
from ...domain.trade.trade_domain import TradeDomain


class TradeImport(BaseModel):
    symbol: str = Field(..., json_schema_extra={"example": "AAPL"})
    trade_type: TradeType = Field(..., json_schema_extra={"example": "buy"})
    open_price: float = Field(..., json_schema_extra={"example": 150.0})
    quantity: float = Field(..., json_schema_extra={"example": 10})
    opened_at: Optional[datetime] = Field(datetime.now(), json_schema_extra={"example": "2023-10-01T10:00:00Z"})
    take_profit: Optional[float] = Field(None, json_schema_extra={"example": 160.0})
    stop_loss: Optional[float] = Field(None, json_schema_extra={"example": 140.0})
    leverage: Optional[int] = Field(None, json_schema_extra={"example": 1.0})
    close_price: Optional[float] = Field(None, json_schema_extra={"example": 155.0})
    closed_at: Optional[datetime] = Field(None, json_schema_extra={"example": "2023-10-05T15:30:00Z"})
    created_at: Optional[datetime] = Field(None, json_schema_extra={"example": "2023-10-01T10:00:00Z"})

    @field_validator('symbol')
    @classmethod
    def validate_symbol(cls, v: str) -> str:
        if not v or not v.strip():
            raise PydanticCustomError('symbol.empty', 'Symbol is required.')
        if len(v) > 16:
            raise PydanticCustomError('symbol.too_long', 'Symbol must be 16 characters or less.')
        return v.upper()

    @field_validator('open_price')
    @classmethod
    def validate_open_price(cls, v: float) -> float:
        if v <= 0:
            raise PydanticCustomError('open_price.not_positive', 'Open price must be greater than 0.')
        return v

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v: float) -> float:
        if v <= 0:
            raise PydanticCustomError('quantity.not_positive', 'Quantity must be greater than 0.')
        return v

    @field_validator('leverage')
    @classmethod
    def validate_leverage(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise PydanticCustomError('leverage.not_positive', 'Leverage must be greater than 0.')
        return v

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