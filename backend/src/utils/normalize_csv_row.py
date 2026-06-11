from datetime import timedelta

from .get_current_time import get_current_time
from .datetime_utils import parse_utc_iso, to_utc_iso_string


def normalize_csv_row(row: dict, fields_mapping: dict) -> dict:
    return {
        "symbol": row[fields_mapping.get("symbol")].upper(),
        "trade_type": row[fields_mapping.get("trade_type")].lower(),
        "open_price": float(row[fields_mapping["open_price"]]),
        "quantity": float(row[fields_mapping["quantity"]]),
        "opened_at": _get_opened_at_str_value(row, fields_mapping),
        "take_profit": float(row[fields_mapping["take_profit"]]) if fields_mapping.get("take_profit") and row[fields_mapping["take_profit"]] else None,
        "stop_loss": float(row[fields_mapping["stop_loss"]]) if fields_mapping.get("stop_loss") and row[fields_mapping["stop_loss"]] else None,
        "leverage": int(row[fields_mapping["leverage"]]) if fields_mapping.get("leverage") and row[fields_mapping["leverage"]] else None,
        "close_price": float(row[fields_mapping["close_price"]]) if fields_mapping.get("close_price") and row[fields_mapping["close_price"]] else None,
        "closed_at": _get_optional_datetime_str(row, fields_mapping, "closed_at"),
        "created_at": _get_optional_datetime_str(row, fields_mapping, "created_at"),
    }


def _get_optional_datetime_str(
    row: dict, fields_mapping: dict, field: str
) -> str | None:
    mapped_field = fields_mapping.get(field)
    if not mapped_field:
        return None

    value = row.get(mapped_field)
    if value is None or value == "":
        return None

    assert isinstance(value, str), f"{mapped_field} must be a datetime ISO string"
    return value


def _get_opened_at_str_value(row: dict, fields_mapping: dict) -> str:
    opened_at_field = fields_mapping.get("opened_at")
    if not opened_at_field:
        closed_at_field = fields_mapping.get("closed_at")
        if not closed_at_field:
            return get_current_time()

        closed_at_value = row.get(fields_mapping.get("closed_at"))

        assert isinstance(closed_at_value, str), f"{closed_at_field} must be a datetime ISO string"
        if closed_at_value is None or closed_at_value == "":
            return get_current_time()

        closed_at_datetime = parse_utc_iso(closed_at_value)
        opened_at_value = closed_at_datetime - timedelta(days=1)
        return to_utc_iso_string(opened_at_value)

    opened_at_value = row[opened_at_field]
    assert isinstance(opened_at_value, str) and opened_at_value != "", (
        f"{opened_at_field} must be a datetime ISO string"
    )
    return opened_at_value
