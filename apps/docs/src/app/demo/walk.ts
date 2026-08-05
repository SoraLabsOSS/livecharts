"use client";

import { createWalker, type WalkerConfig } from "livecharts";
import type { LiveChartPoint } from "livecharts/react";
import { useEffect, useRef, useState } from "react";

export function useWalker(
  config: WalkerConfig,
  intervalMs = 250
): { data: LiveChartPoint[]; value: number } {
  const configRef = useRef(config);
  const [state, setState] = useState<{
    data: LiveChartPoint[];
    value: number;
  }>({ data: [], value: config.start });

  useEffect(() => {
    const walker = createWalker(configRef.current);
    setState({ data: walker.history, value: walker.value });
    const id = setInterval(() => {
      const next = walker.tick();
      setState({ data: next.history, value: next.value });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return state;
}

export function makeOrderbook(mid: number): {
  bids: [number, number][];
  asks: [number, number][];
} {
  const bids: [number, number][] = [];
  const asks: [number, number][] = [];
  for (let i = 0; i < 8; i += 1) {
    const offset = (i + 1) * 5;
    const bidSize =
      12 * Math.random() +
      0.5 +
      (Math.random() < 0.08 ? 40 * Math.random() + 20 : 0);
    const askSize =
      12 * Math.random() +
      0.5 +
      (Math.random() < 0.08 ? 40 * Math.random() + 20 : 0);
    bids.push([mid - offset, bidSize]);
    asks.push([mid + offset, askSize]);
  }
  return { asks, bids };
}
