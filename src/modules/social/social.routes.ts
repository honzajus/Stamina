import { Router } from "express";
import { requireAuth, attachAuthIfPresent } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../lib/asyncHandler";
import { createCommentSchema } from "./social.schemas";
import * as socialController from "./social.controller";

/** Mounted at /api/activities/:id — reactions and comments on a single activity. */
export const activitySocialRouter = Router({ mergeParams: true });

activitySocialRouter.post("/stamina", requireAuth, asyncHandler(socialController.giveStamina));
activitySocialRouter.delete("/stamina", requireAuth, asyncHandler(socialController.removeStamina));
activitySocialRouter.get("/stamina", attachAuthIfPresent, asyncHandler(socialController.listStamina));

activitySocialRouter.post("/comments", requireAuth, validateBody(createCommentSchema), asyncHandler(socialController.createComment));
activitySocialRouter.get("/comments", attachAuthIfPresent, asyncHandler(socialController.listComments));

/** Mounted at /api/comments — operations addressed by comment id directly. */
export const commentsRouter = Router();
commentsRouter.delete("/:commentId", requireAuth, asyncHandler(socialController.deleteComment));
