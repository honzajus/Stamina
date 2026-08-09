import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/errors";
import { serializeActivity } from "../../lib/serializers";
import { defaultActivityTitle } from "./defaultTitle";
import { canViewActivity, getOwnedActiveActivity, recomputeAndFinish } from "./activities.service";

export async function startActivity(req: Request, res: Response) {
  const { sport, title } = req.body as { sport: string; title?: string };

  const activity = await prisma.activity.create({
    data: {
      userId: req.userId!,
      sport: sport as never,
      title: title ?? defaultActivityTitle(sport),
      status: "ACTIVE",
      startTime: new Date(),
    },
  });

  res.status(201).json({ activity: serializeActivity(activity) });
}

export async function addPoints(req: Request, res: Response) {
  const activity = await getOwnedActiveActivity(req.params.id, req.userId!);
  if (activity.status === "FINISHED") {
    throw ApiError.badRequest("Activity is already finished");
  }

  const { points } = req.body as {
    points: { latitude: number; longitude: number; altitude?: number; speed?: number; timestamp?: string }[];
  };

  const lastPoint = await prisma.gpsPoint.findFirst({
    where: { activityId: activity.id },
    orderBy: { sequence: "desc" },
  });
  let sequence = (lastPoint?.sequence ?? -1) + 1;

  await prisma.gpsPoint.createMany({
    data: points.map((p) => ({
      activityId: activity.id,
      sequence: sequence++,
      latitude: p.latitude,
      longitude: p.longitude,
      altitude: p.altitude,
      speed: p.speed,
      timestamp: p.timestamp ? new Date(p.timestamp) : new Date(),
    })),
  });

  res.status(201).json({ pointsAdded: points.length });
}

export async function pauseActivity(req: Request, res: Response) {
  const activity = await getOwnedActiveActivity(req.params.id, req.userId!);
  if (activity.status !== "ACTIVE") {
    throw ApiError.badRequest("Only an active activity can be paused");
  }

  const updated = await prisma.activity.update({
    where: { id: activity.id },
    data: { status: "PAUSED" },
  });
  res.json({ activity: serializeActivity(updated) });
}

export async function resumeActivity(req: Request, res: Response) {
  const activity = await getOwnedActiveActivity(req.params.id, req.userId!);
  if (activity.status !== "PAUSED") {
    throw ApiError.badRequest("Only a paused activity can be resumed");
  }

  const updated = await prisma.activity.update({
    where: { id: activity.id },
    data: { status: "ACTIVE" },
  });
  res.json({ activity: serializeActivity(updated) });
}

export async function finishActivity(req: Request, res: Response) {
  const activity = await getOwnedActiveActivity(req.params.id, req.userId!);
  if (activity.status === "FINISHED") {
    throw ApiError.badRequest("Activity is already finished");
  }

  const finished = await recomputeAndFinish(activity.id);
  res.json({ activity: serializeActivity(finished) });
}

export async function updateActivity(req: Request, res: Response) {
  const activity = await getOwnedActiveActivity(req.params.id, req.userId!);
  const data = req.body as { title?: string; visibility?: "EVERYONE" | "FOLLOWERS" | "ONLY_ME" };

  const updated = await prisma.activity.update({
    where: { id: activity.id },
    data,
  });
  res.json({ activity: serializeActivity(updated) });
}

export async function deleteActivity(req: Request, res: Response) {
  const activity = await getOwnedActiveActivity(req.params.id, req.userId!);
  await prisma.activity.delete({ where: { id: activity.id } });
  res.status(204).send();
}

export async function getActivity(req: Request, res: Response) {
  const activity = await prisma.activity.findUnique({
    where: { id: req.params.id },
    include: {
      user: true,
      points: { orderBy: { sequence: "asc" } },
      _count: { select: { staminas: true, comments: true } },
    },
  });
  if (!activity) throw ApiError.notFound("Activity not found");

  const visible = await canViewActivity(activity, req.userId);
  if (!visible) throw ApiError.forbidden("You do not have access to this activity");

  const viewerHasGivenStamina = req.userId
    ? Boolean(
        await prisma.stamina.findUnique({
          where: { userId_activityId: { userId: req.userId, activityId: activity.id } },
        })
      )
    : false;

  res.json({ activity: serializeActivity({ ...activity, viewerHasGivenStamina }) });
}

export async function listUserActivities(req: Request, res: Response) {
  const targetUserId = req.params.id;
  const limit = Number(req.query.limit ?? 20);
  const cursor = req.query.cursor as string | undefined;

  const isOwner = req.userId === targetUserId;

  const activities = await prisma.activity.findMany({
    where: {
      userId: targetUserId,
      status: "FINISHED",
      ...(isOwner
        ? {}
        : {
            OR: [
              { visibility: "EVERYONE" },
              ...(req.userId
                ? [
                    {
                      visibility: "FOLLOWERS" as const,
                      user: { followedBy: { some: { followerId: req.userId } } },
                    },
                  ]
                : []),
            ],
          }),
    },
    include: {
      user: true,
      points: { orderBy: { sequence: "asc" } },
      _count: { select: { staminas: true, comments: true } },
    },
    orderBy: { startTime: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = activities.length > limit;
  const page = hasMore ? activities.slice(0, limit) : activities;

  res.json({
    activities: page.map(serializeActivity),
    nextCursor: hasMore ? page[page.length - 1]?.id : null,
  });
}
