import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "./Avatar";
import { Icon } from "../lib/icons";
import { formatTimeAgo } from "../lib/format";
import * as api from "../lib/api";
import type { Friend } from "../lib/types";

export function FriendsList() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getFriends().then(({ users }) => {
      if (!cancelled) setFriends(users);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      await api.unfollowUser(id);
      setFriends((prev) => prev?.filter((f) => f.id !== id) ?? prev);
    } finally {
      setRemovingId(null);
    }
  }

  if (!friends) {
    return <div className="loading-dots">Loading friends…</div>;
  }

  if (friends.length === 0) {
    return (
      <div className="empty-state card">
        You aren't following anyone yet. Find people in Search to add friends.
      </div>
    );
  }

  return (
    <div className="list">
      {friends.map((friend) => (
        <div className="list-row" key={friend.id}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: "pointer" }}
            onClick={() => navigate(`/users/${friend.id}`)}
          >
            <Avatar name={friend.name} avatarUrl={friend.avatarUrl} size={44} />
            <div className="list-row-body">
              <div className="list-row-title">{friend.name}</div>
              <div className="list-row-subtitle">
                {friend.location ? `${friend.location} · ` : ""}
                Last active: {formatTimeAgo(friend.lastActivityAt)}
              </div>
            </div>
          </div>
          <button
            className="icon-button"
            aria-label={`Unfollow ${friend.name}`}
            disabled={removingId === friend.id}
            onClick={() => handleRemove(friend.id)}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
