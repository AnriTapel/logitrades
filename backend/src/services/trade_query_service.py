from datetime import date, datetime, timedelta, timezone

from sqlalchemy import String, cast
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Query, Session

from ..db import TradeORM
from ..domain.trade.enums import TradeType
from ..models.trade.trade_facets_response import TradeFacetsResponse
from ..models.trade.trade_list_query import TradeListQuery
from ..models.trade.trade_list_response import TradeListResponse
from ..models.trade.trade_response import TradeResponse
from ..models.trade.trade_summary_response import TradeSummaryResponse
from .trade_metrics import (
    compute_summary,
    end_of_day_utc,
    start_of_day_utc,
)

FilterDate = str | date | datetime | None


def _is_date_only(value: str) -> bool:
    return len(value) == 10 and value[4] == "-" and value[7] == "-"


def _to_utc_datetime(value: FilterDate) -> datetime | None:
    """Parse YYYY-MM-DD / ISO datetime / date into a UTC datetime."""
    if value is None:
        return None
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        if _is_date_only(text):
            return start_of_day_utc(date.fromisoformat(text))
        return datetime.fromisoformat(text.replace("Z", "+00:00")).astimezone(
            timezone.utc
        )
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    # plain date
    return start_of_day_utc(value)


def _lower_bound_iso(value: FilterDate) -> str | None:
    """Inclusive lower bound. Date-only → start of UTC day; ISO → as-is."""
    dt = _to_utc_datetime(value)
    if dt is None:
        return None
    return dt.isoformat().replace("+00:00", "Z")


def _upper_bound_iso(value: FilterDate) -> str | None:
    """Inclusive upper bound.

    YYYY-MM-DD / date → end of that UTC day.
    ISO datetime (picker local-midnight as UTC) → end of that 24h window
    so the selected local calendar day is fully included.
    """
    if value is None:
        return None
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        if _is_date_only(text):
            return (
                end_of_day_utc(date.fromisoformat(text))
                .isoformat()
                .replace("+00:00", "Z")
            )
    elif isinstance(value, date) and not isinstance(value, datetime):
        return end_of_day_utc(value).isoformat().replace("+00:00", "Z")

    dt = _to_utc_datetime(value)
    if dt is None:
        return None
    end = dt + timedelta(days=1) - timedelta(milliseconds=1)
    return end.isoformat().replace("+00:00", "Z")


def _base_query(db: Session, user_id: int) -> Query:
    return db.query(TradeORM).filter(TradeORM.user_id == user_id)


def _apply_status_filter(query: Query, status: str | None) -> Query:
    if status == "open":
        return query.filter(
            TradeORM.close_price.is_(None),
            TradeORM.closed_at.is_(None),
        )
    if status == "closed":
        return query.filter(
            TradeORM.close_price.isnot(None),
            TradeORM.closed_at.isnot(None),
        )
    return query


def _apply_symbol_filter(query: Query, symbol: str | None) -> Query:
    if not symbol:
        return query
    return query.filter(TradeORM.symbol.ilike(f"%{symbol}%"))


def _apply_type_filter(query: Query, trade_type: TradeType | None) -> Query:
    if trade_type is None:
        return query
    return query.filter(TradeORM.type == trade_type.value)


def _apply_tags_filter(query: Query, tags: list[str] | None) -> Query:
    if not tags:
        return query
    # Postgres ?| expects jsonb ?| text[] (any key/array-element match)
    return query.filter(
        cast(TradeORM.tags, JSONB).op("?|")(cast(tags, ARRAY(String)))
    )


def _date_column_for_status(status: str | None):
    if status == "closed":
        return TradeORM.closed_at
    return TradeORM.opened_at


def _apply_date_filters(
    query: Query,
    status: str | None,
    date_from: FilterDate,
    date_to: FilterDate,
) -> Query:
    if not date_from and not date_to:
        return query

    date_column = _date_column_for_status(status)

    start_iso = _lower_bound_iso(date_from)
    if start_iso:
        query = query.filter(date_column >= start_iso)

    end_iso = _upper_bound_iso(date_to)
    if end_iso:
        query = query.filter(date_column <= end_iso)

    return query


def _apply_sort(query: Query, query_params: TradeListQuery) -> Query:
    sort_column = {
        "opened_at": TradeORM.opened_at,
        "closed_at": TradeORM.closed_at,
        "created_at": TradeORM.created_at,
    }[query_params.sort_by]

    if query_params.sort_order == "asc":
        return query.order_by(sort_column.asc())
    return query.order_by(sort_column.desc())


def build_filtered_query(
    db: Session,
    user_id: int,
    query_params: TradeListQuery,
) -> Query:
    query = _base_query(db, user_id)
    query = _apply_status_filter(query, query_params.status)
    query = _apply_symbol_filter(query, query_params.symbol)
    query = _apply_type_filter(query, query_params.type)
    query = _apply_tags_filter(query, query_params.tags)
    query = _apply_date_filters(
        query,
        query_params.status,
        query_params.date_from,
        query_params.date_to,
    )
    return _apply_sort(query, query_params)


def list_trades(
    db: Session,
    user_id: int,
    query_params: TradeListQuery,
) -> TradeListResponse:
    query = build_filtered_query(db, user_id, query_params)
    total = query.count()

    if query_params.paginate:
        rows = (
            query.offset(query_params.offset)
            .limit(query_params.limit)
            .all()
        )
        limit = query_params.limit
    else:
        rows = query.all()
        limit = None

    items = [TradeResponse(**t.to_domain().__dict__) for t in rows]

    return TradeListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=query_params.offset if query_params.paginate else 0,
    )


def get_trade_by_id(db: Session, user_id: int, trade_id: int) -> TradeORM | None:
    return (
        db.query(TradeORM)
        .filter(TradeORM.id == trade_id, TradeORM.user_id == user_id)
        .first()
    )


def get_facets(db: Session, user_id: int) -> TradeFacetsResponse:
    rows = (
        db.query(TradeORM.symbol, TradeORM.tags)
        .filter(TradeORM.user_id == user_id)
        .all()
    )

    symbols: set[str] = set()
    tags: set[str] = set()

    for symbol, trade_tags in rows:
        if symbol:
            symbols.add(symbol.upper())
        if trade_tags:
            for tag in trade_tags:
                tags.add(tag)

    return TradeFacetsResponse(
        symbols=sorted(symbols),
        tags=sorted(tags),
    )


def get_summary(db: Session, user_id: int) -> TradeSummaryResponse:
    rows = db.query(TradeORM).filter(TradeORM.user_id == user_id).all()
    domains = [t.to_domain() for t in rows]
    metrics = compute_summary(domains)
    return TradeSummaryResponse(**metrics)
