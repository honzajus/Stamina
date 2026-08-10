import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "./Avatar";
import { ActivityCard } from "./ActivityCard";
import { LocationMap } from "./LocationMap";
import { Icon, SPORT_LABEL } from "../lib/icons";
import { formatDistanceKm, formatDuration, formatElevation, formatPace } from "../lib/format";
import { shareLink } from "../lib/share";
import { useAuth } from "../lib/auth";
import * as api from "../lib/api";
import type { Activity, PeriodStats, User, UserRecords } from "../lib/types";

interface ProfileContentProps {
  userId: string;
  isSelf: boolean;
}

export function ProfileContent({ userId, isSelf }: ProfileContentProps) {
  const navigate = useNavigate();
  const { user: viewer } = useAuth();
  const [profile, setProfile] = useState<{
    user: User;
    counts: { activities: number; followers: number; following: number };
    thisYear: PeriodStats;
  } | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shareState, setShareState] = useState<"idle" | "shared" | "copied" | "failed">("idle");
  const [records, setRecords] = useState<UserRecords | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.getUserProfile(userId), api.listUserActivities(userId)]).then(
      ([profileRes, activitiesRes]) => {
        if (cancelled) return;
        setProfile(profileRes);
        setActivities(activitiesRes.activities);
        setIsFollowing(profileRes.isFollowing);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!isSelf) return;
    let cancelled = false;
    api.getMyRecords().then(({ records: r }) => {
      if (!cancelled) setRecords(r);
    });
    return () => {
      cancelled = true;
    };
  }, [isSelf]);

  async function toggleFollow() {
    if (!viewer) {
      navigate("/login");
      return;
    }
    setIsFollowing((prev) => !prev);
    if (isFollowing) await api.unfollowUser(userId);
    else await api.followUser(userId);
  }

  async function handleShare() {
    const result = await shareLink(`${window.location.origin}/share/users/${userId}`, `${profile?.user.name} on Stamina`);
    if (result === "cancelled") return;
    setShareState(result === "shared" ? "shared" : result === "copied" ? "copied" : "failed");
    setTimeout(() => setShareState("idle"), 2500);
  }

  if (loading || !profile) {
    return <div className="loading-dots">Loading profile…</div>;
  }

  const { user, counts, thisYear } = profile;

  return (
    <>
      <div className="profile-header">
        <Avatar name={user.name} avatarUrl={user.avatarUrl} size={88} />
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>{user.name}</h1>
        {user.sports.length > 0 && (
          <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>
            {user.sports.map((s) => SPORT_LABEL[s]).join(" · ")}
          </p>
        )}
        {user.bio && <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>{user.bio}</p>}
        {user.location && (
          <p style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-text-secondary)", fontSize: 13 }}>
            <Icon name="pin" size={14} />
            {user.location}
          </p>
        )}

        <div className="profile-counts">
          <div>
            <div className="profile-count-value">{counts.activities}</div>
            <div className="profile-count-label">Activities</div>
          </div>
          <div>
            <div className="profile-count-value">{counts.followers}</div>
            <div className="profile-count-label">Followers</div>
          </div>
          <div>
            <div className="profile-count-value">{counts.following}</div>
            <div className="profile-count-label">Following</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16, width: "100%" }}>
          {isSelf ? (
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate("/you/edit")}>
              Edit Profile
            </button>
          ) : (
            <button className={isFollowing ? "btn btn-outline" : "btn btn-primary"} style={{ flex: 1 }} onClick={toggleFollow}>
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
          <button className="icon-button" onClick={handleShare} aria-label="Share profile">
            <Icon name="share" size={18} />
          </button>
        </div>
        {shareState === "copied" && <div className="banner">Profile link copied</div>}
        {shareState === "failed" && <div className="banner is-error">Couldn't share this profile. Try again.</div>}
      </div>

      {user.locationLat !== null && user.locationLng !== null && (
        <div>
          <div className="section-title" style={{ marginBottom: 12 }}>
            Location
          </div>
          <div className="activity-card-map" style={{ margin: 0 }}>
            <LocationMap latitude={user.locationLat} longitude={user.locationLng} />
          </div>
        </div>
      )}

      <div>
        <div className="section-title" style={{ marginBottom: 12 }}>
          This year
        </div>
        <div className="stat-grid">
          <div className="card">
            <div className="activity-stat-value">{formatDistanceKm(thisYear.distance)}</div>
            <div className="activity-stat-label">Km</div>
          </div>
          <div className="card">
            <div className="activity-stat-value">{thisYear.activities}</div>
            <div className="activity-stat-label">Activities</div>
          </div>
          <div className="card">
            <div className="activity-stat-value">{formatElevation(thisYear.elevationGain)}</div>
            <div className="activity-stat-label">Elevation</div>
          </div>
        </div>
      </div>

      {records && (records.currentStreakDays > 0 || records.longestDistanceMeters > 0) && (
        <div>
          <div className="section-title" style={{ marginBottom: 12 }}>
            Records &amp; streaks
          </div>
          <div className="stat-grid">
            <div className="card">
              <div className="activity-stat-value">{records.currentStreakDays}</div>
              <div className="activity-stat-label">Day streak</div>
            </div>
            <div className="card">
              <div className="activity-stat-value">{records.longestStreakDays}</div>
              <div className="activity-stat-label">Best streak</div>
            </div>
            <div className="card">
              <div className="activity-stat-value">{formatDistanceKm(records.longestDistanceMeters)}</div>
              <div className="activity-stat-label">Longest km</div>
            </div>
            <div className="card">
              <div className="activity-stat-value">{formatDuration(records.longestDurationSeconds)}</div>
              <div className="activity-stat-label">Longest time</div>
            </div>
            {records.bestRunPaceSecondsPerKm !== null && (
              <div className="card">
                <div className="activity-stat-value">{formatPace(records.bestRunPaceSecondsPerKm)}</div>
                <div className="activity-stat-label">Best pace /km</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="section-title" style={{ marginBottom: 12 }}>
          Activity history
        </div>
        {activities.length === 0 && <div className="empty-state card">No activities yet.</div>}
        <div className="list">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={{ ...activity, user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl, icon: { key: "user", url: "" } } }} />
          ))}
        </div>
      </div>
    </>
  );
}
