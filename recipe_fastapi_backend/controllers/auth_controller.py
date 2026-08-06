from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import hash_password, verify_password
from models import User


def normalize_text(value: str) -> str:
    return " ".join(value.strip().split())


def normalize_email(value: str) -> str:
    return normalize_text(value).lower()


def normalize_username(value: str) -> str:
    return normalize_text(value)


def create_user(db: Session, username: str, email: str, password: str) -> User:
    cleaned_username = normalize_username(username)
    cleaned_email = normalize_email(email)

    existing_user = (
        db.query(User)
        .filter(
            func.lower(User.email) == cleaned_email,
        )
        .first()
    )
    if existing_user:
        raise ValueError("Email is already registered")

    existing_username = (
        db.query(User)
        .filter(func.lower(User.username) == cleaned_username.lower())
        .first()
    )
    if existing_username:
        raise ValueError("Username is already taken")

    user = User(
        username=cleaned_username,
        email=cleaned_email,
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    cleaned_email = normalize_email(email)

    user = db.query(User).filter(func.lower(User.email) == cleaned_email).first()
    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user
