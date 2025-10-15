from sqlalchemy import Column, Integer, Float, String
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

from ..domain import TradeDomain
from ..utils import get_current_time

Base = declarative_base()

class TradeORM(Base):
    __tablename__ = "trades"
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    open_price = Column(Float, nullable=False)  # renamed from price
    type = Column(String, index=True, nullable=False)
    opened_at = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    leverage = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    close_price = Column(Float, nullable=True)
    closed_at = Column(String, nullable=True)
    created_at = Column(String, default=get_current_time)

    def to_domain(self) -> "TradeDomain":
        return TradeDomain(
            id=self.id,
            created_at=datetime.fromisoformat(self.created_at.replace('Z', '+00:00')) if self.created_at else None,
            symbol=self.symbol,
            type=self.type,
            open_price=self.open_price,
            quantity=self.quantity,
            opened_at=datetime.fromisoformat(self.opened_at.replace('Z', '+00:00')),
            take_profit=self.take_profit,
            stop_loss=self.stop_loss,
            leverage=self.leverage,
            close_price=self.close_price,
            closed_at=datetime.fromisoformat(self.closed_at.replace('Z', '+00:00')) if self.closed_at else None,
        )
