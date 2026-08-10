import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../lib/api";
import type { Gender } from "../../lib/types";
import { useAuth } from "../../lib/auth";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

export function BodyMetrics() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data: Parameters<typeof api.updateMyProfile>[0] = {};
      if (heightCm) data.heightCm = Number(heightCm);
      if (weightKg) data.weightKg = Number(weightKg);
      if (birthYear) data.birthYear = Number(birthYear);
      if (gender) data.gender = gender;

      if (Object.keys(data).length > 0) {
        await api.updateMyProfile(data);
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
        <div className="section-title">Step 2 of 3</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>A few body basics</h1>
        <p style={{ color: "var(--color-text-secondary)", marginTop: 4 }}>
          Lets Stamina estimate things like your step count. Optional, and you can change this later.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field">
          <label htmlFor="heightCm">Height (cm)</label>
          <input
            id="heightCm"
            type="number"
            inputMode="numeric"
            min={50}
            max={272}
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="175"
          />
        </div>
        <div className="field">
          <label htmlFor="weightKg">Weight (kg)</label>
          <input
            id="weightKg"
            type="number"
            inputMode="numeric"
            min={20}
            max={400}
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="70"
          />
        </div>
        <div className="field">
          <label htmlFor="birthYear">Birth year</label>
          <input
            id="birthYear"
            type="number"
            inputMode="numeric"
            min={1900}
            max={new Date().getFullYear()}
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder="1995"
          />
        </div>

        <div>
          <div className="section-title" style={{ marginBottom: 8 }}>
            Gender
          </div>
          <div className="option-list">
            {GENDER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`option-row ${gender === option.value ? "is-selected" : ""}`}
                onClick={() => setGender(option.value)}
              >
                <span className="radio-dot">{gender === option.value && <span className="radio-dot-fill" />}</span>
                <span className="option-row-text">
                  <strong>{option.label}</strong>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Continue"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            style={{ width: "100%" }}
            onClick={() => navigate("/onboarding/location")}
          >
            Skip for now
          </button>
        </div>
      </form>
    </div>
  );
}
