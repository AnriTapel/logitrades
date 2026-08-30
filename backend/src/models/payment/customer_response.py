from pydantic import BaseModel


class CustomerResponse(BaseModel):
    id: str
    store_id: int | None = None
    name: str | None = None
    email: str | None = None
    status: str | None = None
    city: str | None = None
    region: str | None = None
    country: str | None = None
    postal_code: str | None = None
    created_at: str | None = None
    updated_at: str | None = None

    class Config:
        from_attributes = True
