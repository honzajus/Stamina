import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateQuery } from "../../middleware/validate";
import { asyncHandler } from "../../lib/asyncHandler";
import { feedQuerySchema } from "./feed.schemas";
import { getFeed } from "./feed.controller";

export const feedRouter = Router();

feedRouter.get("/", requireAuth, validateQuery(feedQuerySchema), asyncHandler(getFeed));
