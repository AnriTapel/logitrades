from datetime import datetime, timedelta, timezone
from typing import Optional, Literal
import uuid
import secrets

from ..utils import _get_env_var

import jwt

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SEC = 60 * 60
REFRESH_TOKEN_EXPIRE_SEC = 60 * 60 * 24 * 30

def get_jwt_tokens_for_user(user_id: int) -> tuple[str,str]:
    access_token = create_auth_token(user_id, "access")
    refresh_token = create_auth_token(user_id, "refresh")
    return access_token, refresh_token


def create_auth_token(user_id: int, token_type: Literal["access", "refresh"], expires_delta: int | None = None) -> str:
    # Use appropriate expiration based on token type if not specified
    if expires_delta is None:
        expires_delta = ACCESS_TOKEN_EXPIRE_SEC if token_type == "access" else REFRESH_TOKEN_EXPIRE_SEC
    
    expire = datetime.now(timezone.utc) + timedelta(seconds=expires_delta)
    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "type": token_type,
        "jti": str(uuid.uuid4())  # Unique identifier ensures no duplicate tokens
    }
    encoded_jwt = jwt.encode(to_encode, _get_env_var("JWT_SECRET_KEY"), algorithm=ALGORITHM)
    return encoded_jwt

def validate_auth_token(token: str, token_type: Literal["access", "refresh"]) -> bool:
    try:
        decoded = _decode_token(token)
        return decoded.get("type") == token_type
    except (jwt.InvalidTokenError, jwt.ExpiredSignatureError, KeyError, ValueError):
        return False

def get_user_id_from_token(token: str) -> int | None:
    try:
        decoded = _decode_token(token, False)
        return int(decoded.get("sub"))
    except jwt.InvalidTokenError:
        return None

def decode_token_unsafe(token: str) -> dict | None:
    try:
        return _decode_token(token, False)
    except jwt.InvalidTokenError:
        return None

def _decode_token(token: str, verify_exp: bool = True) -> Optional[dict]:
    return jwt.decode(token, _get_env_var("JWT_SECRET_KEY"), algorithms=[ALGORITHM], options={"verify_exp": verify_exp})


def create_email_verification_token() -> str:
    """Generate a secure random token for email verification"""
    return secrets.token_urlsafe(32)