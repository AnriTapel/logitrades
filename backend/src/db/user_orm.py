from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import declarative_base

from ..domain import UserDomain
from ..utils import get_current_time

Base = declarative_base()

class UserORM(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(String, default=get_current_time)

    def to_domain(self) -> "UserDomain":

        return UserDomain(
            id=self.id,
            username=self.username,
            email=self.email,
            hashed_password=self.hashed_password,
            is_verified=self.is_verified,
            is_active=self.is_active,
            created_at=datetime.fromisoformat(self.created_at.replace('Z', '+00:00')) if self.created_at else None,
        )