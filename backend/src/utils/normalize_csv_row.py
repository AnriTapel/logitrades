from datetime import datetime, timedelta


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
        "closed_at": row[fields_mapping["closed_at"]] if fields_mapping.get("closed_at") and row[fields_mapping["closed_at"]] else None,
        "created_at": row[fields_mapping["created_at"]] if fields_mapping.get("created_at") and row[fields_mapping["created_at"]] else None
    }

def _get_opened_at_str_value(row: dict, fields_mapping: dict) -> str:
    opened_at_field = fields_mapping.get("opened_at")
    if not opened_at_field:
        closed_at_field = fields_mapping.get("closed_at")
        if not closed_at_field:
            return datetime.now().isoformat()

        closed_at_value = row[fields_mapping.get("closed_at")]

        assert isinstance(closed_at_value, str), f"{closed_at_field} must be a datetime ISO string"
        if closed_at_value is None or closed_at_value == "":
            return datetime.now().isoformat()

        closed_at_datetime = datetime.fromisoformat(closed_at_value)
        opened_at_value = closed_at_datetime - timedelta(days=1)
        return opened_at_value.isoformat()

    opened_at_value = row[opened_at_field]
    assert isinstance(opened_at_value, str) and opened_at_value is not "", f"{opened_at_field} must be a datetime ISO string"
    return opened_at_value