import React, { useState } from "react";
import { loginUser } from "./api/recipeapi";
import { saveAuthSession } from "./utils/authStorage";
import "./styles.css";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getErrorMessage = (error) => {
    const detail = error?.response?.data?.detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item?.msg || item?.message || "Invalid input")
        .join("\n");
    }

    if (typeof detail === "string") {
      return detail;
    }

    return error?.message || "Login failed. Please try again.";
  };

  const onLogin = async () => {
    setError("");

    const cleanedEmail = email.trim();
    const cleanedPassword = password.trim();

    if (!cleanedEmail || !cleanedPassword) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const auth = await loginUser({
        email: cleanedEmail,
        password: cleanedPassword,
      });

      await saveAuthSession(auth);

      localStorage.setItem("authSession", JSON.stringify(auth));

      navigation.navigate("main", {
        user: auth.user,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <button
          className="auth-back-button"
          onClick={() => navigation.navigate("home")}
        >
          ← Back
        </button>

        <div className="auth-inner">
          <img
            src="/avaterwave.jpg"
            className="auth-avatar"
            alt="chef avatar"
          />

          <p className="auth-greeting">👋 Welcome, Chef!</p>

          <div className="auth-card">
            <h2 className="auth-title">Login</h2>

            {error && <p className="auth-error">{error}</p>}

            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="auth-button"
              onClick={onLogin}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="auth-switch-text">
              Don't have an account?{" "}
              <span
                className="auth-switch-link"
                onClick={() => navigation.navigate("signup")}
              >
                Sign up
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}