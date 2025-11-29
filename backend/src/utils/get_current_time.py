from datetime import timezone, datetime


def get_current_time() -> str:
    return datetime.now(timezone.utc).isoformat()