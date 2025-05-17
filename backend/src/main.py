from fastapi import FastAPI, APIRouter, Depends
from sqlalchemy.orm import Session
from . import database, models
from pydantic import BaseModel
from typing import List, Optional, Literal

app = FastAPI()
router = APIRouter(prefix="/api/v1")

# Pydantic model for request/response
class TradeCreate(BaseModel):
    symbol: str
    open_price: float
    type: Literal["buy", "sell"] 
    size: float
    leverage: Optional[float] = None
    comment: Optional[str] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None

class Trade(TradeCreate):
    id: int
    created_at: str

# Dependency to get DB session
def get_db_connection():
    db = next(db())
    return db

@router.post("/trades/", response_model=Trade)
def create_trade(trade: TradeCreate, db: Session = Depends(database.get_db)):
    db_trade = models.Trades(**trade.dict())
    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)
    return db_trade

# Get all trade notes
@router.get("/trades/", response_model=List[Trade])
def read_trades(db: Session = Depends(database.get_db)):
    return db.query(models.Trades).all()


app.include_router(router)