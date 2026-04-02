import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [u, setU] = useState("");
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  const [error, setError] = useState("");

  const submit = async (ev) => {
    ev.preventDefault();
    try {
      setError("");
      await register(u, e, p);
      nav("/login");
    } catch (err) {
      setError(err.message || "Error");
      alert("Error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-title">Create account</div>
        <div className="auth-subtitle">Join the conversation</div>

        <form onSubmit={submit}>
          <input
            placeholder="Username"
            value={u}
            onChange={(e) => setU(e.target.value)}
          />
          <input
            placeholder="Email"
            value={e}
            onChange={(e) => setE(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            value={p}
            onChange={(e) => setP(e.target.value)}
          />
          <button type="submit">Sign up</button>
        </form>

        {error && (
          <div style={{ marginTop: "0.6rem", fontSize: "0.8rem", color: "#ff9aeb" }}>
            {error}
          </div>
        )}

        <div className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
