import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../lib/icons";
import * as api from "../lib/api";

export function NotificationBell() {
  const navigate = useNavigate();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getUnreadNotificationCount().then(({ count }) => {
      if (!cancelled) setHasUnread(count > 0);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <button
      className="icon-button"
      style={{ position: "relative" }}
      onClick={() => navigate("/notifications")}
      aria-label="Notifications"
    >
      <Icon name="bell" size={20} />
      {hasUnread && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--color-brand)",
            border: "1.5px solid var(--color-bg)",
          }}
        />
      )}
    </button>
  );
}
