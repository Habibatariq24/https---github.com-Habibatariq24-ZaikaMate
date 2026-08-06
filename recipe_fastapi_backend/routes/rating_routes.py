from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth import get_current_user
from controllers.rating_controller import (
    get_recipe_rating_summary,
    get_user_recipe_rating,
    upsert_recipe_rating,
)
from database import get_db
from models import User

router = APIRouter(prefix="/ratings", tags=["ratings"])


class RatingUpsertRequest(BaseModel):
    recipe_id: str = Field(..., min_length=1)
    rating: int = Field(..., ge=1, le=5)


class RatingResponse(BaseModel):
    id: int
    recipe_id: str
    user_id: str
    rating: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RatingSummaryResponse(BaseModel):
    recipe_id: str
    average_rating: float
    ratings_count: int


class UserRatingResponse(BaseModel):
    recipe_id: str
    user_id: str
    rating: int | None


@router.post("/", response_model=RatingResponse)
def add_or_update_rating(
    payload: RatingUpsertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recipe_id = payload.recipe_id.strip()

    if not recipe_id:
        raise HTTPException(status_code=400, detail="recipe_id is required")

    return upsert_recipe_rating(
        db=db,
        recipe_id=recipe_id,
        user_id=current_user.username,
        rating_value=payload.rating,
    )


@router.get("/{recipe_id}", response_model=RatingSummaryResponse)
def get_rating_summary(recipe_id: str, db: Session = Depends(get_db)):
    cleaned_recipe_id = recipe_id.strip()
    if not cleaned_recipe_id:
        raise HTTPException(status_code=400, detail="recipe_id is required")

    return get_recipe_rating_summary(db, cleaned_recipe_id)


@router.get("/{recipe_id}/me", response_model=UserRatingResponse)
def get_user_rating(
    recipe_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cleaned_recipe_id = recipe_id.strip()

    if not cleaned_recipe_id:
        raise HTTPException(status_code=400, detail="recipe_id is required")

    return get_user_recipe_rating(db, cleaned_recipe_id, current_user.username)
