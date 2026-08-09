import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "../lib/icons";
import { formatDistanceKm, formatDuration, formatElevation, formatSpeedKmh } from "../lib/format";
import * as api from "../lib/api";
import type { Activity, Visibility } from "../lib/types";

const VISIBILITY_OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: "EVERYONE", label: "Everyone", hint: "Visible to anyone on Stamina" },
  { value: "FOLLOWERS", label: "Followers", hint: "Only people who follow you" },
  { value: "ONLY_ME", label: "Only me", hint: "Private, visible only to you" },
];

export function ActivitySave() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("EVERYONE");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getActivity(id).then(({ activity: a }) => {
      setActivity(a);
      setTitle(a.title);
      setVisibility(a.visibility);
    });
  }, [id]);

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await api.updateActivity(id, { title, visibility });
      navigate(`/activities/${id}`, { replace: true });
    } finally {
      setSaving(false);
    }
  }

  if (!activity) {
    return (
      <div className="screen screen--centered">
        <div className="loading-dots">Loading your activity…</div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen--centered" style={{ gap: 4 }}>
        <Icon name="stamina" size={36} style={{ color: "var(--color-primary)" }} />
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Nice work!</h1>
      </div>

      <div className="record-secondary" style={{ gap: 32 }}>
        <div>
          <div className="record-secondary-value" style={{ fontSize: 28 }}>
            {formatDistanceKm(activity.distance)}
          </div>
          <div className="record-secondary-label">KM</div>
        </div>
        <div>
          <div className="record-secondary-value" style={{ fontSize: 28 }}>
            {formatDuration(activity.duration)}
          </div>
          <div className="record-secondary-label">Time</div>
        </div>
      </div>

      <div className="record-secondary">
        <div>
          <div className="record-secondary-value">{formatSpeedKmh(activity.avgSpeed)} km/h</div>
          <div className="record-secondary-label">Avg Speed</div>
        </div>
        <div>
          <div className="record-secondary-value">{formatElevation(activity.elevationGain)}</div>
          <div className="record-secondary-label">Elevation</div>
        </div>
      </div>

      <div className="field">
        <label htmlFor="title">Title</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>
          Who can see this
        </div>
        <div className="option-list">
          {VISIBILITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`option-row ${visibility === option.value ? "is-selected" : ""}`}
              onClick={() => setVisibility(option.value)}
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

      <div style={{ marginTop: "auto" }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Activity"}
        </button>
      </div>
    </div>
  );
}
