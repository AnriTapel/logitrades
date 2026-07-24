from datetime import datetime

from sqlalchemy import Column, Float, Integer, String

from .base import Base
from ..domain.portfolio.balance_transaction_domain import BalanceTransactionDomain
from ..domain.portfolio.enums import BalanceTransactionType
from ..utils import get_current_time


class BalanceTransactionORM(Base):
    __tablename__ = "balance_transactions"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    occurred_at = Column(String, nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(String, default=get_current_time)

    def to_domain(self) -> BalanceTransactionDomain:
        return BalanceTransactionDomain(
            id=self.id,
            portfolio_id=self.portfolio_id,
            user_id=self.user_id,
            type=BalanceTransactionType(self.type),
            amount=self.amount,
            occurred_at=datetime.fromisoformat(
                self.occurred_at.replace("Z", "+00:00")
            ),
            note=self.note,
            created_at=(
                datetime.fromisoformat(self.created_at.replace("Z", "+00:00"))
                if self.created_at
                else None
            ),
        )
