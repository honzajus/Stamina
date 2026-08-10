import { describe, expect, it } from "vitest";
import { computeStreaks } from "./streak";

describe("computeStreaks", () => {
  it("returns zeros for no activity", () => {
    expect(computeStreaks([], "2026-08-10")).toEqual({ currentStreakDays: 0, longestStreakDays: 0 });
  });

  it("counts a streak still active through today", () => {
    const dates = ["2026-08-08", "2026-08-09", "2026-08-10"];
    expect(computeStreaks(dates, "2026-08-10")).toEqual({ currentStreakDays: 3, longestStreakDays: 3 });
  });

  it("keeps yesterday's streak alive if today hasn't happened yet", () => {
    const dates = ["2026-08-08", "2026-08-09"];
    expect(computeStreaks(dates, "2026-08-10").currentStreakDays).toBe(2);
  });

  it("breaks the current streak once a full day is skipped", () => {
    const dates = ["2026-08-05", "2026-08-06", "2026-08-08"]; // gap on the 7th
    expect(computeStreaks(dates, "2026-08-10").currentStreakDays).toBe(0);
  });

  it("finds the longest streak even when it isn't the current one", () => {
    const dates = ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04", "2026-08-10"];
    expect(computeStreaks(dates, "2026-08-10")).toEqual({ currentStreakDays: 1, longestStreakDays: 4 });
  });

  it("ignores duplicate dates from multiple activities on the same day", () => {
    const dates = ["2026-08-10", "2026-08-10", "2026-08-09"];
    expect(computeStreaks(dates, "2026-08-10").currentStreakDays).toBe(2);
  });
});
