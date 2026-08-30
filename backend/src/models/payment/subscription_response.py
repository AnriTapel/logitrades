from pydantic import BaseModel


class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    lemonsqueezy_subscription_id: str
    lemonsqueezy_customer_id: str | None = None
    product_id: str | None = None
    variant_id: str | None = None
    status: str
    renews_at: str | None = None
    ends_at: str | None = None
    trial_ends_at: str | None = None
    card_brand: str | None = None
    card_last_four: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    # Optional live Lemon Squeezy payload for detail endpoint
    urls: dict | None = None

    class Config:
        from_attributes = True
