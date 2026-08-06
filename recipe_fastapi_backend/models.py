from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class RecipeCache(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    recipe_name = Column(String, unique=True, index=True)
    html_content = Column(Text, nullable=True) # Stores the detail view HTML
    steps_json = Column(Text, nullable=True)   # Stores the steps list as JSON string


class RecipeListCache(Base):
    __tablename__ = "recipe_lists"

    id = Column(Integer, primary_key=True, index=True)
    pantry_key = Column(String, unique=True, index=True, nullable=False)
    ingredients = Column(Text, nullable=False)
    has_common_spices = Column(Boolean, default=False, nullable=False)
    recipes_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(String, index=True, nullable=False)
    user_id = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (
        UniqueConstraint("recipe_id", "user_id", name="uq_ratings_recipe_user"),
    )

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(String, index=True, nullable=False)
    user_id = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
