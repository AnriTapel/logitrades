from pydantic import BaseModel


class TradeSummaryResponse(BaseModel):
    open_notional: float
    pnl_last_7_days: float
    volume_last_7_days: float
    total_pnl: float
