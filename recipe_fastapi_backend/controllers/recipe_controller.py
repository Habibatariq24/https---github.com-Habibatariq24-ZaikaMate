import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import SessionLocal
from models import RecipeCache, RecipeListCache

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel("models/gemini-2.5-flash")


def normalize_text(value: str) -> str:
    return " ".join(value.strip().lower().split())


def build_pantry_key(ingredients: str, has_common_spices: bool) -> str:
    ingredient_list = [
        normalize_text(item)
        for item in ingredients.split(",")
        if item.strip()
    ]

    ingredient_list.sort()

    normalized_ingredients = ",".join(ingredient_list)

    return f"{normalized_ingredients}|spices={int(has_common_spices)}"


async def get_recipe_list(ingredients: str, has_common_spices: bool = False):
    db: Session = SessionLocal()

    try:
        pantry_key = build_pantry_key(ingredients, has_common_spices)

        cached_list = (
            db.query(RecipeListCache)
            .filter(RecipeListCache.pantry_key == pantry_key)
            .first()
        )

        if cached_list and cached_list.recipes_json:
            print("⚡ Fetched recipe list from DB")
            return json.loads(cached_list.recipes_json)

        user_pantry = ingredients

        if has_common_spices:
            user_pantry += (
                ", red chili powder, turmeric, salt, cumin, coriander powder, "
                "garam masala, black pepper"
            )

        prompt = f"""
You are a strict Pakistani Chef.

User has ONLY these ingredients: "{user_pantry}".
Assume they also have: Water, Oil/Ghee.

Suggest 10 authentic Pakistani recipes compatible with these ingredients.

For each recipe, provide:
- name
- description
- missing_ingredients_count

Rules:
- Be strict.
- If a recipe needs Yogurt, Ginger, Garlic, Onion, Tomato, or Green Chilies and they are not in the user's list, count them as missing.
- Do not count water or oil.

Return only a valid JSON array like this:
[
  {{
    "name": "Recipe Name",
    "description": "Short text",
    "missing_ingredients_count": 3
  }}
]
"""

        generation_config = genai.types.GenerationConfig(
            response_mime_type="application/json"
        )

        print("🤖 Fetching recipe list from Gemini...")

        response = await model.generate_content_async(
            prompt,
            generation_config=generation_config,
        )

        text = response.text
        recipes = json.loads(text)

        try:
            cached_list = (
                db.query(RecipeListCache)
                .filter(RecipeListCache.pantry_key == pantry_key)
                .first()
            )

            if cached_list:
                cached_list.recipes_json = text
                cached_list.ingredients = ingredients
                cached_list.has_common_spices = has_common_spices
            else:
                new_list = RecipeListCache(
                    pantry_key=pantry_key,
                    ingredients=ingredients,
                    has_common_spices=has_common_spices,
                    recipes_json=text,
                )
                db.add(new_list)

            db.commit()

        except IntegrityError:
            db.rollback()

            existing_list = (
                db.query(RecipeListCache)
                .filter(RecipeListCache.pantry_key == pantry_key)
                .first()
            )

            if existing_list and existing_list.recipes_json:
                print("⚡ Duplicate list insert avoided. Fetched from DB")
                return json.loads(existing_list.recipes_json)

            raise

        return recipes

    except Exception as err:
        db.rollback()
        print(f"❌ Gemini recipe list error: {str(err)}")
        raise Exception(f"Failed to fetch recipes: {str(err)}")

    finally:
        db.close()


async def get_recipe_detail(recipe_name: str):
    db: Session = SessionLocal()

    try:
        normalized_name = normalize_text(recipe_name)

        cached_recipe = (
            db.query(RecipeCache)
            .filter(func.lower(RecipeCache.recipe_name) == normalized_name)
            .first()
        )

        if cached_recipe and cached_recipe.html_content:
            print(f"⚡ Fetched '{recipe_name}' details from DB")
            return cached_recipe.html_content

        print(f"🤖 Fetching '{recipe_name}' details from Gemini...")

        prompt = f"""
Write a detailed authentic Pakistani recipe for "{recipe_name}" formatted in HTML.

Rules:
- Use <h3> for section headers.
- Use <ul> and <li> for ingredients.
- Do not use markdown symbols like ## or **.
- Include Ingredients ,don't include recipe steps.
"""

        response = await model.generate_content_async(prompt)
        recipe_html = response.text

        try:
            cached_recipe = (
                db.query(RecipeCache)
                .filter(func.lower(RecipeCache.recipe_name) == normalized_name)
                .first()
            )

            if cached_recipe:
                cached_recipe.html_content = recipe_html
            else:
                new_recipe = RecipeCache(
                    recipe_name=normalized_name,
                    html_content=recipe_html,
                )
                db.add(new_recipe)

            db.commit()

        except IntegrityError:
            db.rollback()

            existing_recipe = (
                db.query(RecipeCache)
                .filter(func.lower(RecipeCache.recipe_name) == normalized_name)
                .first()
            )

            if existing_recipe and existing_recipe.html_content:
                print(f"⚡ Duplicate detail insert avoided. Fetched '{recipe_name}' from DB")
                return existing_recipe.html_content

            raise

        return recipe_html

    except Exception as err:
        db.rollback()
        print(f"❌ Gemini recipe detail error: {str(err)}")
        raise Exception(f"Failed to fetch recipe detail: {str(err)}")

    finally:
        db.close()


async def get_recipe_steps(recipe_name: str):
    db: Session = SessionLocal()

    try:
        normalized_name = normalize_text(recipe_name)

        cached_recipe = (
            db.query(RecipeCache)
            .filter(func.lower(RecipeCache.recipe_name) == normalized_name)
            .first()
        )

        if cached_recipe and cached_recipe.steps_json:
            print(f"⚡ Fetched '{recipe_name}' steps from DB")
            return json.loads(cached_recipe.steps_json)

        print(f"🤖 Fetching '{recipe_name}' steps from Gemini...")

        prompt = f"""
Provide step-by-step cooking instructions for "{recipe_name}".

Return only a valid JSON array where each object has:
- step_number
- instruction

Example:
[
  {{
    "step_number": 1,
    "instruction": "Chop the onions."
  }}
]
"""

        generation_config = genai.types.GenerationConfig(
            response_mime_type="application/json"
        )

        response = await model.generate_content_async(
            prompt,
            generation_config=generation_config,
        )

        text = response.text
        steps = json.loads(text)

        try:
            cached_recipe = (
                db.query(RecipeCache)
                .filter(func.lower(RecipeCache.recipe_name) == normalized_name)
                .first()
            )

            if cached_recipe:
                cached_recipe.steps_json = text
            else:
                new_recipe = RecipeCache(
                    recipe_name=normalized_name,
                    html_content="",
                    steps_json=text,
                )
                db.add(new_recipe)

            db.commit()

        except IntegrityError:
            db.rollback()

            existing_recipe = (
                db.query(RecipeCache)
                .filter(func.lower(RecipeCache.recipe_name) == normalized_name)
                .first()
            )

            if existing_recipe and existing_recipe.steps_json:
                print(f"⚡ Duplicate steps insert avoided. Fetched '{recipe_name}' from DB")
                return json.loads(existing_recipe.steps_json)

            raise

        return steps

    except Exception as err:
        db.rollback()
        print(f"❌ Gemini recipe steps error: {str(err)}")
        raise Exception(f"Failed to fetch recipe steps: {str(err)}")

    finally:
        db.close()