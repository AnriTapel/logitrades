from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone

Base = declarative_base()

class Trades(Base):
    __tablename__ = "trades"
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    open_price = Column(Float, nullable=False)
    type = Column(String, index=True, nullable=False)
    size = Column(Float, nullable=False)
    leverage = Column(Float, nullable=True)
    comment = Column(String, nullable=True)
    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())