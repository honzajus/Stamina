import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { Avatar } from "../components/Avatar";
import { FriendsMap } from "../components/FriendsMap";
import { FriendsList } from "../components/FriendsList";
import { DiscoverCard } from "../components/DiscoverCard";
import { Icon } from "../lib/icons";
import * as api from "../lib/api";
import type { UserSearchResult } from "../lib/types";

type View = "search" | "map" | "friends";

export function Explore() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (view !== "search") return;
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(() => {
      api
        .searchUsers(query)
        .then(({ users }) => !cancelled && setResults(users))
        .finally(() => !cancelled && setLoading(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, view]);

  async function toggleFollow(user: UserSearchResult) {
    setResults((prev) => prev.map((u) => (u.id === user.id ? { ...u, isFollowing: !u.isFollowing } : u)));
    if (user.isFollowing) await api.unfollowUser(user.id);
    else await api.followUser(user.id);
  }

  return (
    <div className="screen">
      <TopBar title="Explore" />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className={view === "search" ? "btn btn-secondary" : "btn btn-outline"}
          style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}
          onClick={() => setView("search")}
        >
          <Icon name="search" size={16} />
          Search
        </button>
        <button
          className={view === "map" ? "btn btn-secondary" : "btn btn-outline"}
          style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}
          onClick={() => setView("map")}
        >
          <Icon name="layers" size={16} />
          Map
        </button>
        <button
          className={view === "friends" ? "btn btn-secondary" : "btn btn-outline"}
          style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}
          onClick={() => setView("friends")}
        >
          <Icon name="user" size={16} />
          Friends
        </button>
      </div>

      {view === "search" ? (
        <>
          <div className="search-input">
            <Icon name="search" size={18} color="var(--color-text-secondary)" />
            <input placeholder="Search athletes" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {loading && <div className="loading-dots">Searching…</div>}

          {!loading && results.length === 0 && (
            <div className="empty-state card">No athletes found. Try a different name.</div>
          )}

          <div className="list">
            {results.map((athlete) => (
              <div className="list-row" key={athlete.id}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: "pointer" }}
                  onClick={() => navigate(`/users/${athlete.id}`)}
                >
                  <Avatar name={athlete.name} avatarUrl={athlete.avatarUrl} size={40} />
                  <div className="list-row-title">{athlete.name}</div>
                </div>
                <button
                  className={athlete.isFollowing ? "btn btn-outline" : "btn btn-primary"}
                  style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}
                  onClick={() => toggleFollow(athlete)}
                >
                  {athlete.isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            ))}
          </div>

          <DiscoverCard />

          <div className="empty-state" style={{ fontSize: 12 }}>
            Segments, challenges and clubs are coming in a later release.
          </div>
        </>
      ) : view === "map" ? (
        <FriendsMap />
      ) : (
        <FriendsList />
      )}
    </div>
  );
}
