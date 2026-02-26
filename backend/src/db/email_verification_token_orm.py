from datetime import datetime, timedelta, timezone
from sqlalchemy import Boolean, Column, DateTime, Integer, String

from .base import Base

EMAIL_VERIFICATION_TOKEN_EXPIRE_SEC = 60 * 60 * 24  # 24 hours


class EmailVerificationTokenORM(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(seconds=EMAIL_VERIFICATION_TOKEN_EXPIRE_SEC)
    )
    used = Column(Boolean, default=False)

