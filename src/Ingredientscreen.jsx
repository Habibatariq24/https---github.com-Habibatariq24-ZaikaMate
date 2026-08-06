import React, { useState } from "react";
import "./styles.css";
import BG_IMAGE from "/food.jpeg";

export default function IngredientScreen({ navigation }) {
  const [ingredients, setIngredients] = useState("");
  const [hasSpices, setHasSpices] = useState(false);

  const handleSubmit = () => {
    if (!ingredients.trim()) {
      alert("Please enter at least one ingredient.");
      return;
    }

    if (!hasSpices) {
      alert("Please check the common spices box to proceed.");
      return;
    }

    navigation.navigate("recipelist", {
      ingredients,
      hasCommonSpices: hasSpices,
    });
  };

  return (
  <div className="ingredient-page">
    <div className="ingredient-screen">

      {/* BACK BUTTON */}
      <button
        className="back-btn"
        onClick={() => navigation.navigate("main")}
      >
        ← Back
      </button>

      <div
        className="ingredient-image"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      >
        <div className="ingredient-overlay">
          <h1 className="ingredient-heading">
            Find the perfect recipes <br />
            <span>everyday</span>
          </h1>

          <p className="ingredient-subtext">
            Enter ingredients to discover delicious meals!
          </p>
        </div>
      </div>

      <div className="ingredient-bottom">
        <input
          type="text"
          placeholder="e.g., chicken, tomato, onion"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          className="ingredient-input"
        />

        <div className="checkbox-container">
          <input
            id="commonSpices"
            type="checkbox"
            checked={hasSpices}
            onChange={(e) => setHasSpices(e.target.checked)}
          />

          <label htmlFor="commonSpices">
            I have common spices (salt, chili, turmeric, etc.)
          </label>
        </div>

        <button className="ingredient-btn" onClick={handleSubmit}>
          Find Recipes
        </button>
           </div>

    </div>
  </div>
);
}
