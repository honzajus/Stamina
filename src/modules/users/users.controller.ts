import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/errors";
import { serializeUser, serializeUserSummary } from "../../lib/serializers";
import { uploadAvatarIfDataUrl } from "../../lib/supabaseStorage";
import { getDiscoverSuggestions, getUserProgress, getUserRecords, getUserStats, StatsRange } from "./users.service";
import { createNotification } from "../notifications/notifications.service";

export async function searchUsers(req: Request, res: Response) {
  const query = ((req.query.search as string) ?? "").trim();

  const users = await prisma.user.findMany({
    where: query
      ? {
          name: { contains: query },
          ...(req.userId ? { id: { not: req.userId } } : {}),
        }
      : req.userId
        ? { id: { not: req.userId } }
        : {},
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const followingIds = req.userId
    ? new Set(
        (
          await prisma.follow.findMany({
            where: { followerId: req.userId, followingId: { in: users.map((u) => u.id) } },
            select: { followingId: true },
          })
        ).map((f) => f.followingId)
      )
    : new Set<string>();

  res.json({
    users: users.map((u) => ({ ...serializeUserSummary(u), isFollowing: followingIds.has(u.id) })),
  });
}

export async function getUserProfile(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw ApiError.notFound("User not found");

  const [activityCount, followerCount, followingCount, yearStats, viewerFollow] = await Promise.all([
    prisma.activity.count({ where: { userId: user.id, status: "FINISHED" } }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    getUserStats(user.id, "year"),
    req.userId
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: req.userId, followingId: user.id } },
        })
      : null,
  ]);

  res.json({
    user: serializeUser(user),
    counts: { activities: activityCount, followers: followerCount, following: followingCount },
    thisYear: yearStats,
    isFollowing: Boolean(viewerFollow),
  });
}

export async function updateMyProfile(req: Request, res: Response) {
  const data = req.body as Partial<{
    name: string;
    bio: string;
    avatarUrl: string;
    location: string;
    locationLat: number;
    locationLng: number;
    sports: string[];
    visibility: "EVERYONE" | "FOLLOWERS" | "ONLY_ME";
    heightCm: number;
    weightKg: number;
    birthYear: number;
    gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
    weeklyGoalMeters: number;
  }>;

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...data,
      avatarUrl: await uploadAvatarIfDataUrl(req.userId!, data.avatarUrl),
      sports: data.sports ? JSON.stringify(data.sports) : undefined,
    },
  });

  res.json({ user: serializeUser(user) });
}

export async function followUser(req: Request, res: Response) {
  const targetId = req.params.id;
  if (targetId === req.userId) {
    throw ApiError.badRequest("You cannot follow yourself");
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) throw ApiError.notFound("User not found");

  const alreadyFollowing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.userId!, followingId: targetId } },
  });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: req.userId!, followingId: targetId } },
    create: { followerId: req.userId!, followingId: targetId },
    update: {},
  });

  // Only notify on the first follow — a repeat call (e.g. a double tap) is a no-op, not a new event.
  if (!alreadyFollowing) {
    await createNotification({ recipientId: targetId, actorId: req.userId!, type: "FOLLOW" });
  }

  res.status(201).json({ following: true });
}

export async function unfollowUser(req: Request, res: Response) {
  const targetId = req.params.id;
  await prisma.follow
    .delete({
      where: { followerId_followingId: { followerId: req.userId!, followingId: targetId } },
    })
    .catch(() => {
      // already not following: treat as a no-op success
    });

  res.json({ following: false });
}

export async function listFollowers(req: Request, res: Response) {
  const follows = await prisma.follow.findMany({
    where: { followingId: req.params.id },
    include: { follower: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ users: follows.map((f) => serializeUserSummary(f.follower)) });
}

export async function listFollowing(req: Request, res: Response) {
  const follows = await prisma.follow.findMany({
    where: { followerId: req.params.id },
    include: { following: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ users: follows.map((f) => serializeUserSummary(f.following)) });
}

export async function listFriends(req: Request, res: Response) {
  const follows = await prisma.follow.findMany({
    where: { followerId: req.userId! },
    include: { following: true },
    orderBy: { createdAt: "desc" },
  });

  const friendIds = follows.map((f) => f.followingId);
  const lastActivities = friendIds.length
    ? await prisma.activity.groupBy({
        by: ["userId"],
        where: { userId: { in: friendIds }, status: "FINISHED" },
        _max: { startTime: true },
      })
    : [];
  const lastActivityByUserId = new Map(lastActivities.map((a) => [a.userId, a._max.startTime]));

  res.json({
    users: follows.map((f) => ({
      ...serializeUserSummary(f.following),
      location: f.following.location,
      locationLat: f.following.locationLat,
      locationLng: f.following.locationLng,
      lastActivityAt: lastActivityByUserId.get(f.followingId) ?? null,
    })),
  });
}

export async function myStats(req: Request, res: Response) {
  const range = req.query.range as StatsRange;
  const stats = await getUserStats(req.userId!, range);
  res.json({ range, stats });
}

export async function myProgress(req: Request, res: Response) {
  const range = req.query.range as StatsRange;
  const progress = await getUserProgress(req.userId!, range);
  res.json(progress);
}

export async function discover(req: Request, res: Response) {
  const suggestions = await getDiscoverSuggestions(req.userId!);
  res.json({ suggestions });
}

export async function myRecords(req: Request, res: Response) {
  const records = await getUserRecords(req.userId!);
  res.json({ records });
}
