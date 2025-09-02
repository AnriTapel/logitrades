from fastapi import FastAPI, APIRouter, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import database, models
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Literal

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

router = APIRouter(prefix="/api/v1")

# Pydantic model for request/response
class TradeCreate(BaseModel):
    symbol: str
    type: Literal["buy", "sell"] 
    open_price: float  # renamed from price
    quantity: float
    opened_at: str
    take_profit: Optional[float] = None
    stop_loss: Optional[float] = None
    leverage: Optional[float] = None
    close_price: Optional[float] = None
    closed_at: Optional[str] = None

class Trade(TradeCreate):
    id: int
    created_at: str

# Dependency to get DB session
def get_db_connection():
    db = next(database.get_db())
    return db

@router.post("/trades/", response_model=Trade)
def create_trade(trade: TradeCreate, db: Session = Depends(database.get_db)):
    print(trade)
    db_trade = models.Trades(**trade.dict())
    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)
    return db_trade


# Get all trade notes
@router.get("/trades/", response_model=List[Trade])
def read_trades(db: Session = Depends(database.get_db)):
    return db.query(models.Trades).all()

@router.delete("/trades/{trade_id}")
def delete_trade(trade_id: int, db: Session = Depends(database.get_db)):
    print(trade_id)
    trade = db.query(models.Trades).filter(models.Trades.id == trade_id).first()
    if trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    db.delete(trade)
    db.commit()
    return {"message": "Trade deleted successfully"}

@router.put("/trades/{trade_id}", response_model=Trade)
def update_trade(trade_id: int, trade: TradeCreate, db: Session = Depends(database.get_db)):
    db_trade = db.query(models.Trades).filter(models.Trades.id == trade_id).first()
    if db_trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    for key, value in trade.dict().items():
        setattr(db_trade, key, value)
    db.commit()
    db.refresh(db_trade)
    return db_trade

app.include_router(router)