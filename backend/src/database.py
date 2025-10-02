from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.src.db import TradeORM

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # points to project root (parent of src)
DATABASE_URL = f"sqlite:///{BASE_DIR / 'trades.db'}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the database tables
TradeORM.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()