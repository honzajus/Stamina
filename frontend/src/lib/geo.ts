export interface TrackedPoint {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  timestamp: number;
}

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two coordinates, in meters. Mirrors the API's GPS engine. */
export function haversineDistanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)));

  return EARTH_RADIUS_METERS * c;
}

export interface LiveStats {
  distanceMeters: number;
  elevationGainMeters: number;
}

/** Incrementally folds a new point into running distance/elevation totals for live UI feedback. */
export function accumulateStats(previous: LiveStats, prevPoint: TrackedPoint | null, point: TrackedPoint): LiveStats {
  if (!prevPoint) return previous;

  const distanceMeters = previous.distanceMeters + haversineDistanceMeters(prevPoint, point);
  let elevationGainMeters = previous.elevationGainMeters;
  if (typeof prevPoint.altitude === "number" && typeof point.altitude === "number") {
    const delta = point.altitude - prevPoint.altitude;
    if (delta > 0) elevationGainMeters += delta;
  }

  return { distanceMeters, elevationGainMeters };
}
