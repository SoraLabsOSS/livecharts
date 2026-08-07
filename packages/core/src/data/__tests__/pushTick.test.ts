import { afterEach, describe, expect, it, vi } from "vitest";
import { pushTick } from "../pushTick";

describe("pushTick", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("appends a point and returns the new value", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:10Z"));

    const prev = [
      { time: 1, value: 10 },
      { time: 5, value: 11 },
    ];
    const next = pushTick(prev, 12);

    expect(next.value).toBe(12);
    expect(next.data.at(-1)).toEqual({ time: 1_704_067_210, value: 12 });
    expect(prev).toHaveLength(2);
  });

  it("trims points older than keepSecs", () => {
    const next = pushTick(
      [
        { time: 100, value: 1 },
        { time: 150, value: 2 },
        { time: 200, value: 3 },
      ],
      4,
      { keepSecs: 60, time: 210 }
    );

    expect(next.data).toEqual([
      { time: 150, value: 2 },
      { time: 200, value: 3 },
      { time: 210, value: 4 },
    ]);
  });

  it("defaults keepSecs to 120", () => {
    const next = pushTick(
      [
        { time: 0, value: 1 },
        { time: 50, value: 2 },
        { time: 100, value: 3 },
      ],
      4,
      { time: 150 }
    );

    expect(next.data.map((p) => p.time)).toEqual([50, 100, 150]);
  });
});
