from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field


class AuthToken(BaseModel):
    username: str
    expires_at: datetime
    type: Literal['access', 'refresh']


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(..., min_length=8, max_length=32)

