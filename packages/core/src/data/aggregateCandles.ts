import type { CandlePoint, LiveChartPoint } from "../types";

export interface AggregateCandlesResult {
  candles: CandlePoint[];
  live: CandlePoint | null;
}

/** Aggregate tick data into OHLC candles by time bucket width (seconds). */
export function aggregateCandles(
  ticks: LiveChartPoint[],
  widthSecs: number
): AggregateCandlesResult {
  if (ticks.length === 0 || widthSecs <= 0) {
    return { candles: [], live: null };
  }

  const first = ticks[0]!;
  const candles: CandlePoint[] = [];
  let slot = Math.floor(first.time / widthSecs) * widthSecs;
  let open = first.value;
  let high = open;
  let low = open;
  let close = open;

  for (let i = 1; i < ticks.length; i += 1) {
    const tick = ticks[i]!;
    if (tick.time >= slot + widthSecs) {
      candles.push({ time: slot, open, high, low, close });
      slot = Math.floor(tick.time / widthSecs) * widthSecs;
      open = tick.value;
      high = open;
      low = open;
      close = open;
    } else {
      close = tick.value;
      if (close > high) high = close;
      if (close < low) low = close;
    }
  }

  return {
    candles,
    live: { time: slot, open, high, low, close },
  };
}
