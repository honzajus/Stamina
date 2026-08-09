import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/errors";
import { serializeComment, serializeStamina } from "../../lib/serializers";
import { canViewActivity } from "../activities/activities.service";

async function findVisibleActivity(activityId: string, viewerId?: string) {
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) throw ApiError.notFound("Activity not found");

  const visible = await canViewActivity(activity, viewerId);
  if (!visible) throw ApiError.forbidden("You do not have access to this activity");

  return activity;
}

export async function giveStamina(req: Request, res: Response) {
  const activity = await findVisibleActivity(req.params.id, req.userId);

  const stamina = await prisma.stamina.upsert({
    where: { userId_activityId: { userId: req.userId!, activityId: activity.id } },
    create: { userId: req.userId!, activityId: activity.id },
    update: {},
  });

  res.status(201).json({ stamina: serializeStamina(stamina) });
}

export async function removeStamina(req: Request, res: Response) {
  await prisma.stamina
    .delete({
      where: { userId_activityId: { userId: req.userId!, activityId: req.params.id } },
    })
    .catch(() => {
      // already withdrawn: treat as a no-op success
    });

  res.status(204).send();
}

export async function listStamina(req: Request, res: Response) {
  const activity = await findVisibleActivity(req.params.id, req.userId);
  const staminas = await prisma.stamina.findMany({
    where: { activityId: activity.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ staminas: staminas.map(serializeStamina) });
}

export async function createComment(req: Request, res: Response) {
  const activity = await findVisibleActivity(req.params.id, req.userId);
  const { text } = req.body as { text: string };

  const comment = await prisma.comment.create({
    data: { text, userId: req.userId!, activityId: activity.id },
    include: { user: true },
  });

  res.status(201).json({ comment: serializeComment(comment) });
}

export async function listComments(req: Request, res: Response) {
  const activity = await findVisibleActivity(req.params.id, req.userId);
  const comments = await prisma.comment.findMany({
    where: { activityId: activity.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  res.json({ comments: comments.map(serializeComment) });
}

export async function deleteComment(req: Request, res: Response) {
  const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });
  if (!comment) throw ApiError.notFound("Comment not found");
  if (comment.userId !== req.userId) throw ApiError.forbidden("You do not own this comment");

  await prisma.comment.delete({ where: { id: comment.id } });
  res.status(204).send();
}
