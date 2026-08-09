import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Marker, Popup } from "react-leaflet";
import { MapView } from "./MapView";
import { Avatar } from "./Avatar";
import { avatarPinIcon } from "../lib/mapIcon";
import { formatTimeAgo } from "../lib/format";
import { useAuth } from "../lib/auth";
import * as api from "../lib/api";
import type { Friend } from "../lib/types";

const DEFAULT_CENTER: [number, number] = [20, 0];

export function FriendsMap() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getFriends().then(({ users }) => {
      if (!cancelled) setFriends(users);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!friends) {
    return <div className="loading-dots">Loading map…</div>;
  }

  const located = friends.filter(
    (f): f is Friend & { locationLat: number; locationLng: number } => f.locationLat !== null && f.locationLng !== null
  );
  const hasSelf = Boolean(user && user.locationLat !== null && user.locationLng !== null);

  if (located.length === 0 && !hasSelf) {
    return (
      <div className="empty-state card">
        None of your friends have shared a location yet. Set yours in Edit Profile.
      </div>
    );
  }

  const points = [
    ...(hasSelf ? [[user!.locationLat as number, user!.locationLng as number] as [number, number]] : []),
    ...located.map((f) => [f.locationLat, f.locationLng] as [number, number]),
  ];
  const center = points[0] ?? DEFAULT_CENTER;

  return (
    <MapView center={center} bounds={points} height={420}>
      {hasSelf && (
        <Marker
          position={[user!.locationLat as number, user!.locationLng as number]}
          icon={avatarPinIcon(user!.name, user!.avatarUrl, { self: true })}
        >
          <Popup>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={user!.name} avatarUrl={user!.avatarUrl} size={32} />
              <div style={{ fontWeight: 700 }}>You</div>
            </div>
            <button className="btn-ghost" style={{ padding: "6px 0 0", fontSize: 13 }} onClick={() => navigate("/you")}>
              View profile
            </button>
          </Popup>
        </Marker>
      )}
      {located.map((friend) => (
        <Marker key={friend.id} position={[friend.locationLat, friend.locationLng]} icon={avatarPinIcon(friend.name, friend.avatarUrl)}>
          <Popup>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={friend.name} avatarUrl={friend.avatarUrl} size={32} />
              <div>
                <div style={{ fontWeight: 700 }}>{friend.name}</div>
                {friend.location && <div style={{ fontSize: 12 }}>{friend.location}</div>}
              </div>
            </div>
            <div style={{ fontSize: 12, marginTop: 6, color: "var(--color-text-secondary)" }}>
              Last active: {formatTimeAgo(friend.lastActivityAt)}
            </div>
            <button
              className="btn-ghost"
              style={{ padding: "6px 0 0", fontSize: 13 }}
              onClick={() => navigate(`/users/${friend.id}`)}
            >
              View profile
            </button>
          </Popup>
        </Marker>
      ))}
    </MapView>
  );
}
