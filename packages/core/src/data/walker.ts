import type { LiveChartPoint } from "../types";

export interface WalkerConfig {
  start: number;
  damping?: number;
  volatility?: number;
  spikeProbability?: number;
  spikeMagnitude?: number;
  min?: number;
  max?: number;
  historyDuration?: number;
  historyPoints?: number;
  trimAfter?: number;
}

export interface Walker {
  history: LiveChartPoint[];
  value: number;
  tick: () => { history: LiveChartPoint[]; value: number };
}

/** Random-walk data generator used by demos and live feeds. */
export function createWalker(config: WalkerConfig): Walker {
  const {
    start,
    damping = 0.96,
    volatility = 0.02,
    spikeProbability = 0.005,
    spikeMagnitude = 0.1,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
    historyDuration = 30,
    historyPoints = 300,
    trimAfter = 1.5 * historyDuration,
  } = config;

  let value = start;
  let velocity = 0;
  const history: LiveChartPoint[] = [];
  const startTime = Date.now() / 1000 - historyDuration;
  const step = historyDuration / historyPoints;

  for (let i = 0; i < historyPoints; i += 1) {
    const time = startTime + i * step;
    const spike =
      Math.random() < spikeProbability
        ? (Math.random() - 0.5) * spikeMagnitude * start
        : 0;
    velocity = velocity * damping + (Math.random() - 0.5) * volatility;
    value += velocity * start + spike;
    value = Math.max(min, Math.min(max, value));
    history.push({ time, value });
  }

  return {
    history: history.slice(),
    value,
    tick() {
      const time = Date.now() / 1000;
      const spike =
        Math.random() < spikeProbability
          ? (Math.random() - 0.5) * spikeMagnitude * start
          : 0;
      velocity = velocity * damping + (Math.random() - 0.5) * volatility;
      value += velocity * start + spike;
      value = Math.max(min, Math.min(max, value));
      history.push({ time, value });
      const cutoff = time - trimAfter;
      while (history.length > 0) {
        const first = history[0];
        if (!first || first.time >= cutoff) break;
        history.shift();
      }
      return { history: history.slice(), value };
    },
  };
}
