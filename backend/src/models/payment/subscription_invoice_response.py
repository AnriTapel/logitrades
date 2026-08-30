from pydantic import BaseModel


class SubscriptionInvoiceResponse(BaseModel):
    id: str
    store_id: int | None = None
    subscription_id: int | str | None = None
    customer_id: int | str | None = None
    status: str | None = None
    billing_reason: str | None = None
    card_brand: str | None = None
    card_last_four: str | None = None
    currency: str | None = None
    total: int | None = None
    total_formatted: str | None = None
    refunded: bool | None = None
    refunded_at: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    urls: dict | None = None

    class Config:
        from_attributes = True
