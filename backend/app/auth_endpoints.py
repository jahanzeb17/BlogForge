from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import (
    TokenResponse,
    RegisterRequest,
    LoginRequest,
)
from auth import (
    hash_password,
    create_access_token,
    verify_password,
    get_current_user,
)


router = APIRouter()


@router.post("/auth/register", response_model=TokenResponse)
def register(
    req: RegisterRequest,
    db: Session = Depends(get_db),
):
    # Check whether the username is already registered.
    existing_username = (
        db.query(User)
        .filter(User.username == req.username)
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already taken",
        )

    # Check whether the email is already registered.
    existing_email = (
        db.query(User)
        .filter(User.email == req.email)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    user = User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
        is_admin=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        {
            "sub": str(user.id),
        }
    )

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        email=user.email,
    )


@router.post("/auth/login", response_model=TokenResponse)
def login(
    req: LoginRequest,
    db: Session = Depends(get_db),
):
    # Login is performed using email.
    user = (
        db.query(User)
        .filter(User.email == req.email)
        .first()
    )

    if not user or not verify_password(
        req.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    token = create_access_token(
        {
            "sub": str(user.id),
        }
    )

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        email=user.email,
    )


@router.get("/auth/me")
def me(
    user: User = Depends(get_current_user),
):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin,
    }