from sqlalchemy import Column, Integer, String

from .base import Base
from ..utils import get_current_time


class SubscriptionORM(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    lemonsqueezy_subscription_id = Column(String, unique=True, nullable=False, index=True)
    lemonsqueezy_customer_id = Column(String, nullable=True)
    product_id = Column(String, nullable=True)
    variant_id = Column(String, nullable=True)
    status = Column(String, nullable=False)
    renews_at = Column(String, nullable=True)
    ends_at = Column(String, nullable=True)
    trial_ends_at = Column(String, nullable=True)
    card_brand = Column(String, nullable=True)
    card_last_four = Column(String, nullable=True)
    created_at = Column(String, default=get_current_time)
    updated_at = Column(String, default=get_current_time)
