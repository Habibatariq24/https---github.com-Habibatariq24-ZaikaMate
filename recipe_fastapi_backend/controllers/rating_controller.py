from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Rating


def normalize_text(value: str) -> str:
    return " ".join(value.strip().lower().split())


def upsert_recipe_rating(db: Session, recipe_id: str, user_id: str, rating_value: int) -> Rating:
    normalized_recipe = normalize_text(recipe_id)
    normalized_user = normalize_text(user_id)

    existing = (
        db.query(Rating)
        .filter(Rating.recipe_id == normalized_recipe, Rating.user_id == normalized_user)
        .first()
    )

    if existing:
        existing.rating = rating_value
        db.commit()
        db.refresh(existing)
        return existing

    created = Rating(recipe_id=normalized_recipe, user_id=normalized_user, rating=rating_value)
    db.add(created)
    db.commit()
    db.refresh(created)
    return created


def get_recipe_rating_summary(db: Session, recipe_id: str) -> dict:
    normalized_recipe = normalize_text(recipe_id)

    average_rating, ratings_count = (
        db.query(func.avg(Rating.rating), func.count(Rating.id))
        .filter(Rating.recipe_id == normalized_recipe)
        .first()
    )

    return {
        "recipe_id": normalized_recipe,
        "average_rating": round(float(average_rating), 2) if average_rating is not None else 0.0,
        "ratings_count": int(ratings_count or 0),
    }


def get_user_recipe_rating(db: Session, recipe_id: str, user_id: str) -> dict:
    normalized_recipe = normalize_text(recipe_id)
    normalized_user = normalize_text(user_id)

    item = (
        db.query(Rating)
        .filter(Rating.recipe_id == normalized_recipe, Rating.user_id == normalized_user)
        .first()
    )

    if not item:
        return {
            "recipe_id": normalized_recipe,
            "user_id": normalized_user,
            "rating": None,
        }

    return {
        "recipe_id": item.recipe_id,
        "user_id": item.user_id,
        "rating": item.rating,
    }
