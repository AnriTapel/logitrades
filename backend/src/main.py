from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Annotated

from .auth import current_user_id
from .services import ErrorsHandlerService
from .models import TradeForm, TradeImportModel
from .models.trade.trade_response import TradeResponse
from .utils.normalize_csv_row import normalize_csv_row
from .db import TradeORM
from . import database
from .routes import auth as auth_routes

from pydantic import ValidationError
import csv
import io
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://0.0.0.0:3000"],
    allow_credentials=True,
    allow_methods=["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

router = APIRouter()

db_dependency = Annotated[Session, Depends(database.get_db)]

@router.post("/trades/import")
def import_trades_from_csv(file: UploadFile, db: db_dependency, user_id: int = Depends(current_user_id)):
    content = file.file.read().decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(content))
    for index, row in enumerate(csv_reader, start=1):
        try:
            trade_import = TradeImportModel(**normalize_csv_row(row))
            trade = trade_import.to_trade()
            db_trade = TradeORM(**trade.to_dict())
            db_trade.user_id = user_id
            db.add(db_trade)
        except (ValidationError, KeyError, ValueError) as e:
            # Rollback the transaction on any error
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Invalid data in CSV file for row {index}: {e}")
    db.commit()
    return {"message": "Trades imported successfully"}

@router.post("/trades", response_model=TradeResponse)
def create_trade(trade_form: TradeForm, db: db_dependency, user_id: int = Depends(current_user_id)):
    try:
        trade = trade_form.to_trade()
        db_trade = TradeORM(**trade.to_dict())
        db_trade.user_id = user_id
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
def update_trade(trade_id: int, trade_form: TradeForm, db: db_dependency, user_id: int = Depends(current_user_id)):
    db_trade = db.query(TradeORM).filter(TradeORM.id == trade_id and TradeORM.user_id == user_id).first()
    if db_trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    try:
        trade = trade_form.to_trade()
        for key, value in trade.to_dict().items():
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

@router.get("/trades", response_model=list[TradeResponse])
def read_trades(db: db_dependency, user_id: int = Depends(current_user_id)):
    trades = db.query(TradeORM).filter(TradeORM.user_id == user_id).all()
    return [t.to_domain().__dict__ for t in trades]

@router.delete("/trades/{trade_id}")
def delete_trade(trade_id: int, db: db_dependency, user_id: int = Depends(current_user_id)):
    trade = db.query(TradeORM).filter(TradeORM.id == trade_id and TradeORM.user_id == user_id).first()
    if trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    db.delete(trade)
    db.commit()
    return {"message": "Trade deleted successfully"}

app.include_router(auth_routes.router, prefix="/api/v1")
app.include_router(router, prefix="/api/v1")

ErrorsHandlerService.register_exception_handlers(app)