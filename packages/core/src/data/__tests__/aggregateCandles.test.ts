import { describe, expect, it } from "vitest";
import { aggregateCandles } from "../aggregateCandles";

describe("aggregateCandles", () => {
  it("returns empty when no ticks or invalid width", () => {
    expect(aggregateCandles([], 5)).toEqual({ candles: [], live: null });
    expect(
      aggregateCandles(
        [
          { time: 0, value: 1 },
          { time: 1, value: 2 },
        ],
        0,
      ),
    ).toEqual({ candles: [], live: null });
  });

  it("buckets OHLC and keeps the open bucket as live", () => {
    const ticks = [
      { time: 0, value: 10 },
      { time: 1, value: 12 },
      { time: 2, value: 9 },
      { time: 5, value: 11 },
      { time: 6, value: 14 },
      { time: 7, value: 13 },
    ];

    const { candles, live } = aggregateCandles(ticks, 5);

    expect(candles).toEqual([
      { time: 0, open: 10, high: 12, low: 9, close: 9 },
    ]);
    expect(live).toEqual({
      time: 5,
      open: 11,
      high: 14,
      low: 11,
      close: 13,
    });
  });

  it("keeps a single bucket as live with no closed candles", () => {
    const { candles, live } = aggregateCandles(
      [
        { time: 10, value: 100 },
        { time: 11, value: 105 },
        { time: 12, value: 98 },
      ],
      60,
    );

    expect(candles).toEqual([]);
    expect(live).toEqual({
      time: 0,
      open: 100,
      high: 105,
      low: 98,
      close: 98,
    });
  });
});
