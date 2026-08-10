import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../lib/icons";
import { reverseGeocode } from "../lib/geocode";
import * as api from "../lib/api";
import type { DiscoverSuggestion } from "../lib/types";

interface Place extends DiscoverSuggestion {
  label: string;
}

/**
 * Spotify-"Made For You"-style suggestions: places people the viewer
 * follows already go (real recorded activity, never random unvisited
 * terrain) that the viewer personally hasn't explored yet. Renders nothing
 * until there's enough activity data to say anything meaningful — the
 * backend guard in getDiscoverSuggestions returns an empty list otherwise.
 */
export function DiscoverCard() {
  const navigate = useNavigate();
  const [places, setPlaces] = useState<Place[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getDiscoverSuggestions().then(async ({ suggestions }) => {
      const labeled = await Promise.all(
        suggestions.map(async (s) => ({ ...s, label: (await reverseGeocode(s.latitude, s.longitude)).label }))
      );
      if (!cancelled) setPlaces(labeled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!places || places.length === 0) return null;

  return (
    <div>
      <div className="section-title" style={{ marginBottom: 4 }}>
        Suggested for you
      </div>
      <p style={{ color: "var(--color-text-secondary)", fontSize: 12, marginBottom: 12 }}>
        Places people you follow go that you haven't explored yet.
      </p>

      <div className="list">
        {places.map((place, i) => (
          <div className="list-row" key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--color-primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "var(--color-primary-dark)",
                }}
              >
                <Icon name="pin" size={18} />
              </div>
              <div className="list-row-body">
                <div className="list-row-title">{place.label}</div>
                <div className="list-row-subtitle">Popular with people you follow</div>
              </div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "auto", padding: "8px 16px", fontSize: 13 }}
              onClick={() => navigate("/record")}
            >
              Start here
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
