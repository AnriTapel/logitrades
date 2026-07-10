from pydantic import BaseModel

from .trade_response import TradeResponse


class TradeListResponse(BaseModel):
    items: list[TradeResponse]
    total: int
    limit: int | None = None
    offset: int
