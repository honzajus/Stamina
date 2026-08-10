import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateQuery } from "../../middleware/validate";
import { asyncHandler } from "../../lib/asyncHandler";
import { listNotificationsQuerySchema } from "./notifications.schemas";
import * as notificationsController from "./notifications.controller";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  requireAuth,
  validateQuery(listNotificationsQuerySchema),
  asyncHandler(notificationsController.listNotifications)
);
notificationsRouter.get("/unread-count", requireAuth, asyncHandler(notificationsController.unreadCount));
notificationsRouter.post("/read", requireAuth, asyncHandler(notificationsController.markAllRead));
