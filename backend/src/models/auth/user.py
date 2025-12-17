from pydantic import BaseModel, EmailStr, Field

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