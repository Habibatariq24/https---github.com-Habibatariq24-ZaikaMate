import React, { useEffect, useState } from "react";
import "./styles.css";
import { fetchRecipeDetail } from "./api/recipeapi";

export default function RecipeDetailScreen({ navigation, recipeName }) {
  const [recipeHtml, setRecipeHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getRecipe = async () => {
      try {
        const data = await fetchRecipeDetail(recipeName);
        setRecipeHtml(data || "");
      } catch (err) {
        console.error("Recipe detail error:", err);
        setError("Unable to load recipe details.");
      } finally {
        setLoading(false);
      }
    };

    if (recipeName) {
      getRecipe();
    }
  }, [recipeName]);

  if (loading) {
    return (
      <div className="recipe-detail-page">
        <div className="recipe-detail-screen recipe-detail-loading">
          <div className="recipe-detail-loader"></div>
          <p>Loading recipe details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-detail-page">
      <div className="recipe-detail-screen">
        <div className="recipe-detail-header">
          <button
            className="recipe-detail-back"
            onClick={() => navigation.navigate("recipelist")}
          >
            ← Back
          </button>

          <h1>{recipeName}</h1>
        </div>

        <div className="recipe-detail-content">
          {error ? (
            <div className="recipe-detail-error">{error}</div>
          ) : (
            <div
              className="recipe-html-box"
              dangerouslySetInnerHTML={{ __html: recipeHtml }}
            />
          )}

          <button
            className="review-button"
            onClick={() =>
              navigation.navigate("reviewcomments", { recipeName })
            }
          >
            Give Review or Comments
          </button>

          <button
            className="steps-button"
            onClick={() =>
              navigation.navigate("steps", { recipeName })
            }
          >
            View Recipe Steps
          </button>
        </div>
      </div>
    </div>
  );
}