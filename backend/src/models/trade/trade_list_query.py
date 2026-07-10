from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

from ...domain.trade.enums import TradeType


class TradeListQuery(BaseModel):
    status: Literal["open", "closed"] | None = None
    symbol: str | None = None
    type: TradeType | None = None
    tags: list[str] | None = None
    # Accept YYYY-MM-DD or full ISO datetime; normalized in trade_query_service
    date_from: str | date | None = None
    date_to: str | date | None = None
    limit: int = Field(50, ge=1, le=200)
    offset: int = Field(0, ge=0)
    paginate: bool = True
    sort_by: Literal["opened_at", "closed_at", "created_at"] = "opened_at"
    sort_order: Literal["asc", "desc"] = "desc"
