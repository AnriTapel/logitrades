from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Annotated

from .domain import UserDomain
from .auth import get_jwt_tokens_for_user, verify_password, REFRESH_TOKEN_EXPIRE_SEC, ACCESS_TOKEN_EXPIRE_SEC, get_current_user, get_password_hash
from .errors.exception_handles import register_exception_handlers
from .models import TradeForm, TradeImportModel, UserLogin
from .models.trade.trade_response import TradeResponse
from .utils.normalize_csv_row import normalize_csv_row
from .models import UserCreate

from .db import TradeORM, UserORM, RefreshTokenORM
from . import database

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

router = APIRouter(prefix="/api/v1")

db_dependency = Annotated[Session, Depends(database.get_db)]

@router.post("/trades/import")
def import_trades_from_csv(file: UploadFile, db: db_dependency):
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

@router.post("/trades", response_model=TradeResponse)
def create_trade(trade_form: TradeForm, db: db_dependency):
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
def update_trade(trade_id: int, trade_form: TradeForm, db: db_dependency):
    db_trade = db.query(TradeORM).filter(TradeORM.id == trade_id).first()
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
def read_trades(db: db_dependency):
    trades = db.query(TradeORM).all()
    return [t.to_domain().__dict__ for t in trades]

@router.delete("/trades/{trade_id}")
def delete_trade(trade_id: int, db: db_dependency):
    trade = db.query(TradeORM).filter(TradeORM.id == trade_id).first()
    if trade is None:
        raise HTTPException(status_code=404, detail="Trade not found")
    db.delete(trade)
    db.commit()
    return {"message": "Trade deleted successfully"}


@router.post("/auth/signup")
def signup(user: UserCreate, response: Response, db: db_dependency):
    existing = db.query(UserORM).filter(UserORM.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = UserDomain(username=user.username, email=user.email, hashed_password=get_password_hash(user.password))
    db_user = UserORM(**new_user.to_dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    access_token, refresh_token = get_jwt_tokens_for_user(db_user)
    
    db_refresh_token = RefreshTokenORM(id=None, token=refresh_token, user_id=db_user.id)
    db.add(db_refresh_token)
    db.commit()

    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, max_age=ACCESS_TOKEN_EXPIRE_SEC)
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, max_age=REFRESH_TOKEN_EXPIRE_SEC)

    return {"success": True, "username": db_user.username}

@router.post("/auth/login")
def login(user: UserLogin, response: Response, db: db_dependency) -> dict:
    db_user = db.query(UserORM).filter(UserORM.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token, refresh_token = get_jwt_tokens_for_user(db_user)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, max_age=ACCESS_TOKEN_EXPIRE_SEC)
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=True, max_age=REFRESH_TOKEN_EXPIRE_SEC)

    return {"success": True, "username": db_user.username}

@router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    return {"message": "Logged out successfully"}

@router.get("/items")
async def read_items(current_user: str = Depends(get_current_user)):
    return {"message": f"Hello, {current_user}! Here are your items."}

app.include_router(router)
register_exception_handlers(app)