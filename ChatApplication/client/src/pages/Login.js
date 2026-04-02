import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      await login(email, pw);
      nav("/");
    } catch (err) {
      setError(err.message || "Error");
      alert("Error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-title">Log in</div>
        <div className="auth-subtitle">Welcome back to ChatDM</div>

        <form onSubmit={submit}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <button type="submit">Log in</button>
        </form>

        {error && (
          <div style={{ marginTop: "0.6rem", fontSize: "0.8rem", color: "#ff9aeb" }}>
            {error}
          </div>
        )}

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
