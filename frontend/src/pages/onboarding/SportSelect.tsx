import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, SPORT_LABEL, SPORTS, sportIconName } from "../../lib/icons";
import * as api from "../../lib/api";
import type { Sport } from "../../lib/types";
import { useAuth } from "../../lib/auth";

export function SportSelect() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [selected, setSelected] = useState<Sport[]>([]);
  const [saving, setSaving] = useState(false);

  function toggle(sport: Sport) {
    setSelected((prev) => (prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]));
  }

  async function handleContinue() {
    setSaving(true);
    try {
      if (selected.length > 0) {
        await api.updateMyProfile({ sports: selected });
        await refreshUser();
      }
      navigate("/onboarding/location");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <div style={{ marginTop: 24 }}>
        <div className="section-title">Step 1 of 2</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>What do you do?</h1>
        <p style={{ color: "var(--color-text-secondary)", marginTop: 4 }}>Pick as many as you like.</p>
      </div>

      <div className="sport-grid">
        {SPORTS.map((sport) => (
          <button
            key={sport}
            type="button"
            className={`sport-option ${selected.includes(sport as Sport) ? "is-selected" : ""}`}
            onClick={() => toggle(sport as Sport)}
          >
            <Icon name={sportIconName(sport)} size={22} />
            {SPORT_LABEL[sport]}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "auto" }}>
        <button className="btn btn-primary" disabled={selected.length === 0 || saving} onClick={handleContinue}>
          {saving ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
