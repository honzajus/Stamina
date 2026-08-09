import { Router } from "express";
import { requireAuth, attachAuthIfPresent } from "../../middleware/auth";
import { validateBody, validateQuery } from "../../middleware/validate";
import { asyncHandler } from "../../lib/asyncHandler";
import { statsRangeSchema, updateProfileSchema } from "./users.schemas";
import * as usersController from "./users.controller";
import * as activitiesController from "../activities/activities.controller";

export const usersRouter = Router();

// Specific "me" and "search" routes must be registered before the "/:id" catch-all.
usersRouter.get("/", attachAuthIfPresent, asyncHandler(usersController.searchUsers));
usersRouter.patch("/me", requireAuth, validateBody(updateProfileSchema), asyncHandler(usersController.updateMyProfile));
usersRouter.get("/me/stats", requireAuth, validateQuery(statsRangeSchema), asyncHandler(usersController.myStats));
usersRouter.get("/me/progress", requireAuth, validateQuery(statsRangeSchema), asyncHandler(usersController.myProgress));
usersRouter.get("/me/friends", requireAuth, asyncHandler(usersController.listFriends));

usersRouter.get("/:id", attachAuthIfPresent, asyncHandler(usersController.getUserProfile));
usersRouter.get("/:id/followers", asyncHandler(usersController.listFollowers));
usersRouter.get("/:id/following", asyncHandler(usersController.listFollowing));
usersRouter.post("/:id/follow", requireAuth, asyncHandler(usersController.followUser));
usersRouter.delete("/:id/follow", requireAuth, asyncHandler(usersController.unfollowUser));
usersRouter.get("/:id/activities", attachAuthIfPresent, asyncHandler(activitiesController.listUserActivities));
