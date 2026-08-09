import { formatDistanceKm, formatDuration, formatSpeedKmh } from "../lib/format";
import type { MapPoint } from "../lib/types";

interface RouteImageProps {
  points: MapPoint[];
  height?: number;
  distance?: number;
  duration?: number;
  avgSpeed?: number | null;
}

const BRAND_GREEN = "#16a34a";
const VIEW_W = 400;
const VIEW_H = 300;
const PADDING = 28;

function buildPath(points: MapPoint[]): { d: string; start: [number, number]; end: [number, number] } {
  const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
  const cosLat = Math.cos((avgLat * Math.PI) / 180) || 1;

  const xs = points.map((p) => p.longitude * cosLat);
  const ys = points.map((p) => p.latitude);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1e-6;
  const spanY = maxY - minY || 1e-6;

  const innerW = VIEW_W - PADDING * 2;
  const innerH = VIEW_H - PADDING * 2;
  const scale = Math.min(innerW / spanX, innerH / spanY);
  const offsetX = PADDING + (innerW - spanX * scale) / 2;
  const offsetY = PADDING + (innerH - spanY * scale) / 2;

  const projected = points.map((_, i) => {
    const x = offsetX + (xs[i] - minX) * scale;
    const y = offsetY + (maxY - ys[i]) * scale;
    return [x, y] as [number, number];
  });

  const d = projected.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return { d, start: projected[0], end: projected[projected.length - 1] };
}

/**
 * A Strava-style shareable route image: the recorded GPS track rendered as
 * a plain green SVG line on a clean card, with distance/time/avg speed
 * stamped on top. No map tiles, no external requests.
 */
export function RouteImage({ points, height = 220, distance, duration, avgSpeed }: RouteImageProps) {
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

  const { d, start, end } = buildPath(points);
  const hasStats = distance !== undefined && duration !== undefined;

  return (
    <div style={{ position: "relative", height, background: "var(--color-primary-light)" }}>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <path d={d} fill="none" stroke={BRAND_GREEN} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={start[0]} cy={start[1]} r={6} fill="#ffffff" stroke={BRAND_GREEN} strokeWidth={3} />
        <circle cx={end[0]} cy={end[1]} r={7} fill={BRAND_GREEN} stroke="#ffffff" strokeWidth={2.5} />
      </svg>

      {hasStats && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "space-around",
            padding: "18px 12px 14px",
            background: "linear-gradient(to top, rgba(17, 24, 20, 0.55), transparent)",
          }}
        >
          <RouteStat label="Distance" value={`${formatDistanceKm(distance!)} km`} />
          <RouteStat label="Time" value={formatDuration(duration!)} />
          <RouteStat label="Avg Speed" value={`${formatSpeedKmh(avgSpeed)} km/h`} />
        </div>
      )}
    </div>
  );
}

function RouteStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>{value}</div>
      <div style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
    </div>
  );
}
