from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import database, models
from pydantic import BaseModel, ValidationError
from datetime import datetime
from typing import List, Optional, Literal
import csv
import io

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
    opened_at: datetime
    take_profit: Optional[float] = None
    stop_loss: Optional[float] = None
    leverage: Optional[float] = None
    close_price: Optional[float] = None
    closed_at: Optional[datetime] = None

class Trade(TradeCreate):
    id: int
    created_at: str

# Dependency to get DB session
def get_db_connection():
    db = next(database.get_db())
    return db

@router.post("/trades/import")
def import_trades_from_csv(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    try:
        content = file.file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        for row in csv_reader:
            try:
                trade_data = TradeCreate(
                    symbol=row["symbol"],
                    open_price=float(row["open_price"]),
                    type=row["trade_type"],
                    opened_at=datetime.fromisoformat(row["opened_at"]),
                    quantity=float(row["quantity"]),
                    leverage=float(row["leverage"]) if row.get("leverage") and row["leverage"] != '' else None,
                    stop_loss=float(row["stop_loss"]) if row.get("stop_loss") and row["stop_loss"] != '' else None,
                    take_profit=float(row["take_profit"]) if row.get("take_profit") and row["take_profit"] != '' else None,
                    close_price=float(row["close_price"]) if row.get("close_price") and row["close_price"] != '' else None,
                    closed_at=datetime.fromisoformat(row["closed_at"]) if row.get("closed_at") and row["closed_at"] != '' else None,
                )
                db_trade = models.Trades(**trade_data.dict())
                db.add(db_trade)
            except (ValidationError, KeyError, ValueError) as e:
                # Rollback the transaction on any error
                db.rollback()
                raise HTTPException(status_code=400, detail=f"Invalid data in CSV file: {e} on row: {row}")
        db.commit()
        return {"message": "Trades imported successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to import trades: {e}")

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