from pydantic import BaseModel


class TradeSummaryResponse(BaseModel):
    open_equity: float
    pnl_last_7_days: float
    volume_last_7_days: float
    total_pnl: float
