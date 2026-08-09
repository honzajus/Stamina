import { MouseEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Activity } from "../lib/types";
import { Icon, sportIconName } from "../lib/icons";
import { formatDistanceKm, formatDuration, formatElevation, formatSpeedKmh, formatRelativeDate } from "../lib/format";
import { Avatar } from "./Avatar";
import { RouteImage } from "./RouteImage";
import * as api from "../lib/api";

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const navigate = useNavigate();
  const [given, setGiven] = useState(activity.viewerHasGivenStamina);
  const [count, setCount] = useState(activity.staminaCount);
  const [busy, setBusy] = useState(false);

  async function toggleStamina(e: MouseEvent) {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !given;
    setGiven(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      if (next) await api.giveStamina(activity.id);
      else await api.removeStamina(activity.id);
    } catch {
      setGiven(!next);
      setCount((c) => c + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="activity-card" onClick={() => navigate(`/activities/${activity.id}`)} style={{ cursor: "pointer" }}>
      <div className="activity-card-header">
        <Avatar name={activity.user?.name ?? "Athlete"} avatarUrl={activity.user?.avatarUrl} size={40} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{activity.user?.name ?? "Athlete"}</div>
          <div className="activity-card-meta">{formatRelativeDate(activity.startTime)}</div>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div className="activity-card-title">
          <Icon name={sportIconName(activity.sport)} size={18} style={{ color: "var(--color-primary)" }} />
          {activity.title}
        </div>
      </div>

      <div className="activity-card-map">
        {activity.map ? (
          <RouteImage
            points={activity.map.points}
            height={200}
            distance={activity.distance}
            duration={activity.duration}
            avgSpeed={activity.avgSpeed}
          />
        ) : null}
      </div>

      <div className="activity-card-stats">
        <div>
          <div className="activity-stat-value">{formatDistanceKm(activity.distance)} km</div>
          <div className="activity-stat-label">Distance</div>
        </div>
        <div>
          <div className="activity-stat-value">{formatDuration(activity.duration)}</div>
          <div className="activity-stat-label">Time</div>
        </div>
        <div>
          <div className="activity-stat-value">{formatSpeedKmh(activity.avgSpeed)} km/h</div>
          <div className="activity-stat-label">Avg Speed</div>
        </div>
      </div>

      <div className="activity-card-actions">
        <button className={`action-pill ${given ? "is-active" : ""}`} onClick={toggleStamina}>
          <Icon name="stamina" size={18} style={given ? { color: "var(--color-primary)" } : undefined} />
          {count} Stamina
        </button>
        <span className="action-pill" style={{ cursor: "default" }}>
          <Icon name="comment" size={18} />
          {activity.commentCount}
        </span>
        {activity.elevationGain > 0 && (
          <span className="action-pill" style={{ cursor: "default" }}>
            <Icon name="elevation" size={18} />
            {formatElevation(activity.elevationGain)}
          </span>
        )}
      </div>
    </article>
  );
}
