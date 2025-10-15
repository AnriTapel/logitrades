from pydantic import BaseModel, EmailStr

from ...auth import get_password_hash
from ...domain import UserDomain

class UserCreate(BaseModel):
    password: str
    username: str
    email: EmailStr

    def to_user_domain(self) -> "UserDomain":
        return UserDomain(
            username=self.username,
            email=self.email,
            hashed_password=get_password_hash(self.password)
        )

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool
    is_verified: bool