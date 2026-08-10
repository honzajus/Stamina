import { describe, expect, it } from "vitest";
import { boundingBox, cellKey } from "./users.service";

describe("cellKey (Discover grid bucketing)", () => {
  it("buckets nearby points (within ~300m) into the same cell", () => {
    const a = cellKey(50.0755, 14.4378);
    // ~50m away — should land in the same ~300m cell.
    const b = cellKey(50.0759, 14.4378);
    expect(a).toBe(b);
  });

  it("buckets distant points into different cells", () => {
    const a = cellKey(50.0755, 14.4378);
    const b = cellKey(50.09, 14.46);
    expect(a).not.toBe(b);
  });

  it("is stable and deterministic for the same input", () => {
    expect(cellKey(48.8566, 2.3522)).toBe(cellKey(48.8566, 2.3522));
  });
});

describe("boundingBox (Discover search radius)", () => {
  it("centers the box on the given point", () => {
    const box = boundingBox(50.0, 14.0, 10);
    expect((box.minLat + box.maxLat) / 2).toBeCloseTo(50.0, 5);
    expect((box.minLng + box.maxLng) / 2).toBeCloseTo(14.0, 5);
  });

  it("widens the longitude span at higher latitudes to compensate for meridian convergence", () => {
    const nearEquator = boundingBox(5, 14, 10);
    const nearPole = boundingBox(70, 14, 10);
    const equatorLngSpan = nearEquator.maxLng - nearEquator.minLng;
    const polarLngSpan = nearPole.maxLng - nearPole.minLng;
    expect(polarLngSpan).toBeGreaterThan(equatorLngSpan);
  });

  it("grows with the requested radius", () => {
    const small = boundingBox(50, 14, 5);
    const large = boundingBox(50, 14, 20);
    expect(large.maxLat - large.minLat).toBeGreaterThan(small.maxLat - small.minLat);
  });
});
