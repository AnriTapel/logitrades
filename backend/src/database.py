from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .db import Base
from .utils import _get_env_var

database_url = _get_env_var("DATABASE_URL")
engine = create_engine(database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Create all tables. Used for local dev/testing; production uses Alembic migrations."""
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()