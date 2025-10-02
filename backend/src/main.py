from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.src.errors.exception_handles import register_exception_handlers
from backend.src.models import TradeFormModel, TradeImportModel

from backend.src.db import TradeORM
from backend.src import database

from pydantic import ValidationError
import csv
import io

from backend.src.models.trade_response import TradeResponse
from backend.src.utils.normalize_csv_row import normalize_csv_row

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

router = APIRouter(prefix="/api/v1")

# Dependency to get DB session
def get_db_connection():
    db = next(database.get_db())
    return db

@router.post("/trades/import")
def import_trades_from_csv(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    content = file.file.read().decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(content))
    for index, row in enumerate(csv_reader, start=1):
        try:
            trade_import = TradeImportModel(**normalize_csv_row(row))
            trade = trade_import.to_trade()
            db_trade = TradeORM(**trade.to_dict())
            db.add(db_trade)
        except (ValidationError, KeyError, ValueError) as e:
            # Rollback the transaction on any error
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Invalid data in CSV file for row {index}: {e}")
    db.commit()
    return {"message": "Trades imported successfully"}

@router.post("/trades/", response_model=TradeResponse)
def create_trade(trade_form: TradeFormModel, db: Session = Depends(database.get_db)):
    try:
        trade = trade_form.to_trade()
        db_trade = TradeORM(**trade.to_dict())
        db.add(db_trade)
        db.commit()
        db.refresh(db_trade)
        return db_trade.to_domain()
    except ValidationError as e:
        raise HTTPException(
            status_code=422,
            detail={e.errors()}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=e.message_template)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"msg": "Failed to save trade"}
        )

@router.put("/trades/{trade_id}", response_model=TradeResponse)
def update_trade(trade_id: int, trade_form: TradeFormModel, db: Session = Depends(database.get_db)):
    db_trade = db.query(TradeORM).filter(TradeORM.id == trade_id).first()
    if db_trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    try:
        trade = trade_form.to_trade()
        for key, value in trade.dict().items():
            if key == 'created_at' or key == 'id':
                continue
            setattr(db_trade, key, value)
        db.commit()
        db.refresh(db_trade)
        return db_trade.to_domain()
    except ValidationError as e:
        raise HTTPException(
            status_code=422,
            detail={e.errors()}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=e.message_template)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"msg": "Failed to save trade"}
        )

@router.get("/trades/", response_model=list[TradeResponse])
def read_trades(db: Session = Depends(database.get_db)):
    trades = db.query(TradeORM).all()
    return [t.to_domain().__dict__ for t in trades]

@router.delete("/trades/{trade_id}")
def delete_trade(trade_id: int, db: Session = Depends(database.get_db)):
    trade = db.query(TradeORM).filter(TradeORM.id == trade_id).first()
    if trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    db.delete(trade)
    db.commit()
    return {"message": "Trade deleted successfully"}

app.include_router(router)
register_exception_handlers(app)