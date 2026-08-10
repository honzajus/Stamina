import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { Avatar } from "../components/Avatar";
import { LocationMap } from "../components/LocationMap";
import { Icon, SPORT_LABEL, SPORTS, sportIconName } from "../lib/icons";
import { useAuth } from "../lib/auth";
import * as api from "../lib/api";
import { pickAvatarPhoto } from "../lib/avatar";
import { getCurrentLocation } from "../lib/nativeLocation";
import { reverseGeocode } from "../lib/geocode";
import type { Gender, Sport } from "../lib/types";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

export function EditProfile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [locationLat, setLocationLat] = useState<number | null>(user?.locationLat ?? null);
  const [locationLng, setLocationLng] = useState<number | null>(user?.locationLng ?? null);
  const [sports, setSports] = useState<Sport[]>((user?.sports as Sport[]) ?? []);
  const [heightCm, setHeightCm] = useState(user?.heightCm != null ? String(user.heightCm) : "");
  const [weightKg, setWeightKg] = useState(user?.weightKg != null ? String(user.weightKg) : "");
  const [birthYear, setBirthYear] = useState(user?.birthYear != null ? String(user.birthYear) : "");
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [weeklyGoalKm, setWeeklyGoalKm] = useState(
    user?.weeklyGoalMeters != null ? String(user.weeklyGoalMeters / 1000) : ""
  );
  const [saving, setSaving] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  function toggleSport(sport: Sport) {
    setSports((prev) => (prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]));
  }

  async function handlePickPhoto() {
    setPickingPhoto(true);
    try {
      const dataUrl = await pickAvatarPhoto();
      if (dataUrl) setAvatarUrl(dataUrl);
    } finally {
      setPickingPhoto(false);
    }
  }

  async function handleUseCurrentLocation() {
    setLocating(true);
    setLocationError(null);
    try {
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;
      const result = await reverseGeocode(latitude, longitude);
      setLocation(result.label);
      setLocationLat(latitude);
      setLocationLng(longitude);
    } catch {
      setLocationError("Couldn't get your location. Check that location access is allowed.");
    } finally {
      setLocating(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateMyProfile({
        name,
        bio,
        avatarUrl: avatarUrl || undefined,
        location,
        locationLat: locationLat ?? undefined,
        locationLng: locationLng ?? undefined,
        sports,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        birthYear: birthYear ? Number(birthYear) : undefined,
        gender: gender ?? undefined,
        weeklyGoalMeters: weeklyGoalKm ? Number(weeklyGoalKm) * 1000 : undefined,
      });
      await refreshUser();
      navigate("/you", { replace: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <TopBar onBack={() => navigate(-1)} title="Edit Profile" />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Avatar name={name || "Athlete"} avatarUrl={avatarUrl} size={96} />
          <button type="button" className="btn btn-secondary" style={{ width: "auto", padding: "10px 20px" }} onClick={handlePickPhoto} disabled={pickingPhoto}>
            <Icon name="camera" size={18} />
            {pickingPhoto ? "Opening…" : "Change Photo"}
          </button>
        </div>

        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
        </div>
        <div className="field">
          <label htmlFor="bio">Bio</label>
          <input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} placeholder="Runner" />
        </div>

        <div className="field">
          <label htmlFor="location">Location</label>
          <input id="location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} />
          <button
            type="button"
            className="btn btn-outline"
            style={{ marginTop: 4 }}
            onClick={handleUseCurrentLocation}
            disabled={locating}
          >
            <Icon name="pin" size={18} />
            {locating ? "Locating…" : "Use Current Location"}
          </button>
          {locationError && <div className="form-error">{locationError}</div>}
          {locationLat !== null && locationLng !== null && (
            <div className="activity-card-map" style={{ margin: "8px 0 0" }}>
              <LocationMap latitude={locationLat} longitude={locationLng} />
            </div>
          )}
        </div>

        <div>
          <div className="section-title" style={{ marginBottom: 8 }}>
            Sports
          </div>
          <div className="sport-grid">
            {SPORTS.map((s) => (
              <button
                key={s}
                type="button"
                className={`sport-option ${sports.includes(s as Sport) ? "is-selected" : ""}`}
                onClick={() => toggleSport(s as Sport)}
              >
                <Icon name={sportIconName(s)} size={20} />
                {SPORT_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="weeklyGoalKm">Weekly distance goal (km)</label>
          <input
            id="weeklyGoalKm"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.1}
            value={weeklyGoalKm}
            onChange={(e) => setWeeklyGoalKm(e.target.value)}
            placeholder="e.g. 20"
          />
        </div>

        <div>
          <div className="section-title" style={{ marginBottom: 8 }}>
            Body basics
          </div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 12, marginBottom: 12 }}>
            Used to estimate things like your step count. Optional.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
