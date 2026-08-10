import { prisma } from "../../lib/prisma";

export type NotificationType = "FOLLOW" | "STAMINA" | "COMMENT";

/** Never notifies a user about their own action (following themselves isn't possible, but giving Stamina/commenting on your own activity is). */
export async function createNotification(params: {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  activityId?: string;
}) {
  if (params.recipientId === params.actorId) return;

  await prisma.notification.create({
    data: {
      recipientId: params.recipientId,
      actorId: params.actorId,
      type: params.type,
      activityId: params.activityId,
    },
  });
}
