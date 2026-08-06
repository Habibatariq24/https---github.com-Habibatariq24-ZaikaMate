import React from "react";
import "./styles.css";

export default function HomeScreen({ navigation }) {
  return (
    <div className="home-container">
      <img src="/avater.jpg" className="home-image" alt="chef" />

      <h1 className="home-title">
        Welcome to <span>ZiakaMate</span>
        <br />
        Your Smart Recipe Partner
      </h1>

      <div className="home-buttons">
        <button
          className="login-btn"
          onClick={() => navigation.navigate("login")}
        >
          Login
        </button>

        <button
          className="signup-btn"
          onClick={() => navigation.navigate("signup")}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
