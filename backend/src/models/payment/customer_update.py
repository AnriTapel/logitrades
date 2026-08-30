from pydantic import BaseModel, EmailStr, Field


class CustomerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    city: str | None = None
    region: str | None = None
    country: str | None = Field(default=None, min_length=2, max_length=2)
    postal_code: str | None = None
