from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .db import TradeORM, UserORM

from .utils import _get_env_var

engine = create_engine(_get_env_var("DATABASE_URL"), connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

TradeORM.metadata.create_all(bind=engine)
UserORM.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()