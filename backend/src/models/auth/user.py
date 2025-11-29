from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    password: str
    username: str
    email: EmailStr

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool
    is_verified: bool