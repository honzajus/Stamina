import { Activity } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/errors";
import { computeActivityStats, estimateStepCount, filterGpsNoise } from "../../lib/geo";

/** Returns whether `viewerId` is allowed to see `activity`, honoring its privacy setting. */
export async function canViewActivity(activity: Activity, viewerId?: string): Promise<boolean> {
  if (activity.userId === viewerId) return true;

  switch (activity.visibility) {
    case "EVERYONE":
      return true;
    case "ONLY_ME":
      return false;
    case "FOLLOWERS": {
      if (!viewerId) return false;
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: activity.userId } },
      });
      return Boolean(follow);
    }
    default:
      return false;
  }
}

export async function getOwnedActiveActivity(activityId: string, userId: string) {
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) throw ApiError.notFound("Activity not found");
  if (activity.userId !== userId) throw ApiError.forbidden("You do not own this activity");
  return activity;
}

export async function recomputeAndFinish(activityId: string) {
  const [activity, points] = await Promise.all([
    prisma.activity.findUniqueOrThrow({ where: { id: activityId }, include: { user: true } }),
    prisma.gpsPoint.findMany({ where: { activityId }, orderBy: { sequence: "asc" } }),
  ]);

  const clean = filterGpsNoise(
    points.map((p) => ({
      latitude: p.latitude,
      longitude: p.longitude,
      altitude: p.altitude,
      timestamp: p.timestamp,
    }))
  );

  const stats = computeActivityStats(clean);
  const stepCount = estimateStepCount(stats.distanceMeters, activity.user.heightCm, activity.sport);

  return prisma.activity.update({
    where: { id: activityId },
    data: {
      status: "FINISHED",
      endTime: new Date(),
      distance: stats.distanceMeters,
      duration: Math.round(stats.durationSeconds),
      pace: stats.paceSecondsPerKm,
      avgSpeed: stats.avgSpeedMs,
      elevationGain: stats.elevationGainMeters,
      stepCount,
    },
  });
}
