from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Annotated
from datetime import datetime, timezone

from ..auth import (
    get_jwt_tokens_for_user,
    verify_password,
    REFRESH_TOKEN_EXPIRE_SEC,
    ACCESS_TOKEN_EXPIRE_SEC,
    get_password_hash,
    validate_auth_token,
    create_auth_token,
    get_user_id_from_token,
    decode_token_unsafe,
    create_email_verification_token
)
from ..domain import UserDomain
from ..models import UserCreate, UserLogin, UserResponse, VerifyEmailRequest, ForgotPasswordRequest, ResetPasswordRequest
from ..db import UserORM, RefreshTokenORM, EmailVerificationTokenORM, PasswordResetTokenORM
from ..services import email_service
from .. import database

router = APIRouter(prefix="/auth", tags=["auth"])

db_dependency = Annotated[Session, Depends(database.get_db)]


@router.post("/signup")
async def signup(
    user: UserCreate, 
    response: Response, 
    db: db_dependency,
    background_tasks: BackgroundTasks
):
    existing = db.query(UserORM).filter(UserORM.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="This username is already taken")
    existing_email = db.query(UserORM).filter(UserORM.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = UserDomain(
        username=user.username,
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    db_user = UserORM(**new_user.to_dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    access_token, refresh_token = get_jwt_tokens_for_user(db_user.id)

    db_refresh_token = RefreshTokenORM(token=refresh_token, user_id=db_user.id)
    db.add(db_refresh_token)
    db.commit()

    # Generate email verification token and send verification email
    verification_token = create_email_verification_token()
    db_verification_token = EmailVerificationTokenORM(
        token=verification_token,
        user_id=db_user.id
    )
    db.add(db_verification_token)
    db.commit()

    # Send verification email in background (non-blocking)
    background_tasks.add_task(
        email_service.send_verification_email,
        db_user.email,
        verification_token,
        db_user.username
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        max_age=ACCESS_TOKEN_EXPIRE_SEC,
        samesite="lax",
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        max_age=REFRESH_TOKEN_EXPIRE_SEC,
        samesite="lax",
        path="/"
    )

    return {"success": True, "username": db_user.username, "email_sent": True}


@router.post("/login")
def login(user: UserLogin, response: Response, db: db_dependency) -> dict:
    db_user = db.query(UserORM).filter(UserORM.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="This username is not found")
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Wrong password")
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Wrong password")

    old_tokens = db.query(RefreshTokenORM).filter(
        RefreshTokenORM.user_id == db_user.id,
        RefreshTokenORM.revoked == False
    ).all()
    for old_token in old_tokens:
        old_token.revoked = True
    db.commit()

    access_token, refresh_token = get_jwt_tokens_for_user(db_user.id)
        
    db_refresh_token = RefreshTokenORM(token=refresh_token, user_id=db_user.id)
    db.add(db_refresh_token)
    db.commit()
        
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_SEC,
        samesite="lax",
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=REFRESH_TOKEN_EXPIRE_SEC,
        samesite="lax",
        path="/"
    )

    return {"success": True, "username": db_user.username}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    response: Response,
    db: db_dependency,
    access_token: str | None = Cookie(None, alias="access_token"),
    refresh_token: str | None = Cookie(None, alias="refresh_token")
):
    """
    Get current user info. Called on app initialization.
    - If access token is valid, return user data (no refresh rotation)
    - If access token expired but refresh token is valid, rotate refresh token and generate new access token
    - If both expired, return 401
    """
    user_id: int | None = None
    should_rotate_refresh = False
    access_token_valid = False
    
    # First, try to validate access token
    if access_token and validate_auth_token(access_token, "access"):
        user_id = get_user_id_from_token(access_token)
        if user_id:
            access_token_valid = True

    # If access token is invalid/expired, try refresh token
    if not access_token_valid and refresh_token:
        if validate_auth_token(refresh_token, "refresh"):
            # Check if refresh token is not revoked in DB
            db_refresh_token = db.query(RefreshTokenORM).filter(
                RefreshTokenORM.token == refresh_token,
                RefreshTokenORM.revoked == False
            ).first()
            
            if db_refresh_token:
                user_id = get_user_id_from_token(refresh_token)
                if user_id:
                    should_rotate_refresh = True
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired tokens")
    
    db_user = db.query(UserORM).filter(UserORM.id == user_id).first()
    if not db_user or not db_user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    # Only rotate refresh token if access token was expired
    if should_rotate_refresh and refresh_token:
        old_token = db.query(RefreshTokenORM).filter(
            RefreshTokenORM.token == refresh_token,
            RefreshTokenORM.user_id == db_user.id
        ).first()
        if old_token:
            old_token.revoked = True
        
        new_refresh_token = create_auth_token(user_id, "refresh")
        db_new_refresh_token = RefreshTokenORM(token=new_refresh_token, user_id=db_user.id)
        db.add(db_new_refresh_token)
        db.commit()
        
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            max_age=REFRESH_TOKEN_EXPIRE_SEC,
            samesite="lax",
            path="/",
        )
    
    # Always issue a fresh access token
    new_access_token = create_auth_token(user_id, "access")
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_SEC,
        samesite="lax",
        path="/",
    )
    
    return UserResponse(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        is_active=db_user.is_active,
        is_verified=db_user.is_verified
    )


