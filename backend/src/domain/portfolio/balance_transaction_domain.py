from datetime import datetime

from .enums import BalanceTransactionType
from ...utils.datetime_utils import to_utc_iso_string


class BalanceTransactionDomain:
    def __init__(
        self,
        portfolio_id: int,
        user_id: int,
        type: BalanceTransactionType,
        amount: float,
        occurred_at: datetime,
        note: str | None = None,
        id: int | None = None,
        created_at: datetime | None = None,
    ):
        self.id = id
        self.portfolio_id = portfolio_id
        self.user_id = user_id
        self.type = (
            BalanceTransactionType(type) if isinstance(type, str) else type
        )
        self.amount = amount
        self.occurred_at = occurred_at
        self.note = note
        self.created_at = created_at

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "portfolio_id": self.portfolio_id,
            "user_id": self.user_id,
            "type": self.type.value,
            "amount": self.amount,
            "occurred_at": to_utc_iso_string(self.occurred_at),
            "note": self.note,
            "created_at": to_utc_iso_string(self.created_at)
            if self.created_at
            else None,
        }
