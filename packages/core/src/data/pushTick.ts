import type { LiveChartPoint } from "../types";

export interface PushTickOptions {
  /** Keep points newer than `time - keepSecs`. Default 120. */
  keepSecs?: number;
  /** Unix seconds. Default `Date.now() / 1000`. */
  time?: number;
}

export interface PushTickResult {
  data: LiveChartPoint[];
  value: number;
}

/**
 * Append a live reading and trim history older than `keepSecs`.
 * Immutable — returns a new `data` array (does not mutate the input).
 */
export function pushTick(
  data: LiveChartPoint[],
  value: number,
  options?: PushTickOptions
): PushTickResult {
  const time = options?.time ?? Date.now() / 1000;
  const keepSecs = options?.keepSecs ?? 120;
  const cutoff = time - keepSecs;
  const next: LiveChartPoint[] = [];
  for (const point of data) {
    if (point.time >= cutoff) {
      next.push(point);
    }
  }
  next.push({ time, value });
  return { data: next, value };
}
