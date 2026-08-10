/**
 * GPS engine utilities: distance, pace, speed and elevation gain
 * derived from a raw sequence of GPS points.
 *
 * Pipeline (see spec section 35):
 *   raw points -> distance -> speed -> pace -> elevation -> activity stats
 */

const EARTH_RADIUS_METERS = 6371000;

export interface RawGpsPoint {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  timestamp: string | Date;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two coordinates, in meters (Haversine formula). */
export function haversineDistanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Basic GPS noise filter: drops points that would imply an unrealistic
 * speed jump from the previous accepted point (likely a signal glitch).
 */
export function filterGpsNoise(points: RawGpsPoint[], maxSpeedMs = 12): RawGpsPoint[] {
  if (points.length === 0) return [];

  const filtered: RawGpsPoint[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = filtered[filtered.length - 1];
    const curr = points[i];
    const dtSeconds =
      (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
    if (dtSeconds <= 0) continue;

    const distance = haversineDistanceMeters(prev, curr);
    const speed = distance / dtSeconds;
    if (speed <= maxSpeedMs) {
      filtered.push(curr);
    }
  }
  return filtered;
}

export interface ActivityStats {
  distanceMeters: number;
  durationSeconds: number;
  paceSecondsPerKm: number | null;
  avgSpeedMs: number | null;
  elevationGainMeters: number;
}

/** Computes total distance, pace, average speed and elevation gain from a clean point series. */
export function computeActivityStats(points: RawGpsPoint[]): ActivityStats {
  if (points.length < 2) {
    return {
      distanceMeters: 0,
      durationSeconds: 0,
      paceSecondsPerKm: null,
      avgSpeedMs: null,
      elevationGainMeters: 0,
    };
  }

  let distanceMeters = 0;
  let elevationGainMeters = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    distanceMeters += haversineDistanceMeters(prev, curr);

    if (typeof prev.altitude === "number" && typeof curr.altitude === "number") {
      const delta = curr.altitude - prev.altitude;
      if (delta > 0) elevationGainMeters += delta;
    }
  }

  const durationSeconds = Math.max(
    0,
    (new Date(points[points.length - 1].timestamp).getTime() -
      new Date(points[0].timestamp).getTime()) /
      1000
  );

  const avgSpeedMs = durationSeconds > 0 ? distanceMeters / durationSeconds : null;
  const paceSecondsPerKm =
    distanceMeters > 0 ? durationSeconds / (distanceMeters / 1000) : null;

  return { distanceMeters, durationSeconds, paceSecondsPerKm, avgSpeedMs, elevationGainMeters };
}

// Standard anthropometric stride-length approximations (stride ~= height x
// a sport-dependent factor). Only sports where "steps" is a meaningful unit
// get a factor; the rest (cycling, swimming, driving, ...) return null.
const STEP_LENGTH_FACTOR: Record<string, number> = {
  WALKING: 0.414,
  HIKING: 0.414,
  RUNNING: 0.45,
};

/** Estimated stride length in meters for a given sport and height, or null if steps don't apply to that sport. */
export function estimateStepLengthMeters(heightCm: number, sport: string): number | null {
  const factor = STEP_LENGTH_FACTOR[sport];
  if (!factor || heightCm <= 0) return null;
  return (heightCm / 100) * factor;
}

/** Estimated step count for an activity, or null if the sport has no step concept or the user has no height on file. */
export function estimateStepCount(distanceMeters: number, heightCm: number | null | undefined, sport: string): number | null {
  if (!heightCm) return null;
  const stepLength = estimateStepLengthMeters(heightCm, sport);
  if (!stepLength) return null;
  return Math.round(distanceMeters / stepLength);
}
