import React from "react";
import "./styles.css";

export default function MainScreen({ navigation, user }) {
  return (
    <div className="main-page">
      <div className="main-container">

        {/* Back Button */}
        <button
          className="main-back-button"
          onClick={() => navigation.navigate("home")}
        >
          ← Back
        </button>

        <h1 className="main-title">Hello 👋 {user?.name || "there"}</h1>
        <p className="main-subtitle">Welcome to ZaikaMate</p>

        <div className="card-container">
          <div
            className="card"
            onClick={() => navigation.navigate("ingredient")}
          >
            <span className="icon">🍽️</span>
            <h3>Get Recipe</h3>
          </div>

          <div
            className="card"
            onClick={() => navigation.navigate("avatar")}
          >
            <span className="icon">🎤</span>
            <h3>Talk to Avatar</h3>
          </div>
        </div>

      </div>
    </div>
  );
}