from datetime import datetime

from pydantic import BaseModel, Field


class PortfolioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    starting_capital: float = Field(0.0, ge=0)
    started_at: datetime | None = None
