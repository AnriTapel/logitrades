from datetime import datetime

from pydantic import BaseModel, Field

from ...domain.portfolio.enums import BalanceTransactionType


class TransactionCreate(BaseModel):
    type: BalanceTransactionType
    amount: float = Field(..., gt=0)
    occurred_at: datetime
    note: str | None = Field(None, max_length=500)
