from datetime import datetime, timedelta, timezone
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

PASSWORD_RESET_TOKEN_EXPIRE_SEC = 60 * 60  # 1 hour


class PasswordResetTokenORM(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(seconds=PASSWORD_RESET_TOKEN_EXPIRE_SEC)
    )
    used = Column(Boolean, default=False)

