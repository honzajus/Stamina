import { z } from "zod";
import { SPORTS } from "../auth/auth.schemas";

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().url().max(5_000_000).optional(),
  location: z.string().max(120).optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  sports: z.array(z.enum(SPORTS)).optional(),
  visibility: z.enum(["EVERYONE", "FOLLOWERS", "ONLY_ME"]).optional(),
});

export const statsRangeSchema = z.object({
  range: z.enum(["week", "month", "year"]).default("week"),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
