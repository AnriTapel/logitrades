from datetime import datetime

from pydantic import BaseModel

from ...domain.portfolio.enums import PortfolioStatus


class PortfolioResponse(BaseModel):
    id: int
    user_id: int
    name: str
    starting_capital: float
    started_at: datetime | None = None
    is_default: bool
    status: PortfolioStatus
    currency: str = "USD"
    created_at: datetime | None = None

    class Config:
        from_attributes = True
