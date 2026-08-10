import { describe, expect, it } from "vitest";
import { accumulateStats, haversineDistanceMeters, type TrackedPoint } from "./geo";

describe("haversineDistanceMeters", () => {
  it("returns 0 for identical points", () => {
    const p = { latitude: 50.0755, longitude: 14.4378 };
    expect(haversineDistanceMeters(p, p)).toBe(0);
  });

  it("matches a known real-world distance (Prague Old Town to Prague Castle, ~1.5km)", () => {
    const oldTown = { latitude: 50.0875, longitude: 14.4213 };
    const castle = { latitude: 50.0909, longitude: 14.4016 };
    const distance = haversineDistanceMeters(oldTown, castle);
    expect(distance).toBeGreaterThan(1400);
    expect(distance).toBeLessThan(1700);
  });
});

describe("accumulateStats", () => {
  const base: TrackedPoint = { latitude: 50.0, longitude: 14.4, altitude: 200, timestamp: 0 };

  it("returns the unchanged total when there's no previous point (the first GPS fix of a run)", () => {
    const result = accumulateStats({ distanceMeters: 10, elevationGainMeters: 2 }, null, base);
    expect(result).toEqual({ distanceMeters: 10, elevationGainMeters: 2 });
  });

  it("adds the distance between two consecutive points to the running total", () => {
    const next: TrackedPoint = { latitude: 50.001, longitude: 14.4, altitude: 200, timestamp: 1000 };
    const result = accumulateStats({ distanceMeters: 100, elevationGainMeters: 0 }, base, next);
    expect(result.distanceMeters).toBeGreaterThan(100);
  });

  it("adds only positive altitude changes to elevation gain", () => {
    const climbed: TrackedPoint = { ...base, altitude: 210 };
    const descended: TrackedPoint = { ...base, altitude: 190 };

    const up = accumulateStats({ distanceMeters: 0, elevationGainMeters: 0 }, base, climbed);
    expect(up.elevationGainMeters).toBe(10);

    const down = accumulateStats({ distanceMeters: 0, elevationGainMeters: 0 }, base, descended);
    expect(down.elevationGainMeters).toBe(0);
  });

  it("skips elevation gain when altitude is missing on either point (GPS altitude is often unavailable)", () => {
    const noAltitude: TrackedPoint = { latitude: 50.001, longitude: 14.4, timestamp: 1000 };
    const result = accumulateStats({ distanceMeters: 0, elevationGainMeters: 0 }, base, noAltitude);
    expect(result.elevationGainMeters).toBe(0);
  });
});
