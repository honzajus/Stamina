import { z } from "zod";
import { SPORTS } from "../auth/auth.schemas";

export const GENDERS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"] as const;

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().url().max(5_000_000).optional(),
  location: z.string().max(120).optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  sports: z.array(z.enum(SPORTS)).optional(),
  visibility: z.enum(["EVERYONE", "FOLLOWERS", "ONLY_ME"]).optional(),
  heightCm: z.number().min(50).max(272).optional(),
  weightKg: z.number().min(20).max(400).optional(),
  birthYear: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
  gender: z.enum(GENDERS).optional(),
  weeklyGoalMeters: z.number().min(0).max(1_000_000).optional(),
});

export const statsRangeSchema = z.object({
  range: z.enum(["week", "month", "year"]).default("week"),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
