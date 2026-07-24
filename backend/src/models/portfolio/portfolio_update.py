from datetime import datetime

from pydantic import BaseModel, Field

from ...domain.portfolio.enums import PortfolioStatus


class PortfolioUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=64)
    status: PortfolioStatus | None = None
    starting_capital: float | None = Field(None, ge=0)
    started_at: datetime | None = None
