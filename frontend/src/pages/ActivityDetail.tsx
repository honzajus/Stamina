import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { Avatar } from "../components/Avatar";
import { RouteMap } from "../components/RouteMap";
import { Icon, sportIconName } from "../lib/icons";
import { formatDistanceKm, formatDuration, formatElevation, formatSpeedKmh, formatRelativeDate } from "../lib/format";
import { shareLink } from "../lib/share";
import * as api from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Activity, Comment } from "../lib/types";

export function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [shareState, setShareState] = useState<"idle" | "shared" | "copied" | "failed">("idle");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getActivity(id), api.listComments(id)])
      .then(([activityRes, commentsRes]) => {
        setActivity(activityRes.activity);
        setComments(commentsRes.comments);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  async function toggleStamina() {
    if (!activity) return;
    if (!user) {
      navigate("/login");
      return;
    }
    const next = !activity.viewerHasGivenStamina;
    setActivity({ ...activity, viewerHasGivenStamina: next, staminaCount: activity.staminaCount + (next ? 1 : -1) });
    if (next) await api.giveStamina(activity.id);
    else await api.removeStamina(activity.id);
  }

  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    if (!activity || !commentText.trim()) return;
    if (!user) {
      navigate("/login");
      return;
    }
    const { comment } = await api.createComment(activity.id, commentText.trim());
    setComments((prev) => [...prev, comment]);
    setCommentText("");
    setActivity({ ...activity, commentCount: activity.commentCount + 1 });
  }

  async function handleShare() {
    if (!activity) return;
    const result = await shareLink(`${window.location.origin}/share/activities/${activity.id}`, activity.title);
    if (result === "cancelled") return;
    setShareState(result === "shared" ? "shared" : result === "copied" ? "copied" : "failed");
    setTimeout(() => setShareState("idle"), 2500);
  }

  async function handleDelete() {
    if (!activity || !window.confirm("Delete this activity? This cannot be undone.")) return;
    await api.deleteActivity(activity.id);
    navigate("/home", { replace: true });
  }

  if (notFound) {
    return (
      <div className="screen screen--centered">
        <p>This activity isn't available.</p>
        <button className="btn btn-outline" onClick={() => navigate(user ? "/home" : "/welcome")}>
          {user ? "Back to Home" : "Open Stamina"}
        </button>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="screen screen--centered">
        <div className="loading-dots">Loading activity…</div>
      </div>
    );
  }

  const isOwner = user?.id === activity.user?.id;

  return (
    <div className="screen">
      <TopBar onBack={() => navigate(-1)} right={isOwner && (
        <button className="icon-button" onClick={handleDelete} aria-label="Delete activity">
          <Icon name="close" size={18} />
        </button>
      )} />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={activity.user?.name ?? "Athlete"} avatarUrl={activity.user?.avatarUrl} size={48} />
        <div>
          <div style={{ fontWeight: 700 }}>{activity.user?.name ?? "Athlete"}</div>
          <div className="activity-card-meta">{formatRelativeDate(activity.startTime)}</div>
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)" }}>
          <Icon name={sportIconName(activity.sport)} size={20} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{activity.title}</h1>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card">
          <div className="activity-stat-value" style={{ fontSize: 22 }}>
            {formatDistanceKm(activity.distance)} km
          </div>
          <div className="activity-stat-label">Distance</div>
        </div>
        <div className="card">
          <div className="activity-stat-value" style={{ fontSize: 22 }}>
            {formatDuration(activity.duration)}
          </div>
          <div className="activity-stat-label">Time</div>
        </div>
        <div className="card">
          <div className="activity-stat-value" style={{ fontSize: 22 }}>
            {formatSpeedKmh(activity.avgSpeed)} km/h
          </div>
          <div className="activity-stat-label">Avg Speed</div>
        </div>
        <div className="card">
          <div className="activity-stat-value" style={{ fontSize: 22 }}>
            {formatElevation(activity.elevationGain)}
          </div>
          <div className="activity-stat-label">Elevation</div>
        </div>
      </div>

      {activity.map && (
        <div className="activity-card-map" style={{ margin: 0 }}>
          <RouteMap points={activity.map.points} height={480} />
        </div>
      )}

      <div className="activity-card-actions" style={{ margin: 0, border: "none", padding: 0 }}>
        <button className={`action-pill action-pill-lg ${activity.viewerHasGivenStamina ? "is-active" : ""}`} onClick={toggleStamina}>
          <Icon name="stamina" size={20} style={activity.viewerHasGivenStamina ? { color: "var(--color-primary)" } : undefined} />
          {activity.staminaCount} Stamina
        </button>
        <button className="action-pill action-pill-lg" onClick={handleShare}>
          <Icon name="share" size={20} />
          {shareState === "shared" ? "Shared" : shareState === "copied" ? "Link copied" : shareState === "failed" ? "Couldn't share" : "Share"}
        </button>
      </div>
      {shareState === "failed" && <div className="banner is-error">Couldn't share this link. Try again.</div>}

      <div>
        <div className="section-title" style={{ marginBottom: 12 }}>
          Comments
        </div>
        <div className="list">
          {comments.map((comment) => (
            <div
              className="list-row"
              key={comment.id}
              style={{ cursor: comment.user ? "pointer" : "default" }}
              onClick={() => {
                if (!comment.user) return;
                navigate(user ? `/users/${comment.user.id}` : `/share/users/${comment.user.id}`);
              }}
            >
              <Avatar name={comment.user?.name ?? "Athlete"} avatarUrl={comment.user?.avatarUrl} size={36} />
              <div className="list-row-body">
                <div className="list-row-title">{comment.user?.name}</div>
                <div className="list-row-subtitle">{comment.text}</div>
              </div>
            </div>
          ))}
          {comments.length === 0 && <div className="empty-state">No comments yet.</div>}
        </div>

        <form onSubmit={handleAddComment} style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <div className="search-input" style={{ flex: 1 }}>
            <input
              placeholder="Add a comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={500}
            />
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: "auto", padding: "12px 20px" }}>
            Post
          </button>
        </form>
      </div>
    </div>
  );
}
