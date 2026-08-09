import { Router } from "express";
import { requireAuth, attachAuthIfPresent } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../lib/asyncHandler";
import {
  addPointsSchema,
  startActivitySchema,
  updateActivitySchema,
} from "./activities.schemas";
import * as activitiesController from "./activities.controller";
import { activitySocialRouter } from "../social/social.routes";

export const activitiesRouter = Router();

activitiesRouter.use("/:id", activitySocialRouter);

activitiesRouter.post("/start", requireAuth, validateBody(startActivitySchema), asyncHandler(activitiesController.startActivity));
activitiesRouter.post("/:id/points", requireAuth, validateBody(addPointsSchema), asyncHandler(activitiesController.addPoints));
activitiesRouter.post("/:id/pause", requireAuth, asyncHandler(activitiesController.pauseActivity));
activitiesRouter.post("/:id/resume", requireAuth, asyncHandler(activitiesController.resumeActivity));
activitiesRouter.post("/:id/finish", requireAuth, asyncHandler(activitiesController.finishActivity));
activitiesRouter.patch("/:id", requireAuth, validateBody(updateActivitySchema), asyncHandler(activitiesController.updateActivity));
activitiesRouter.delete("/:id", requireAuth, asyncHandler(activitiesController.deleteActivity));
activitiesRouter.get("/:id", attachAuthIfPresent, asyncHandler(activitiesController.getActivity));
