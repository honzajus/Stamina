import { useNavigate } from "react-router-dom";

export function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="screen screen--centered">
      <img
        src="/stamina-mark.png"
        alt="Stamina"
        width={96}
        height={96}
        style={{ borderRadius: 28, objectFit: "cover" }}
      />

      <div>
        <div className="wordmark" style={{ fontSize: 32 }}>
          STAMINA
        </div>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 16, marginTop: 8 }}>
          Your movement.
          <br />
          Your progress.
        </p>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="btn btn-primary" onClick={() => navigate("/register")}>
          Get Started
        </button>
        <button className="btn-ghost" style={{ width: "100%" }} onClick={() => navigate("/login")}>
          I already have an account
        </button>
      </div>
    </div>
  );
}
