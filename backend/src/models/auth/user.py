from pydantic import BaseModel, EmailStr, Field

from ...domain.currency import CurrencyCode, DEFAULT_CURRENCY


class UserCreate(BaseModel):
    password: str = Field(..., min_length=8, max_length=32)
    username: str = Field(..., min_length=4, max_length=16)
    email: EmailStr = Field(...)

class UserLogin(BaseModel):
    password: str = Field(..., min_length=8, max_length=32)
    username: str = Field(..., min_length=4, max_length=16)

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool
    is_verified: bool
    plan: str = "free"
    currency: str = DEFAULT_CURRENCY
    created_at: str | None = None


class UserCurrencyUpdate(BaseModel):
    currency: CurrencyCode
