# from datetime import datetime, timedelta, timezone
# from fastapi import Depends, HTTPException, status
# from typing_extensions import Annotated
# from pydantic import BaseModel
#
# import jwt
# from jwt.exceptions import InvalidTokenError
# import os
#
# from .oauth2_scheme import oauth2_scheme
#
# # to get a string like this run:
# # openssl rand -hex 32
# SECRET_KEY = os.environ["JWT_SECRET_KEY"]
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 10
#
# async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Could not validate credentials",
#         headers={"WWW-Authenticate": "Bearer"},
#     )
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         username = payload.get("sub")
#         if username is None:
#             raise credentials_exception
#         token_data = TokenData(username=username)
#     except InvalidTokenError:
#         raise credentials_exception
#     user = get_user(fake_users_db, username=token_data.username)
#     if user is None:
#         raise credentials_exception
#     return user
#
#
# async def get_current_active_user(
#     current_user: Annotated[User, Depends(get_current_user)],
# ):
#     if current_user.disabled:
#         raise HTTPException(status_code=400, detail="Inactive user")
#     return current_user
