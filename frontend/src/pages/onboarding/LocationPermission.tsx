import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../../lib/icons";
import { requestLocationPermission } from "../../lib/nativeLocation";

export function LocationPermission() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");

  async function requestLocation() {
    setStatus("requesting");
    const granted = await requestLocationPermission();
    if (granted) {
      setStatus("granted");
      setTimeout(() => navigate("/home"), 600);
    } else {
      setStatus("denied");
    }
  }

  return (
    <div className="screen screen--centered">
      <div className="section-title">Step 2 of 2</div>

      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: "var(--color-primary-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="map" size={40} style={{ color: "var(--color-primary-dark)" }} />
      </div>

      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Location</h1>
        <p style={{ color: "var(--color-text-secondary)", marginTop: 8 }}>
          Stamina needs your location to accurately track your activity.
        </p>
      </div>

      {status === "denied" && (
        <div className="banner is-error">
          Location wasn't granted. You can still explore Stamina, but recording won't track a route until it's
          allowed in Settings.
        </div>
      )}
      {status === "granted" && <div className="banner">Location enabled. Let's move.</div>}

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="btn btn-primary" onClick={requestLocation} disabled={status === "requesting"}>
          {status === "requesting" ? "Requesting…" : "Allow Location"}
        </button>
        <button className="btn-ghost" style={{ width: "100%" }} onClick={() => navigate("/home")}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
