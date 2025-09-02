from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timezone

Base = declarative_base()

def get_current_time():
    return datetime.now(timezone.utc).isoformat()

class Trades(Base):
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