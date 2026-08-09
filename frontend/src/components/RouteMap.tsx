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
      <Marker position={start} icon={dotIcon(NEUTRAL_MARKER)} />
      <Marker position={end} icon={pinIcon(BRAND_GREEN)} />
    </MapView>
  );
}
