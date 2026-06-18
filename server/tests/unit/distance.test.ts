import { describe, expect, it } from "vitest";
import { haversineDistanceKm, roundKm } from "@/utils/distance";

describe("haversineDistanceKm", () => {
  it("returns 0 for identical points", () => {
    expect(haversineDistanceKm(13.0827, 80.2707, 13.0827, 80.2707)).toBe(0);
  });

  it("matches the known great-circle distance between Chennai and Delhi within 1%", () => {
    // Chennai (13.0827, 80.2707) -> Delhi (28.7041, 77.1025), real-world ~1760km
    const km = haversineDistanceKm(13.0827, 80.2707, 28.7041, 77.1025);
    expect(km).toBeGreaterThan(1740);
    expect(km).toBeLessThan(1780);
  });

  it("is symmetric regardless of point order", () => {
    const a = haversineDistanceKm(13.0827, 80.2707, 13.0067, 80.2572);
    const b = haversineDistanceKm(13.0067, 80.2572, 13.0827, 80.2707);
    expect(a).toBeCloseTo(b, 10);
  });

  it("scales for two nearby points roughly matching a manual estimate", () => {
    // 1 degree of latitude is ~111km; 0.01 deg ~ 1.11km
    const km = haversineDistanceKm(13.0, 80.0, 13.01, 80.0);
    expect(km).toBeGreaterThan(1.0);
    expect(km).toBeLessThan(1.3);
  });
});

describe("roundKm", () => {
  it("rounds to one decimal place", () => {
    expect(roundKm(3.249)).toBe(3.2);
    expect(roundKm(3.25)).toBe(3.3);
    expect(roundKm(0)).toBe(0);
  });
});
