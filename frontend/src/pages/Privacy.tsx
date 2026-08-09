import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../lib/auth";
import * as api from "../lib/api";
import type { Visibility } from "../lib/types";

const VISIBILITY_OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: "EVERYONE", label: "Everyone", hint: "New activities are visible to anyone on Stamina" },
  { value: "FOLLOWERS", label: "Followers", hint: "New activities are visible to your followers only" },
  { value: "ONLY_ME", label: "Only me", hint: "New activities are private by default" },
];

export function Privacy() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [visibility, setVisibility] = useState<Visibility>(user?.visibility ?? "EVERYONE");
  const [saving, setSaving] = useState(false);

  async function handleChange(value: Visibility) {
    setVisibility(value);
    setSaving(true);
    try {
      await api.updateMyProfile({ visibility: value });
      await refreshUser();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <TopBar onBack={() => navigate(-1)} title="Privacy" />

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>
          Default activity visibility
        </div>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 12 }}>
          You can still change the visibility of any single activity when you save it.
        </p>
        <div className="option-list">
          {VISIBILITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`option-row ${visibility === option.value ? "is-selected" : ""}`}
              disabled={saving}
              onClick={() => handleChange(option.value)}
            >
              <span className="radio-dot">{visibility === option.value && <span className="radio-dot-fill" />}</span>
              <span className="option-row-text">
                <strong>{option.label}</strong>
                <span>{option.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
