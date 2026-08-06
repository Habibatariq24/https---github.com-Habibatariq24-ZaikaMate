import React, { useState } from "react";
import { signupUser } from "./api/recipeapi";
import { saveAuthSession } from "./utils/authStorage";
import "./styles.css";

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState("");
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

    return error?.message || "Signup failed. Please try again.";
  };

  const onSignup = async () => {
    setError("");

    const cleanedUsername = username.trim();
    const cleanedEmail = email.trim();
    const cleanedPassword = password.trim();

    if (!cleanedUsername || !cleanedEmail || !cleanedPassword) {
      setError("Please fill all fields.");
      return;
    }

    if (cleanedUsername.length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }

    if (cleanedPassword.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    try {
      setLoading(true);

      const auth = await signupUser({
        username: cleanedUsername,
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

          <p className="auth-greeting">👋 Create your chef account</p>

          <div className="auth-card">
            <h2 className="auth-title">Sign Up</h2>

            {error && <p className="auth-error">{error}</p>}

            <input
              className="auth-input"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

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
              onClick={onSignup}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>

            <p className="auth-switch-text">
              Already have an account?{" "}
              <span
                className="auth-switch-link"
                onClick={() => navigation.navigate("login")}
              >
                Login
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}