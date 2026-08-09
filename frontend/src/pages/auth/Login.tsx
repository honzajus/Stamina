import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { ApiError } from "../../lib/api";
import { Icon } from "../../lib/icons";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/home");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not log you in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen">
      <div style={{ marginTop: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Welcome back</h1>
        <p style={{ color: "var(--color-text-secondary)", marginTop: 4 }}>Log in to keep your Stamina going.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                padding: 6,
                display: "flex",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
              }}
            >
              <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
            </button>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Logging in…" : "Log In"}
        </button>
      </form>

      <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13 }}>
        New to Stamina?{" "}
        <a href="/register" onClick={(e) => { e.preventDefault(); navigate("/register"); }} style={{ color: "var(--color-text)", fontWeight: 700, textDecoration: "underline" }}>
          Create an account
        </a>
      </p>
    </div>
  );
}
