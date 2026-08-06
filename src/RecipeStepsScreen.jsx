import React, { useEffect, useState } from "react";
import "./styles.css";
import { fetchRecipeSteps } from "./api/recipeapi";

export default function RecipeStepsScreen({ navigation, recipeName }) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSteps = async () => {
      try {
        const data = await fetchRecipeSteps(recipeName);
        setSteps(data || []);
      } catch (error) {
        console.error("Failed to fetch steps:", error);
        setSteps([]);
      } finally {
        setLoading(false);
      }
    };

    if (recipeName) {
      getSteps();
    }
  }, [recipeName]);

  if (loading) {
    return (
      <div className="steps-page">
        <div className="steps-screen steps-loading">
          <div className="steps-loader"></div>
          <p>Loading cooking steps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="steps-page">
      <div className="steps-screen">
        <button
          className="steps-back-btn"
          onClick={() => navigation.navigate("recipedetail", { recipeName })}
        >
          ← Back
        </button>

        <div className="steps-image"></div>

        <div className="steps-header">
          <h1>{recipeName}</h1>
          <p>Cooking Steps</p>
        </div>

        <div className="steps-list">
          {steps.length === 0 ? (
            <div className="steps-empty-box">
              <p>No steps found.</p>
              <span>Please try again.</span>
            </div>
          ) : (
            steps.map((step, index) => (
              <div className="step-card" key={step.step_number || index}>
                <h3>Step {step.step_number}</h3>
                <p>{step.instruction}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}