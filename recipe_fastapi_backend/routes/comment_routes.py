from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth import get_current_user
from controllers.comment_controller import create_comment, get_comments_by_recipe
from database import get_db
from models import User

router = APIRouter(prefix="/comments", tags=["comments"])


class CommentCreateRequest(BaseModel):
    recipe_id: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)


class CommentResponse(BaseModel):
    id: int
    recipe_id: str
    user_id: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=CommentResponse)
def add_comment(
    payload: CommentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate and normalize payload
    recipe_id = payload.recipe_id.strip()
    content = payload.content.strip()

    if not recipe_id:
        raise HTTPException(status_code=400, detail="recipe_id is required")
    if not content:
        raise HTTPException(status_code=400, detail="Comment must not be empty")

    return create_comment(db=db, recipe_id=recipe_id, user_id=current_user.username, content=content)


@router.get("/{recipe_id}", response_model=list[CommentResponse])
def get_recipe_comments(recipe_id: str, db: Session = Depends(get_db)):
    cleaned_recipe_id = recipe_id.strip()
    if not cleaned_recipe_id:
        raise HTTPException(status_code=400, detail="recipe_id is required")

    return get_comments_by_recipe(db, cleaned_recipe_id)
