import React, { useEffect, useState } from "react";
import "./styles.css";
import { fetchRecipesList } from "./api/recipeapi";

export default function RecipeListScreen({
  navigation,
  ingredients,
  hasCommonSpices,
}) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRecipes = async () => {
      try {
        setLoading(true);

        // 1. First check if previous recipe list is saved
        const savedRecipes = sessionStorage.getItem("current_recipe_list");

        // 2. If ingredients are missing, show saved list
        if (!ingredients || ingredients.length === 0) {
          if (savedRecipes) {
            setRecipes(JSON.parse(savedRecipes));
          } else {
            setRecipes([]);
          }

          setLoading(false);
          return;
        }

        // 3. If same ingredients were already searched, show saved list
        const savedIngredients = sessionStorage.getItem("current_ingredients");
        const currentIngredients = JSON.stringify(ingredients);

        if (savedRecipes && savedIngredients === currentIngredients) {
          setRecipes(JSON.parse(savedRecipes));
          setLoading(false);
          return;
        }

        // 4. New ingredients, so fetch new recipes
        const data = await fetchRecipesList(ingredients, hasCommonSpices);
        const finalRecipes = data || [];

        setRecipes(finalRecipes);

        // 5. Save recipe list and ingredients
        sessionStorage.setItem(
          "current_recipe_list",
          JSON.stringify(finalRecipes)
        );

        sessionStorage.setItem(
          "current_ingredients",
          JSON.stringify(ingredients)
        );

        sessionStorage.setItem(
          "current_has_common_spices",
          JSON.stringify(hasCommonSpices)
        );
      } catch (error) {
        console.error("Error fetching recipes:", error);

        // If backend fails, still try to show saved recipes
        const savedRecipes = sessionStorage.getItem("current_recipe_list");

        if (savedRecipes) {
          setRecipes(JSON.parse(savedRecipes));
        } else {
          setRecipes([]);
        }
      } finally {
        setLoading(false);
      }
    };

    getRecipes();
  }, [ingredients, hasCommonSpices]);

  if (loading) {
    return (
      <div className="recipe-page">
        <div className="recipe-screen recipe-loading-screen">
          <div className="recipe-loader"></div>
          <p className="recipe-loading-text">Finding recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-page">
      <div className="recipe-screen">
        <button
          className="recipe-back-btn"
          onClick={() => navigation.navigate("ingredient")}
        >
          ← Back
        </button>

        <h1 className="recipe-title">Recipes</h1>

        <p className="recipe-subtitle">
          Discover mouth-watering dishes based on your ingredients
        </p>

        <p className="recipe-count">{recipes.length} recipes found</p>

        <div className="recipe-list">
          {recipes.length === 0 ? (
            <div className="recipe-empty-box">
              <p>No recipes found</p>
              <span>Try adding more ingredients.</span>
            </div>
          ) : (
            recipes.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="recipe-card"
                onClick={() =>
                  navigation.navigate("recipedetail", {
                    recipeName: item.name,
                  })
                }
              >
                <div className="recipe-card-header">
                  <h3>{item.name}</h3>

                  {item.missing_ingredients_count > 0 && (
                    <span className="missing-badge">
                      +{item.missing_ingredients_count} missing
                    </span>
                  )}
                </div>

                <p>{item.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}