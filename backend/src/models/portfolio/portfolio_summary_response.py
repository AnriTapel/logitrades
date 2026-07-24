from datetime import datetime

from pydantic import BaseModel


class PortfolioSummaryResponse(BaseModel):
    starting_capital: float
    started_at: datetime | None = None
    cash: float
    realized_pnl: float
    equity: float
    return_pct: float
    open_notional: float
