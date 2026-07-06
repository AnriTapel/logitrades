import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

from ...domain import TradeType, TradeDomain

TAG_PATTERN = re.compile(r'^[A-Za-z0-9_-]+$')
MAX_TAGS = 3
MAX_TAG_LENGTH = 16


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
    comment: Optional[str] = Field(None, json_schema_extra={"example": "This is a comment"})
    tags: Optional[list[str]] = Field(None, json_schema_extra={"example": ["breakout"]})

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, tags: list[str] | None) -> list[str] | None:
        if tags is None or len(tags) == 0:
            return None

        if len(tags) > MAX_TAGS:
            raise ValueError(f'Maximum {MAX_TAGS} tags per trade')

        normalized: list[str] = []
        seen_lower: set[str] = set()

        for tag in tags:
            trimmed = tag.strip()
            if not trimmed:
                continue
            if len(trimmed) > MAX_TAG_LENGTH:
                raise ValueError(f'Each tag must be at most {MAX_TAG_LENGTH} characters')
            if not TAG_PATTERN.match(trimmed):
                raise ValueError('Tags can contain only letters, numbers, - and _')
            lower = trimmed.lower()
            if lower in seen_lower:
                continue
            seen_lower.add(lower)
            normalized.append(trimmed)

        return normalized or None

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
            created_at=self.createdAt,
            comment=self.comment,
            tags=self.tags,
        )
