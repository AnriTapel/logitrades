from datetime import timezone, datetime


def get_current_time():
    return datetime.now(timezone.utc).isoformat()