from datetime import datetime

from sqlalchemy import Boolean, Column, Float, Integer, String

from .base import Base
from ..domain.currency import DEFAULT_CURRENCY
from ..domain.portfolio.enums import PortfolioStatus
from ..domain.portfolio.portfolio_domain import PortfolioDomain
from ..utils import get_current_time


class PortfolioORM(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    name = Column(String, nullable=False)
    starting_capital = Column(Float, nullable=False, default=0.0)
    started_at = Column(String, nullable=True)
    is_default = Column(Boolean, nullable=False, default=False)
    status = Column(String, nullable=False, default=PortfolioStatus.active.value)
    currency = Column(String, nullable=False, default=DEFAULT_CURRENCY)
    created_at = Column(String, default=get_current_time)

    def to_domain(self) -> PortfolioDomain:
        return PortfolioDomain(
            id=self.id,
            user_id=self.user_id,
            name=self.name,
            starting_capital=self.starting_capital or 0.0,
            started_at=(
                datetime.fromisoformat(self.started_at.replace("Z", "+00:00"))
                if self.started_at
                else None
            ),
            is_default=bool(self.is_default),
            status=PortfolioStatus(self.status),
            currency=self.currency or DEFAULT_CURRENCY,
            created_at=(
                datetime.fromisoformat(self.created_at.replace("Z", "+00:00"))
                if self.created_at
                else None
            ),
        )
