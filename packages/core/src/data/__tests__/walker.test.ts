import { describe, expect, it, vi, afterEach } from "vitest";
import { createWalker } from "../walker";

describe("createWalker", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("seeds history to the configured length", () => {
    const walker = createWalker({
      start: 100,
      historyPoints: 50,
      historyDuration: 10,
      min: 0,
      max: 200,
    });
    expect(walker.history).toHaveLength(50);
    expect(walker.value).toBeTypeOf("number");
  });

  it("clamps seeded and tick values to min/max", () => {
    const walker = createWalker({
      start: 50,
      min: 49,
      max: 51,
      historyPoints: 20,
      historyDuration: 5,
      volatility: 5,
      spikeProbability: 1,
      spikeMagnitude: 10,
    });
    for (const point of walker.history) {
      expect(point.value).toBeGreaterThanOrEqual(49);
      expect(point.value).toBeLessThanOrEqual(51);
    }

    for (let i = 0; i < 30; i += 1) {
      const next = walker.tick();
      expect(next.value).toBeGreaterThanOrEqual(49);
      expect(next.value).toBeLessThanOrEqual(51);
    }
  });

  it("tick advances time and value", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    const walker = createWalker({
      start: 100,
      historyPoints: 10,
      historyDuration: 5,
      min: 0,
      max: 1000,
    });
    const before = walker.history.at(-1)!;
    expect(walker.value).toBe(before.value);

    vi.setSystemTime(new Date("2024-01-01T00:00:01Z"));
    const next = walker.tick();

    expect(next.history.length).toBeGreaterThanOrEqual(walker.history.length);
    const last = next.history.at(-1)!;
    expect(last.time).toBeGreaterThan(before.time);
    expect(next.value).toBe(last.value);
  });
});
