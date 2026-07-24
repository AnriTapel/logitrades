from pydantic import BaseModel

from .transaction_response import TransactionResponse


class TransactionListResponse(BaseModel):
    items: list[TransactionResponse]
    total: int
    limit: int
    offset: int
