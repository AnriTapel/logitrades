import json
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", "..", ".env"), override=False)

from fastapi import FastAPI, APIRouter, Depends, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Annotated

from .auth import current_user_id
from .utils import _get_env_var
from .services import ErrorsHandlerService
from .models import TradeForm, TradeImportModel
from .models.trade.trade_response import TradeResponse
from .utils.normalize_csv_row import normalize_csv_row
from .db import TradeORM
from . import database
from .routes import auth as auth_routes
from .errors import format_import_error

from pydantic import ValidationError
from pydantic_core import PydanticCustomError
import csv
import io

app = FastAPI()

@app.on_event("startup")
def on_startup():
    """Initialize database tables on application startup."""
    database.init_db()

allowed_origins = _get_env_var("ALLOWED_ORIGINS").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

router = APIRouter()

db_dependency = Annotated[Session, Depends(database.get_db)]

@router.post("/trades/import")
def import_trades_from_csv(file: Annotated[UploadFile, Form()], mapping: Annotated[str, Form()], db: db_dependency, user_id: int = Depends(current_user_id)):
    content = file.file.read().decode('utf-8')
    fields_mapping = json.loads(mapping)
    csv_reader = csv.DictReader(io.StringIO(content))
    for index, row in enumerate(csv_reader, start=1):
        try:
            trade_import = TradeImportModel(**normalize_csv_row(row, fields_mapping))
            trade = trade_import.to_trade()
            db_trade = TradeORM(**trade.to_dict())
            db_trade.user_id = user_id
            db.add(db_trade)
        except ValidationError as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=format_import_error(index, e))
        except PydanticCustomError as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Row {index}: {e.message_template}")
        except KeyError as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Row {index}: Missing column '{e.args[0]}'.")
        except ValueError as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Row {index}: Invalid value - {str(e)}")
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