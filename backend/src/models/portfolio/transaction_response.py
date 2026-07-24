from datetime import datetime

from pydantic import BaseModel

from ...domain.portfolio.enums import BalanceTransactionType


class TransactionResponse(BaseModel):
    id: int
    portfolio_id: int
    user_id: int
    type: BalanceTransactionType
    amount: float
    occurred_at: datetime
    note: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True
