import jwt
from ..utils import _get_env_var
from fastapi import Cookie, HTTPException, status

SECRET_KEY = _get_env_var("JWT_SECRET_KEY")
ALGORITHM = "HS256"


async def current_user_id(access_token: str | None = Cookie(None, alias="access_token")) -> int:
    access_token_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload.get("sub"))
    except jwt.InvalidTokenError:
        raise access_token_exception