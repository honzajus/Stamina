import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { serializeActivity } from "../../lib/serializers";

/**
 * MVP feed algorithm (spec section 36): activities from the people the
 * viewer follows, newest first. No ranking, no personalization yet.
 */
export async function getFeed(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 20);
  const cursor = req.query.cursor as string | undefined;

  const following = await prisma.follow.findMany({
    where: { followerId: req.userId! },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);
  followingIds.push(req.userId!); // include the viewer's own activities

  const activities = await prisma.activity.findMany({
    where: {
      userId: { in: followingIds },
      status: "FINISHED",
      visibility: { in: ["EVERYONE", "FOLLOWERS"] },
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

  const staminaGiven = req.userId
    ? await prisma.stamina.findMany({
        where: { userId: req.userId, activityId: { in: page.map((a) => a.id) } },
        select: { activityId: true },
      })
    : [];
  const givenSet = new Set(staminaGiven.map((s) => s.activityId));

  res.json({
    activities: page.map((activity) =>
      serializeActivity({ ...activity, viewerHasGivenStamina: givenSet.has(activity.id) })
    ),
    nextCursor: hasMore ? page[page.length - 1]?.id : null,
  });
}
