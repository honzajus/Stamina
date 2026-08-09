import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { StatCard } from "../components/StatCard";
import { ActivityCard } from "../components/ActivityCard";
import { useAuth } from "../lib/auth";
import * as api from "../lib/api";
import type { Activity, ProgressResponse } from "../lib/types";
import { formatDistanceKm } from "../lib/format";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.myProgress("week"), api.getFeed()])
      .then(([progressRes, feedRes]) => {
        if (cancelled) return;
        setProgress(progressRes);
        setActivities(feedRes.activities);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="screen">
      <TopBar />
      <h1 className="greeting">
        {greeting()}, {user?.name.split(" ")[0]}
      </h1>

      {progress && (
        <StatCard
          label="This week"
          value={`${formatDistanceKm(progress.current.distance)} km`}
          delta={
            progress.distanceChangePercent !== null
              ? `${progress.distanceChangePercent >= 0 ? "↑" : "↓"} ${Math.abs(
                  Math.round(progress.distanceChangePercent)
                )}%`
              : undefined
          }
          deltaPositive={progress.distanceChangePercent !== null && progress.distanceChangePercent >= 0}
          sub={`${progress.current.activities} ${progress.current.activities === 1 ? "activity" : "activities"}`}
          onClick={() => navigate("/progress")}
        />
      )}

      <div>
        <div className="section-title" style={{ marginBottom: 12 }}>
          Your feed
        </div>

        {loading && <div className="loading-dots">Loading feed…</div>}

        {!loading && activities.length === 0 && (
          <div className="empty-state card">
            No activities yet. Follow athletes in Explore, or record your first activity.
          </div>
        )}

        <div className="list">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </div>
  );
}