@router.post("/refresh")
def refresh_access_token(
    response: Response,
    db: db_dependency,
    refresh_token: str | None = Cookie(None, alias="refresh_token")
):
    """
    Refresh access token when it expires during session.
    Does NOT rotate refresh token (only /auth/me does that).
    """
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token required")
    
    refresh_token_valid = validate_auth_token(refresh_token, "refresh")
    if not refresh_token_valid:
        db_refresh_token = db.query(RefreshTokenORM).filter(
            RefreshTokenORM.token == refresh_token,
            RefreshTokenORM.revoked == False
        ).first()
        
        if not db_refresh_token:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        decoded_token = decode_token_unsafe(refresh_token)
        if not decoded_token:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        exp = decoded_token.get("exp")
        if exp and datetime.fromtimestamp(exp, tz=timezone.utc) <= datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Refresh token expired")

        user_id = get_user_id_from_token(refresh_token)
    else:
        user_id = get_user_id_from_token(refresh_token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    db_user = db.query(UserORM).filter(UserORM.id == user_id).first()
    if not db_user or not db_user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    new_access_token = create_auth_token(user_id, "access")
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=False,
        max_age=ACCESS_TOKEN_EXPIRE_SEC,
        samesite="lax",
        path="/"
    )
    
    return {"success": True, "user_id": user_id}


@router.post("/logout")
def logout(
    response: Response,
    db: db_dependency,
    refresh_token: str | None = Cookie(None, alias="refresh_token")
):
    """Logout user - revoke refresh token and clear cookies"""
    if refresh_token:
        db_refresh_token = db.query(RefreshTokenORM).filter(
            RefreshTokenORM.token == refresh_token
        ).first()
        if db_refresh_token:
            db_refresh_token.revoked = True
            db.commit()
    
    response.delete_cookie(key="access_token", path="/", samesite="lax")
    response.delete_cookie(key="refresh_token", path="/", samesite="lax")
    return {"message": "Logged out successfully"}


@router.post("/verify-email")
def verify_email(request: VerifyEmailRequest, db: db_dependency):
    """Verify user email using the token from verification email"""
    db_token = db.query(EmailVerificationTokenORM).filter(
        EmailVerificationTokenORM.token == request.token,
        EmailVerificationTokenORM.used == False
    ).first()

    if not db_token:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    if db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Verification token expired")

    # Mark token as used
    db_token.used = True

    # Verify user
    db_user = db.query(UserORM).filter(UserORM.id == db_token.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.is_verified = True
    db.commit()

    return {"success": True, "message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(
    db: db_dependency,
    background_tasks: BackgroundTasks,
    access_token: str | None = Cookie(None, alias="access_token")
):
    """Resend verification email to the current user"""
    if not access_token:
        raise HTTPException(status_code=401, detail="Authentication required")

    user_id = get_user_id_from_token(access_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    db_user = db.query(UserORM).filter(UserORM.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if db_user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    # Invalidate old unused verification tokens
    old_tokens = db.query(EmailVerificationTokenORM).filter(
        EmailVerificationTokenORM.user_id == user_id,
        EmailVerificationTokenORM.used == False
    ).all()
    for old_token in old_tokens:
        old_token.used = True

    # Create new verification token
    verification_token = create_email_verification_token()
    db_verification_token = EmailVerificationTokenORM(
        token=verification_token,
        user_id=user_id
    )
    db.add(db_verification_token)
    db.commit()

    # Send verification email in background
    background_tasks.add_task(
        email_service.send_verification_email,
        db_user.email,
        verification_token,
        db_user.username
    )

    return {"success": True, "message": "Verification email sent"}


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: db_dependency,
    background_tasks: BackgroundTasks
):
    """Send password reset email"""
    # Always return success to prevent email enumeration attacks
    db_user = db.query(UserORM).filter(UserORM.email == request.email).first()

    if db_user:
        # Invalidate old unused reset tokens for this user
        old_tokens = db.query(PasswordResetTokenORM).filter(
            PasswordResetTokenORM.user_id == db_user.id,
            PasswordResetTokenORM.used == False
        ).all()
        for old_token in old_tokens:
            old_token.used = True

        # Create new reset token
        reset_token = create_email_verification_token()  # Reuse token generator
        db_reset_token = PasswordResetTokenORM(
            token=reset_token,
            user_id=db_user.id
        )
        db.add(db_reset_token)
        db.commit()

        # Send reset email in background
        background_tasks.add_task(
            email_service.send_password_reset_email,
            db_user.email,
            reset_token,
            db_user.username
        )

    return {"success": True, "message": "If an account with that email exists, a reset link has been sent"}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: db_dependency):
    """Reset user password using the token from reset email"""
    db_token = db.query(PasswordResetTokenORM).filter(
        PasswordResetTokenORM.token == request.token,
        PasswordResetTokenORM.used == False
    ).first()

    if not db_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")

    # Mark token as used
    db_token.used = True

    # Update user password
    db_user = db.query(UserORM).filter(UserORM.id == db_token.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.hashed_password = get_password_hash(request.password)

    # Revoke all refresh tokens to force re-login on all devices
    db.query(RefreshTokenORM).filter(
        RefreshTokenORM.user_id == db_user.id,
        RefreshTokenORM.revoked == False
    ).update({"revoked": True})

    db.commit()

    return {"success": True, "message": "Password reset successfully"}

