from sqlalchemy.orm import Session

from models import Comment


def create_comment(db: Session, recipe_id: str, user_id: str, content: str) -> Comment:
    # Persist a single comment for a recipe
    comment = Comment(recipe_id=recipe_id, user_id=user_id, content=content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def get_comments_by_recipe(db: Session, recipe_id: str) -> list[Comment]:
    # Newest-first comments for the recipe page feed
    return (
        db.query(Comment)
        .filter(Comment.recipe_id == recipe_id)
        .order_by(Comment.created_at.desc())
        .all()
    )
