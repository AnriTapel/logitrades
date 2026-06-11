from datetime import datetime, timezone


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_utc_iso(value: str) -> datetime:
    """Parse an ISO 8601 string into a timezone-aware UTC datetime."""
    return datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(timezone.utc)


def ensure_utc(dt: datetime) -> datetime:
    """Normalize a datetime to timezone-aware UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def to_utc_iso_string(dt: datetime) -> str:
    """Serialize a datetime as a UTC ISO string ending with Z."""
    return ensure_utc(dt).isoformat().replace('+00:00', 'Z')
