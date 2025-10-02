from pydantic import BaseModel
from typing import Optional, Dict

class ErrorResponse(BaseModel):
    code: int
    reason: str
    details: Optional[str | Dict[str, str]] = None
