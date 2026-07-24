from datetime import datetime

from .enums import PortfolioStatus
from ...utils.datetime_utils import to_utc_iso_string


class PortfolioDomain:
    def __init__(
        self,
        name: str,
        user_id: int,
        starting_capital: float = 0.0,
        started_at: datetime | None = None,
        is_default: bool = False,
        status: PortfolioStatus = PortfolioStatus.active,
        id: int | None = None,
        created_at: datetime | None = None,
    ):
        self.id = id
        self.user_id = user_id
        self.name = name
        self.starting_capital = starting_capital
        self.started_at = started_at
        self.is_default = is_default
        self.status = (
            PortfolioStatus(status) if isinstance(status, str) else status
        )
        self.created_at = created_at

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "starting_capital": self.starting_capital,
            "started_at": to_utc_iso_string(self.started_at)
            if self.started_at
            else None,
            "is_default": self.is_default,
            "status": self.status.value,
            "created_at": to_utc_iso_string(self.created_at)
            if self.created_at
            else None,
        }
