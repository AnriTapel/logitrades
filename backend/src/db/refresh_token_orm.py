from datetime import datetime, timedelta, timezone
from sqlalchemy import Boolean, Column, DateTime, Integer, String

from .base import Base
from ..auth import REFRESH_TOKEN_EXPIRE_SEC
from ..utils import get_current_time

class RefreshTokenORM(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, index=True)
    user_id = Column(Integer, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), default=(datetime.now(timezone.utc) + timedelta(seconds=REFRESH_TOKEN_EXPIRE_SEC)))
    revoked = Column(Boolean, default=False)