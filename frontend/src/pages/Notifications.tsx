import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { Avatar } from "../components/Avatar";
import { formatTimeAgo } from "../lib/format";
import * as api from "../lib/api";
import type { AppNotification } from "../lib/types";

function describe(notification: AppNotification): string {
  switch (notification.type) {
    case "FOLLOW":
      return "started following you";
    case "STAMINA":
      return `gave Stamina to ${notification.activityTitle ?? "your activity"}`;
    case "COMMENT":
      return `commented on ${notification.activityTitle ?? "your activity"}`;
    default:
      return "";
  }
}

export function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getNotifications().then(({ notifications: list }) => {
      if (!cancelled) setNotifications(list);
    });
    api.markNotificationsRead().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function handleOpen(notification: AppNotification) {
    if (notification.type === "FOLLOW") {
      if (notification.actor) navigate(`/users/${notification.actor.id}`);
      return;
    }
    if (notification.activityId) navigate(`/activities/${notification.activityId}`);
  }

  return (
    <div className="screen">
      <TopBar onBack={() => navigate(-1)} title="Notifications" />

      {notifications === null && <div className="loading-dots">Loading…</div>}

      {notifications !== null && notifications.length === 0 && (
        <div className="empty-state card">
          Nothing yet. Follows, Stamina and comments on your activities will show up here.
        </div>
      )}

      <div className="list">
        {notifications?.map((notification) => (
          <button
            key={notification.id}
            className="list-row"
            style={{ opacity: notification.read ? 0.7 : 1, textAlign: "left" }}
            onClick={() => handleOpen(notification)}
          >
            <Avatar name={notification.actor?.name ?? "Athlete"} avatarUrl={notification.actor?.avatarUrl} size={40} />
            <div className="list-row-body">
              <div className="list-row-title">
                {notification.actor?.name ?? "Someone"} <span style={{ fontWeight: 400 }}>{describe(notification)}</span>
              </div>
              <div className="list-row-subtitle">{formatTimeAgo(notification.createdAt)}</div>
            </div>
            {!notification.read && (
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--color-brand)",
                  flexShrink: 0,
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
