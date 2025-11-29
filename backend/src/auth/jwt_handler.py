from datetime import datetime, timedelta, timezone

from ..models import AuthToken

from ..utils import _get_env_var

import jwt

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SEC = 60 * 60
REFRESH_TOKEN_EXPIRE_SEC = 60 * 60 * 24 * 30 # 30 days

def get_jwt_tokens_for_user(username: str) -> tuple[str,str]:
    access_token = create_access_token(data={"sub": username})
    refresh_token = create_refresh_token(data={"sub": username})
    return access_token, refresh_token

def create_access_token(data: dict, expires_delta: timedelta | None = ACCESS_TOKEN_EXPIRE_SEC) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(seconds=expires_delta)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, _get_env_var("JWT_SECRET_KEY"), algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: timedelta | None = REFRESH_TOKEN_EXPIRE_SEC) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(seconds=expires_delta)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, _get_env_var("JWT_SECRET_KEY"), algorithm=ALGORITHM)
    return encoded_jwt

def validate_access_token(token: str) -> bool:
    decoded = jwt.decode(token, _get_env_var("JWT_SECRET_KEY"), algorithms=ALGORITHM)
    auth_token = AuthToken(**decoded)

