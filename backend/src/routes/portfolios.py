from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Annotated

from ..auth import current_user_id
from .. import database
from ..models.portfolio.portfolio_create import PortfolioCreate
from ..models.portfolio.portfolio_update import PortfolioUpdate
from ..models.portfolio.portfolio_response import PortfolioResponse
from ..models.portfolio.portfolio_summary_response import PortfolioSummaryResponse
from ..models.portfolio.transaction_create import TransactionCreate
from ..models.portfolio.transaction_list_response import TransactionListResponse
from ..models.portfolio.transaction_response import TransactionResponse
from ..services import portfolio_service

router = APIRouter(prefix="/portfolios", tags=["portfolios"])

db_dependency = Annotated[Session, Depends(database.get_db)]


def _portfolio_response(portfolio) -> PortfolioResponse:
    return PortfolioResponse(**portfolio.to_domain().to_dict())


def _transaction_response(transaction) -> TransactionResponse:
    return TransactionResponse(**transaction.to_domain().to_dict())


@router.get("/", response_model=list[PortfolioResponse])
def list_portfolios(
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    portfolios = portfolio_service.list_portfolios(db, user_id)
    return [_portfolio_response(p) for p in portfolios]


@router.post("/", response_model=PortfolioResponse)
def create_portfolio(
    body: PortfolioCreate,
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    portfolio = portfolio_service.create_portfolio(
        db,
        user_id,
        name=body.name,
        starting_capital=body.starting_capital,
        started_at=body.started_at,
        currency=body.currency.value if body.currency is not None else None,
    )
    return _portfolio_response(portfolio)


@router.patch("/{portfolio_id}", response_model=PortfolioResponse)
def patch_portfolio(
    portfolio_id: int,
    body: PortfolioUpdate,
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    portfolio = portfolio_service.patch_portfolio(
        db,
        user_id,
        portfolio_id,
        name=body.name,
        status=body.status,
        starting_capital=body.starting_capital,
        started_at=body.started_at,
        currency=body.currency.value if body.currency is not None else None,
    )
    return _portfolio_response(portfolio)


@router.delete("/{portfolio_id}")
def delete_portfolio(
    portfolio_id: int,
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    portfolio_service.delete_portfolio(db, user_id, portfolio_id)
    return {"message": "Portfolio deleted successfully"}


@router.get("/{portfolio_id}/summary", response_model=PortfolioSummaryResponse)
def get_portfolio_summary(
    portfolio_id: int,
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    return portfolio_service.get_portfolio_summary(db, user_id, portfolio_id)


@router.get(
    "/{portfolio_id}/transactions",
    response_model=TransactionListResponse,
)
def list_transactions(
    portfolio_id: int,
    db: db_dependency,
    user_id: int = Depends(current_user_id),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    rows, total = portfolio_service.list_transactions(
        db, user_id, portfolio_id, limit=limit, offset=offset
    )
    return TransactionListResponse(
        items=[_transaction_response(t) for t in rows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/{portfolio_id}/transactions",
    response_model=TransactionResponse,
)
def add_transaction(
    portfolio_id: int,
    body: TransactionCreate,
    db: db_dependency,
    user_id: int = Depends(current_user_id),
):
    transaction = portfolio_service.add_transaction(
        db,
        user_id,
        portfolio_id,
        type=body.type,
        amount=body.amount,
        occurred_at=body.occurred_at,
        note=body.note,
    )
    return _transaction_response(transaction)
