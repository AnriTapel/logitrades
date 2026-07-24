from datetime import datetime
from typing import Optional

from pydantic.v1 import EmailStr

from ..currency import DEFAULT_CURRENCY
from ..portfolio.enums import SubscriptionPlan


class UserDomain:
    def __init__(
            self,
            username: str,
            email: EmailStr,
            hashed_password: str,
            id: Optional[int] = None,
            created_at: Optional[datetime] = None,
            is_active: bool = True,
            is_verified: bool = False,
            plan: str = SubscriptionPlan.free.value,
            currency: str = DEFAULT_CURRENCY,
    ):
        self.username = username
        self.email = email
        self.hashed_password = hashed_password
        self.is_verified = is_verified
        self.is_active = is_active
        self.id = id
        self.created_at = created_at
        self.plan = plan
        self.currency = currency


    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'hashed_password': self.hashed_password,
            'plan': self.plan,
            'currency': self.currency,
        }