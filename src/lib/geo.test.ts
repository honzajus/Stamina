import { describe, expect, it } from "vitest";
import {
  computeActivityStats,
  estimateStepCount,
  estimateStepLengthMeters,
  filterGpsNoise,
  haversineDistanceMeters,
} from "./geo";

describe("haversineDistanceMeters", () => {
  it("returns 0 for identical points", () => {
    const p = { latitude: 50.0755, longitude: 14.4378 };
    expect(haversineDistanceMeters(p, p)).toBe(0);
  });

  it("matches a known real-world distance (Prague Old Town to Prague Castle, ~2.1km)", () => {
    const oldTown = { latitude: 50.0875, longitude: 14.4213 };
    const castle = { latitude: 50.0909, longitude: 14.4016 };
    const distance = haversineDistanceMeters(oldTown, castle);
    expect(distance).toBeGreaterThan(1400);
    expect(distance).toBeLessThan(1700);
  });
});

describe("filterGpsNoise", () => {
  it("keeps points within a realistic speed jump", () => {
    const points = [
      { latitude: 50.0, longitude: 14.4, timestamp: "2026-01-01T00:00:00.000Z" },
      { latitude: 50.0001, longitude: 14.4, timestamp: "2026-01-01T00:00:05.000Z" },
    ];
    expect(filterGpsNoise(points)).toHaveLength(2);
  });

  it("drops a point that implies an impossible speed jump", () => {
    const points = [
      { latitude: 50.0, longitude: 14.4, timestamp: "2026-01-01T00:00:00.000Z" },
      // ~1.1km away one second later — implies >1000 m/s, clearly a GPS glitch
      { latitude: 50.01, longitude: 14.4, timestamp: "2026-01-01T00:00:01.000Z" },
      { latitude: 50.0002, longitude: 14.4, timestamp: "2026-01-01T00:00:06.000Z" },
    ];
    const filtered = filterGpsNoise(points);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((p) => p.latitude)).toEqual([50.0, 50.0002]);
  });

  it("drops non-advancing timestamps instead of dividing by zero", () => {
    const points = [
      { latitude: 50.0, longitude: 14.4, timestamp: "2026-01-01T00:00:00.000Z" },
      { latitude: 50.0005, longitude: 14.4, timestamp: "2026-01-01T00:00:00.000Z" },
    ];
    expect(filterGpsNoise(points)).toHaveLength(1);
  });
});

describe("computeActivityStats", () => {
  it("returns zeroed stats for fewer than 2 points", () => {
    const stats = computeActivityStats([{ latitude: 50, longitude: 14, timestamp: "2026-01-01T00:00:00.000Z" }]);
    expect(stats).toEqual({
      distanceMeters: 0,
      durationSeconds: 0,
      paceSecondsPerKm: null,
      avgSpeedMs: null,
      elevationGainMeters: 0,
    });
  });

  it("computes distance, duration, pace, speed and elevation gain over a simple 1km/10min walk", () => {
    // Roughly 1km north over 10 minutes.
    const stats = computeActivityStats([
      { latitude: 50.0, longitude: 14.4, altitude: 200, timestamp: "2026-01-01T00:00:00.000Z" },
      { latitude: 50.009, longitude: 14.4, altitude: 210, timestamp: "2026-01-01T00:10:00.000Z" },
    ]);

    expect(stats.distanceMeters).toBeGreaterThan(950);
    expect(stats.distanceMeters).toBeLessThan(1050);
    expect(stats.durationSeconds).toBe(600);
    expect(stats.elevationGainMeters).toBe(10);
    expect(stats.avgSpeedMs).toBeCloseTo(stats.distanceMeters / 600, 5);
  });

  it("only counts positive altitude deltas toward elevation gain", () => {
    const stats = computeActivityStats([
      { latitude: 50.0, longitude: 14.4, altitude: 200, timestamp: "2026-01-01T00:00:00.000Z" },
      { latitude: 50.001, longitude: 14.4, altitude: 190, timestamp: "2026-01-01T00:05:00.000Z" },
      { latitude: 50.002, longitude: 14.4, altitude: 205, timestamp: "2026-01-01T00:10:00.000Z" },
    ]);
    expect(stats.elevationGainMeters).toBe(15);
  });
});

describe("estimateStepLengthMeters / estimateStepCount", () => {
  it("returns null for sports with no step concept", () => {
    expect(estimateStepLengthMeters(175, "CYCLING")).toBeNull();
    expect(estimateStepCount(5000, 175, "DRIVING")).toBeNull();
  });

  it("returns null when the user has no height on file", () => {
    expect(estimateStepCount(5000, null, "RUNNING")).toBeNull();
    expect(estimateStepCount(5000, undefined, "WALKING")).toBeNull();
  });

  it("estimates a plausible step count for a 5km run", () => {
    const steps = estimateStepCount(5000, 175, "RUNNING");
    expect(steps).not.toBeNull();
    // 175cm x 0.45 stride factor = 0.7875m stride -> ~6349 steps for 5km
    expect(steps).toBeGreaterThan(6000);
    expect(steps).toBeLessThan(6700);
  });

  it("uses a shorter stride for walking than running at the same height", () => {
    const walkLength = estimateStepLengthMeters(175, "WALKING")!;
    const runLength = estimateStepLengthMeters(175, "RUNNING")!;
    expect(walkLength).toBeLessThan(runLength);
  });
});
