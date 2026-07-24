from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ..db import BalanceTransactionORM, PortfolioORM, TradeORM, UserORM
from ..domain.portfolio.enums import (
    PLAN_PORTFOLIO_LIMITS,
    BalanceTransactionType,
    PortfolioStatus,
    SubscriptionPlan,
)
from .trade_metrics import calc_absolute_pnl, is_open_trade
from ..utils.datetime_utils import to_utc_iso_string


def get_user_plan(db: Session, user_id: int) -> SubscriptionPlan:
    user = db.query(UserORM).filter(UserORM.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    plan_value = user.plan or SubscriptionPlan.free.value
    try:
        return SubscriptionPlan(plan_value)
    except ValueError:
        return SubscriptionPlan.free


def create_default_portfolio(
    db: Session,
    user_id: int,
    started_at: datetime | None = None,
) -> PortfolioORM:
    portfolio = PortfolioORM(
        user_id=user_id,
        name="Default",
        starting_capital=0.0,
        started_at=to_utc_iso_string(started_at) if started_at else None,
        is_default=True,
        status=PortfolioStatus.active.value,
    )
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    return portfolio


def get_default_portfolio(db: Session, user_id: int) -> PortfolioORM | None:
    return (
        db.query(PortfolioORM)
        .filter(
            PortfolioORM.user_id == user_id,
            PortfolioORM.is_default.is_(True),
        )
        .first()
    )


def get_owned_portfolio(
    db: Session,
    user_id: int,
    portfolio_id: int,
) -> PortfolioORM | None:
    return (
        db.query(PortfolioORM)
        .filter(
            PortfolioORM.id == portfolio_id,
            PortfolioORM.user_id == user_id,
        )
        .first()
    )


def ensure_portfolio_writable(
    db: Session,
    user_id: int,
    portfolio_id: int,
) -> PortfolioORM:
    portfolio = get_owned_portfolio(db, user_id, portfolio_id)
    if portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    if portfolio.status == PortfolioStatus.archived.value:
        raise HTTPException(
            status_code=403,
            detail="Cannot modify an archived portfolio",
        )
    return portfolio


def list_portfolios(db: Session, user_id: int) -> list[PortfolioORM]:
    return (
        db.query(PortfolioORM)
        .filter(PortfolioORM.user_id == user_id)
        .order_by(PortfolioORM.id.asc())
        .all()
    )


def create_portfolio(
    db: Session,
    user_id: int,
    name: str,
    starting_capital: float = 0.0,
    started_at: datetime | None = None,
) -> PortfolioORM:
    plan = get_user_plan(db, user_id)
    limit = PLAN_PORTFOLIO_LIMITS[plan]
    count = (
        db.query(PortfolioORM)
        .filter(PortfolioORM.user_id == user_id)
        .count()
    )
    if count >= limit:
        raise HTTPException(
            status_code=403,
            detail=f"Portfolio limit reached for {plan.value} plan ({limit})",
        )

    portfolio = PortfolioORM(
        user_id=user_id,
        name=name,
        starting_capital=starting_capital,
        started_at=to_utc_iso_string(started_at) if started_at else None,
        is_default=False,
        status=PortfolioStatus.active.value,
    )
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    return portfolio


def patch_portfolio(
    db: Session,
    user_id: int,
    portfolio_id: int,
    name: str | None = None,
    status: PortfolioStatus | str | None = None,
    starting_capital: float | None = None,
    started_at: datetime | None = None,
) -> PortfolioORM:
    portfolio = get_owned_portfolio(db, user_id, portfolio_id)
    if portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    new_status = PortfolioStatus(status) if status is not None else None
    is_archived = portfolio.status == PortfolioStatus.archived.value

    if is_archived:
        if new_status == PortfolioStatus.active:
            if name is not None or starting_capital is not None or started_at is not None:
                raise HTTPException(
                    status_code=403,
                    detail="Archived portfolios can only be unarchived",
                )
            portfolio.status = PortfolioStatus.active.value
            db.commit()
            db.refresh(portfolio)
            return portfolio
        raise HTTPException(
            status_code=403,
            detail="Archived portfolios can only be unarchived",
        )

    if new_status == PortfolioStatus.archived:
        active_count = (
            db.query(PortfolioORM)
            .filter(
                PortfolioORM.user_id == user_id,
                PortfolioORM.status == PortfolioStatus.active.value,
            )
            .count()
        )
        if active_count <= 1:
            raise HTTPException(
                status_code=403,
                detail="At least one active portfolio is required",
            )
        portfolio.status = PortfolioStatus.archived.value

    if name is not None:
        portfolio.name = name

    if starting_capital is not None or started_at is not None:
        plan = get_user_plan(db, user_id)
        if plan == SubscriptionPlan.free:
            raise HTTPException(
                status_code=403,
                detail="Starting capital is available on Pro and Max plans",
            )
        if portfolio.status != PortfolioStatus.active.value:
            raise HTTPException(
                status_code=403,
                detail="Can only update capital on an active portfolio",
            )
        if starting_capital is not None:
            portfolio.starting_capital = starting_capital
        if started_at is not None:
            portfolio.started_at = to_utc_iso_string(started_at)

    db.commit()
    db.refresh(portfolio)
    return portfolio


def delete_portfolio(db: Session, user_id: int, portfolio_id: int) -> None:
    portfolio = get_owned_portfolio(db, user_id, portfolio_id)
    if portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    if portfolio.is_default:
        raise HTTPException(
            status_code=403,
            detail="Cannot delete the default portfolio",
        )

    trade_exists = (
        db.query(TradeORM)
        .filter(TradeORM.portfolio_id == portfolio_id)
        .first()
    )
    if trade_exists:
        raise HTTPException(status_code=403, detail="Portfolio has trades")

    db.query(BalanceTransactionORM).filter(
        BalanceTransactionORM.portfolio_id == portfolio_id
    ).delete(synchronize_session=False)
    db.delete(portfolio)
    db.commit()


def _require_paid_plan(db: Session, user_id: int) -> SubscriptionPlan:
    plan = get_user_plan(db, user_id)
    if plan == SubscriptionPlan.free:
        raise HTTPException(
            status_code=403,
            detail="This feature requires a Pro or Max plan",
        )
    return plan


def add_transaction(
    db: Session,
    user_id: int,
    portfolio_id: int,
    type: BalanceTransactionType | str,
    amount: float,
    occurred_at: datetime,
    note: str | None = None,
) -> BalanceTransactionORM:
    _require_paid_plan(db, user_id)
    portfolio = ensure_portfolio_writable(db, user_id, portfolio_id)

    tx_type = (
        BalanceTransactionType(type) if isinstance(type, str) else type
    )
    transaction = BalanceTransactionORM(
        portfolio_id=portfolio.id,
        user_id=user_id,
        type=tx_type.value,
        amount=amount,
        occurred_at=to_utc_iso_string(occurred_at),
        note=note,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


def list_transactions(
    db: Session,
    user_id: int,
    portfolio_id: int,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[BalanceTransactionORM], int]:
    _require_paid_plan(db, user_id)
    portfolio = get_owned_portfolio(db, user_id, portfolio_id)
    if portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    query = (
        db.query(BalanceTransactionORM)
        .filter(
            BalanceTransactionORM.portfolio_id == portfolio_id,
            BalanceTransactionORM.user_id == user_id,
        )
        .order_by(BalanceTransactionORM.occurred_at.desc())
    )
    total = query.count()
    rows = query.offset(offset).limit(limit).all()
    return rows, total


def get_portfolio_summary(
    db: Session,
    user_id: int,
    portfolio_id: int,
) -> dict:
    _require_paid_plan(db, user_id)
    portfolio = get_owned_portfolio(db, user_id, portfolio_id)
    if portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    starting_capital = float(portfolio.starting_capital or 0.0)

    transactions = (
        db.query(BalanceTransactionORM)
        .filter(
            BalanceTransactionORM.portfolio_id == portfolio_id,
            BalanceTransactionORM.user_id == user_id,
        )
        .all()
    )
    deposits = sum(
        t.amount
        for t in transactions
        if t.type == BalanceTransactionType.deposit.value
    )
    withdrawals = sum(
        t.amount
        for t in transactions
        if t.type == BalanceTransactionType.withdrawal.value
    )
    net_deposits = deposits - withdrawals
    cash = starting_capital + deposits - withdrawals

    trades = (
        db.query(TradeORM)
        .filter(
            TradeORM.user_id == user_id,
            TradeORM.portfolio_id == portfolio_id,
        )
        .all()
    )
    domains = [t.to_domain() for t in trades]

    realized_pnl = sum(
        calc_absolute_pnl(t) or 0.0
        for t in domains
        if t.close_price is not None
    )
    open_notional = sum(
        t.open_price * t.quantity for t in domains if is_open_trade(t)
    )

    equity = cash + realized_pnl
    trading_return = equity - starting_capital - net_deposits
    return_pct = (
        trading_return / starting_capital if starting_capital else 0.0
    )

    started_at = None
    if portfolio.started_at:
        started_at = datetime.fromisoformat(
            portfolio.started_at.replace("Z", "+00:00")
        )

    return {
        "starting_capital": starting_capital,
        "started_at": started_at,
        "cash": cash,
        "realized_pnl": realized_pnl,
        "equity": equity,
        "return_pct": return_pct,
        "open_notional": open_notional,
    }
