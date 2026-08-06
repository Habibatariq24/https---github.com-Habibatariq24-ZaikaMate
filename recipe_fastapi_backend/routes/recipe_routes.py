from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

from controllers.recipe_controller import (
    get_recipe_list,
    get_recipe_detail,
    get_recipe_steps
)

router = APIRouter()

# =========================
# Request Models
# =========================

class RecipeListRequest(BaseModel):
    ingredients: str
    has_common_spices: bool = False


class RecipeDetailRequest(BaseModel):
    recipeName: str


class RecipeStepsRequest(BaseModel):
    recipeName: str


# =========================
# Response Models
# =========================

class RecipeItem(BaseModel):
    name: str
    description: str
    missing_ingredients_count: int


class RecipeDetailResponse(BaseModel):
    recipe: str


class RecipeStep(BaseModel):
    step_number: int
    instruction: str


# =========================
# 1️⃣ GET RECIPES LIST
# =========================

@router.post("/recipes", response_model=List[RecipeItem])
async def fetch_recipe_list(request: RecipeListRequest):
    try:
        recipes = await get_recipe_list(
            request.ingredients,
            request.has_common_spices
        )
        return recipes
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch recipes: {str(e)}"
        )


# =========================
# 2️⃣ RECIPE DETAIL
# =========================

@router.post("/recipe-detail", response_model=RecipeDetailResponse)
async def fetch_recipe_detail(request: RecipeDetailRequest):
    try:
        recipe = await get_recipe_detail(request.recipeName)
        return {"recipe": recipe}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch recipe detail: {str(e)}"
        )


# =========================
# 3️⃣ RECIPE STEPS
# =========================

@router.post("/recipe-steps", response_model=List[RecipeStep])
async def fetch_recipe_steps(request: RecipeStepsRequest):
    try:
        steps = await get_recipe_steps(request.recipeName)
        return steps
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch recipe steps: {str(e)}"
        )