from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .db import TradeORM, UserORM, RefreshTokenORM, PasswordResetTokenORM, EmailVerificationTokenORM

from .utils import _get_env_var

database_url = _get_env_var("DATABASE_URL")
connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}

engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize database tables. Should be called on app startup."""
    TradeORM.metadata.create_all(bind=engine)
    UserORM.metadata.create_all(bind=engine)
    RefreshTokenORM.metadata.create_all(bind=engine)
    PasswordResetTokenORM.metadata.create_all(bind=engine)
    EmailVerificationTokenORM.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()