import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { serializeNotification } from "../../lib/serializers";

export async function listNotifications(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 30);
  const cursor = req.query.cursor as string | undefined;

  const notifications = await prisma.notification.findMany({
    where: { recipientId: req.userId! },
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = notifications.length > limit;
  const page = hasMore ? notifications.slice(0, limit) : notifications;

  // No hard foreign key to Activity (a notification should survive the
  // activity being deleted later), so the title is resolved best-effort.
  const activityIds = [...new Set(page.map((n) => n.activityId).filter((id): id is string => Boolean(id)))];
  const activities = activityIds.length
    ? await prisma.activity.findMany({ where: { id: { in: activityIds } }, select: { id: true, title: true } })
    : [];
  const activityTitleById = new Map(activities.map((a) => [a.id, a.title]));

  res.json({
    notifications: page.map((n) => serializeNotification(n, activityTitleById.get(n.activityId ?? "") ?? null)),
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
  });
}

export async function unreadCount(req: Request, res: Response) {
  const count = await prisma.notification.count({ where: { recipientId: req.userId!, read: false } });
  res.json({ count });
}

export async function markAllRead(req: Request, res: Response) {
  await prisma.notification.updateMany({ where: { recipientId: req.userId!, read: false }, data: { read: true } });
  res.status(204).send();
}
