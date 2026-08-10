import { prisma } from "../../lib/prisma";
import { computeStreaks } from "../../lib/streak";

export type StatsRange = "week" | "month" | "year";

interface Period {
  start: Date;
  end: Date;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function currentAndPreviousPeriod(range: StatsRange, now = new Date()): { current: Period; previous: Period } {
  if (range === "week") {
    const currentStart = startOfWeek(now);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);
    return {
      current: { start: currentStart, end: now },
      previous: { start: previousStart, end: currentStart },
    };
  }

  if (range === "month") {
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      current: { start: currentStart, end: now },
      previous: { start: previousStart, end: currentStart },
    };
  }

  const currentStart = new Date(now.getFullYear(), 0, 1);
  const previousStart = new Date(now.getFullYear() - 1, 0, 1);
  return {
    current: { start: currentStart, end: now },
    previous: { start: previousStart, end: currentStart },
  };
}

async function aggregateActivities(userId: string, period: Period) {
  const result = await prisma.activity.aggregate({
    where: {
      userId,
      status: "FINISHED",
      startTime: { gte: period.start, lt: period.end },
    },
    _sum: { distance: true, elevationGain: true, duration: true },
    _count: { _all: true },
  });

  return {
    distance: result._sum.distance ?? 0,
    elevationGain: result._sum.elevationGain ?? 0,
    movingTime: result._sum.duration ?? 0,
    activities: result._count._all,
  };
}

export async function getUserStats(userId: string, range: StatsRange) {
  const { current } = currentAndPreviousPeriod(range, new Date());
  return aggregateActivities(userId, current);
}

export async function getUserProgress(userId: string, range: StatsRange) {
  const { current, previous } = currentAndPreviousPeriod(range, new Date());
  const [currentStats, previousStats] = await Promise.all([
    aggregateActivities(userId, current),
    aggregateActivities(userId, previous),
  ]);

  const distanceChangePercent =
    previousStats.distance > 0
      ? ((currentStats.distance - previousStats.distance) / previousStats.distance) * 100
      : null;

  return {
    range,
    current: currentStats,
    previous: previousStats,
    distanceChangePercent,
  };
}

// "Discover" route suggestions: places other people (visible to the viewer)
// already go that the viewer personally hasn't been. Only ever surfaces
// cells with real recorded activity in them, never unvisited terrain with
// no signal at all — and only once there's enough data to say anything
// meaningful.
const DISCOVER_RADIUS_KM = 15;
const DISCOVER_CELL_DEGREES = 0.0027; // ~300m, coarse enough to smooth out GPS noise
const MIN_VIEWER_ACTIVITIES = 3;
const MIN_COMMUNITY_POINTS = 50;
const MAX_SUGGESTIONS = 5;

export interface DiscoverSuggestion {
  latitude: number;
  longitude: number;
  popularity: number;
}

export function cellKey(latitude: number, longitude: number): string {
  return `${Math.floor(latitude / DISCOVER_CELL_DEGREES)}:${Math.floor(longitude / DISCOVER_CELL_DEGREES)}`;
}

export function boundingBox(latitude: number, longitude: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos((latitude * Math.PI) / 180) || 1);
  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLng: longitude - lngDelta,
    maxLng: longitude + lngDelta,
  };
}

async function getAnchorPoint(
  userId: string,
  user: { locationLat: number | null; locationLng: number | null }
): Promise<{ latitude: number; longitude: number } | null> {
  if (user.locationLat != null && user.locationLng != null) {
    return { latitude: user.locationLat, longitude: user.locationLng };
  }

  const latestPoint = await prisma.gpsPoint.findFirst({
    where: { activity: { userId, status: "FINISHED" } },
    orderBy: { timestamp: "desc" },
    select: { latitude: true, longitude: true },
  });
  return latestPoint;
}

export interface UserRecords {
  longestDistanceMeters: number;
  longestDurationSeconds: number;
  bestRunPaceSecondsPerKm: number | null;
  currentStreakDays: number;
  longestStreakDays: number;
}

/** Personal records + activity streaks, computed from the user's existing finished activities (no new data collected). */
export async function getUserRecords(userId: string): Promise<UserRecords> {
  const activities = await prisma.activity.findMany({
    where: { userId, status: "FINISHED" },
    select: { sport: true, distance: true, duration: true, pace: true, startTime: true },
  });

  const longestDistanceMeters = activities.reduce((max, a) => Math.max(max, a.distance), 0);
  const longestDurationSeconds = activities.reduce((max, a) => Math.max(max, a.duration), 0);

  const runningPaces = activities
    .filter((a) => a.sport === "RUNNING" && a.pace != null)
    .map((a) => a.pace as number);
  const bestRunPaceSecondsPerKm = runningPaces.length > 0 ? Math.min(...runningPaces) : null;

  const activityDates = activities.map((a) => a.startTime.toISOString().slice(0, 10));
  const today = new Date().toISOString().slice(0, 10);
  const { currentStreakDays, longestStreakDays } = computeStreaks(activityDates, today);

  return { longestDistanceMeters, longestDurationSeconds, bestRunPaceSecondsPerKm, currentStreakDays, longestStreakDays };
}

export async function getDiscoverSuggestions(userId: string): Promise<DiscoverSuggestion[]> {
  const [viewer, finishedCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.activity.count({ where: { userId, status: "FINISHED" } }),
  ]);

  if (finishedCount < MIN_VIEWER_ACTIVITIES) return [];

  const anchor = await getAnchorPoint(userId, viewer);
  if (!anchor) return [];

  const bbox = boundingBox(anchor.latitude, anchor.longitude, DISCOVER_RADIUS_KM);
  const followingIds = (
    await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } })
  ).map((f) => f.followingId);

  const [ownPoints, otherPoints] = await Promise.all([
    prisma.gpsPoint.findMany({
      where: { activity: { userId, status: "FINISHED" } },
      select: { latitude: true, longitude: true },
      take: 5000,
    }),
    prisma.gpsPoint.findMany({
      where: {
        latitude: { gte: bbox.minLat, lte: bbox.maxLat },
        longitude: { gte: bbox.minLng, lte: bbox.maxLng },
        activity: {
          status: "FINISHED",
          userId: { not: userId },
          OR: [{ visibility: "EVERYONE" }, { visibility: "FOLLOWERS", userId: { in: followingIds } }],
        },
      },
      select: { latitude: true, longitude: true },
      take: 5000,
    }),
  ]);

  if (otherPoints.length < MIN_COMMUNITY_POINTS) return [];

  const visited = new Set(ownPoints.map((p) => cellKey(p.latitude, p.longitude)));

  const cells = new Map<string, { count: number; sumLat: number; sumLng: number }>();
  for (const point of otherPoints) {
    const key = cellKey(point.latitude, point.longitude);
    if (visited.has(key)) continue;
    const cell = cells.get(key) ?? { count: 0, sumLat: 0, sumLng: 0 };
    cell.count += 1;
    cell.sumLat += point.latitude;
    cell.sumLng += point.longitude;
    cells.set(key, cell);
  }

  return Array.from(cells.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_SUGGESTIONS)
    .map((cell) => ({
      latitude: cell.sumLat / cell.count,
      longitude: cell.sumLng / cell.count,
      popularity: cell.count,
    }));
}
