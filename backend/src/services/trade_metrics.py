from datetime import date, datetime, timedelta, timezone

from ..domain.trade.enums import TradeType
from ..domain.trade.trade_domain import TradeDomain


def _parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def calc_absolute_pnl(trade: TradeDomain) -> float | None:
    if trade.close_price is None:
        return None

    leverage = trade.leverage or 1
    open_price = trade.open_price
    close_price = trade.close_price
    quantity = trade.quantity
    trade_type = trade.type

    if leverage > 1:
        liquidation_price_long = open_price * (1 - 1 / leverage)
        liquidation_price_short = open_price * (1 + 1 / leverage)

        if trade_type == TradeType.buy and close_price <= liquidation_price_long:
            return (-open_price * quantity) / leverage

        if trade_type == TradeType.sell and close_price >= liquidation_price_short:
            return (-open_price * quantity) / leverage

    direction = 1 if trade_type == TradeType.buy else -1
    return (close_price - open_price) * quantity * direction


def calc_closed_pnl(trade: TradeDomain) -> float:
    return calc_absolute_pnl(trade) or 0.0


def calc_traded_volume(trade: TradeDomain) -> float:
    close_price = trade.close_price or 0
    return (trade.open_price + close_price) * trade.quantity


def is_open_trade(trade: TradeDomain) -> bool:
    return trade.close_price is None


def is_closed_trade(trade: TradeDomain) -> bool:
    return trade.close_price is not None and trade.closed_at is not None


def start_of_day_utc(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)


def end_of_day_utc(d: date) -> datetime:
    return datetime(
        d.year, d.month, d.day, 23, 59, 59, 999000, tzinfo=timezone.utc
    )


def trade_opened_at(trade: TradeDomain) -> datetime:
    return trade.opened_at


def trade_closed_at(trade: TradeDomain) -> datetime | None:
    return trade.closed_at


def matches_date_range(
    dt: datetime | None,
    date_from: date | None,
    date_to: date | None,
) -> bool:
    if dt is None:
        return False
    if date_from and dt < start_of_day_utc(date_from):
        return False
    if date_to and dt > end_of_day_utc(date_to):
        return False
    return True


def matches_tags(trade_tags: list[str] | None, filter_tags: list[str] | None) -> bool:
    if not filter_tags:
        return True
    if not trade_tags:
        return False
    return any(tag in trade_tags for tag in filter_tags)


def compute_summary(trades: list[TradeDomain]) -> dict[str, float]:
    pivot = datetime.now(timezone.utc) - timedelta(days=7)

    open_equity = sum(
        t.open_price * t.quantity for t in trades if is_open_trade(t)
    )

    last_7_days = [t for t in trades if trade_opened_at(t) >= pivot]

    pnl_last_7_days = sum(
        calc_closed_pnl(t)
        for t in last_7_days
        if t.close_price is not None and t.closed_at is not None
    )

    volume_last_7_days = sum(calc_traded_volume(t) for t in last_7_days)

    total_pnl = sum(calc_absolute_pnl(t) or 0 for t in trades)

    return {
        "open_equity": open_equity,
        "pnl_last_7_days": pnl_last_7_days,
        "volume_last_7_days": volume_last_7_days,
        "total_pnl": total_pnl,
    }
