import { prisma } from "../../lib/prisma";

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
