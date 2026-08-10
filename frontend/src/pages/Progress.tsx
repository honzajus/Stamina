import { useEffect, useMemo, useState } from "react";
import { TopBar } from "../components/TopBar";
import { StatCard } from "../components/StatCard";
import { WeeklyChart, DayDistance } from "../components/WeeklyChart";
import { formatDistanceKm, formatDuration, formatElevation } from "../lib/format";
import * as api from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Activity, ProgressResponse, StatsRange } from "../lib/types";

const RANGES: { value: StatsRange; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function bucketByDay(activities: Activity[]): DayDistance[] {
  const weekStart = startOfWeek(new Date());
  const buckets = DAY_LABELS.map((label) => ({ label, km: 0 }));

  for (const activity of activities) {
    const start = new Date(activity.startTime);
    if (start < weekStart) continue;
    const dayIndex = Math.floor((start.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
    if (dayIndex >= 0 && dayIndex < 7) {
      buckets[dayIndex].km += activity.distance / 1000;
    }
  }

  return buckets;
}

export function Progress() {
  const { user } = useAuth();
  const [range, setRange] = useState<StatsRange>("week");
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [chartData, setChartData] = useState<DayDistance[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([api.myProgress(range), range === "week" ? api.listUserActivities(user.id, 50) : Promise.resolve(null)])
      .then(([progressRes, activitiesRes]) => {
        if (cancelled) return;
        setProgress(progressRes);
        setChartData(activitiesRes ? bucketByDay(activitiesRes.activities) : null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range, user]);

  const deltaLabel = useMemo(() => {
    if (!progress || progress.distanceChangePercent === null) return undefined;
    const pct = Math.round(progress.distanceChangePercent);
    return `${pct >= 0 ? "↑" : "↓"} ${Math.abs(pct)}% vs last ${range}`;
  }, [progress, range]);

  return (
    <div className="screen">
      <TopBar title="Your Progress" />

      <div style={{ display: "flex", gap: 8 }}>
        {RANGES.map((r) => (
          <button
            key={r.value}
            className={r.value === range ? "btn btn-secondary" : "btn btn-outline"}
            style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}
            onClick={() => setRange(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading-dots">Loading progress…</div>}

      {progress && !loading && (
        <>
          <StatCard
            label={`This ${range}`}
            value={`${formatDistanceKm(progress.current.distance)} km`}
            delta={deltaLabel}
            deltaPositive={(progress.distanceChangePercent ?? 0) >= 0}
            sub={`${progress.current.activities} ${progress.current.activities === 1 ? "activity" : "activities"}`}
          />

          {range === "week" && user?.weeklyGoalMeters && (
            <div className="card">
              <div className="card-label" style={{ marginBottom: 8 }}>
                Weekly goal
              </div>
              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  background: "var(--color-primary-light)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(100, (progress.current.distance / user.weeklyGoalMeters) * 100)}%`,
                    background: "var(--color-brand)",
                    borderRadius: 999,
                  }}
                />
              </div>
              <div className="stat-sub" style={{ marginTop: 8 }}>
                {formatDistanceKm(progress.current.distance)} / {formatDistanceKm(user.weeklyGoalMeters)} km
                {progress.current.distance >= user.weeklyGoalMeters ? " — goal reached!" : ""}
              </div>
            </div>
          )}

          {chartData && (
            <div className="card">
              <div className="card-label" style={{ marginBottom: 8 }}>
                Distance
              </div>
              <WeeklyChart data={chartData} />
            </div>
          )}

          <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="card">
              <div className="activity-stat-value" style={{ fontSize: 20 }}>
                {formatDuration(progress.current.movingTime)}
              </div>
              <div className="activity-stat-label">Moving time</div>
            </div>
            <div className="card">
              <div className="activity-stat-value" style={{ fontSize: 20 }}>
                {formatElevation(progress.current.elevationGain)}
              </div>
              <div className="activity-stat-label">Elevation</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
