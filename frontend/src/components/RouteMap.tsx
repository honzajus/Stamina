import { Marker, Polyline } from "react-leaflet";
import { MapView } from "./MapView";
import { pinIcon, dotIcon } from "../lib/mapIcon";
import type { MapPoint } from "../lib/types";

interface RouteMapProps {
  points: MapPoint[];
  height?: number;
}

const BRAND_GREEN = "#16a34a";
const NEUTRAL_MARKER = "#111814";

// Built once at module load rather than per render/instance — the colors
// never change, so there's no reason to rebuild these divIcons every time
// a RouteMap re-renders (e.g. on every comment posted on the activity).
const START_ICON = dotIcon(NEUTRAL_MARKER);
const END_ICON = pinIcon(BRAND_GREEN);

/**
 * Real, pannable/zoomable map (Leaflet + free OpenStreetMap/CARTO tiles, no
 * API key). The route itself is the only thing on this map drawn in Stamina
 * Green — the start pin stays neutral so the green line reads clearly as
 * "the route."
 */
export function RouteMap({ points, height = 320 }: RouteMapProps) {
  if (points.length < 2) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-secondary)",
          fontSize: 13,
          fontWeight: 600,
          background: "var(--color-primary-light)",
          borderRadius: "var(--radius-card)",
        }}
      >
        No route recorded
      </div>
    );
  }

  const path = points.map((p) => [p.latitude, p.longitude] as [number, number]);
  const start = path[0];
  const end = path[path.length - 1];

  return (
    <MapView center={end} bounds={path} height={height}>
      <Polyline positions={path} pathOptions={{ color: BRAND_GREEN, weight: 4, lineCap: "round", lineJoin: "round" }} />
      <Marker position={start} icon={START_ICON} />
      <Marker position={end} icon={END_ICON} />
    </MapView>
  );
}
