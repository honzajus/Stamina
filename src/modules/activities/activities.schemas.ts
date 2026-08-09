import { z } from "zod";
import { SPORTS } from "../auth/auth.schemas";

export const startActivitySchema = z.object({
  sport: z.enum(SPORTS),
  title: z.string().min(1).max(120).optional(),
});

const gpsPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().optional(),
  speed: z.number().optional(),
  timestamp: z.string().datetime().optional(),
});

export const addPointsSchema = z.object({
  points: z.array(gpsPointSchema).min(1).max(500),
});

export const updateActivitySchema = z.object({
  title: z.string().min(1).max(120).optional(),
  visibility: z.enum(["EVERYONE", "FOLLOWERS", "ONLY_ME"]).optional(),
});

export const listActivitiesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
