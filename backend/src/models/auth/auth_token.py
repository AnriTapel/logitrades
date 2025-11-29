from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class AuthToken(BaseModel):
    username: str
    expires_at: datetime
    type: Literal['access', 'refresh'] 
