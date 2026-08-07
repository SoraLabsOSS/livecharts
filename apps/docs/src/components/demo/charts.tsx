"use client";

import { createWalker } from "livecharts/data";
import type {
  CandlePoint,
  LiveChartPoint,
  LiveChartSeries,
  OrderbookData,
} from "livecharts/react";
import { LiveChart } from "livecharts/react";
import { useEffect, useState } from "react";
import { makeOrderbook, useChartTheme, useWalker } from "./walk";

function ChartFrame({
  height,
  children,
  caption,
  className,
}: {
  height: number;
  children: React.ReactNode;
  caption?: string;
  className?: string;
}) {
  return (
    <div className={className ?? "not-prose my-8 flex flex-col gap-3"}>
      <div className="relative w-full min-w-0 shrink-0" style={{ height }}>
        {children}
      </div>
      {caption ? (
        <p className="m-0 shrink-0 text-center text-fd-muted-foreground text-xs leading-relaxed">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

export function HeroChart() {
  const chartTheme = useChartTheme();
  const { data, value } = useWalker({
    damping: 0.85,
    max: 999,
    min: 100,
    spikeMagnitude: 0.2,
    spikeProbability: 0.05,
    start: 142.5,
    volatility: 0.04,
  });

  return (
    <ChartFrame
      caption="Degen mode (chart shake and particles) with momentum arrows."
      height={300}
    >
      <LiveChart
        color="#f97316"
        data={data}
        degen
        exaggerate
        momentum
        padding={{ left: 0 }}
        theme={chartTheme}
        value={value}
      />
    </ChartFrame>
  );
}

export function BasicChart() {
  const chartTheme = useChartTheme();
  const { data, value } = useWalker({
    damping: 0.95,
    start: 50,
    volatility: 0.01,
  });

  return (
    <ChartFrame caption="Two props. That's it." height={200}>
      <LiveChart
        color="#3b82f6"
        data={data}
        padding={{ left: 0 }}
        theme={chartTheme}
        value={value}
      />
    </ChartFrame>
  );
}

export function HeartRateChart() {
  const chartTheme = useChartTheme();
  const { data, value } = useWalker({
    damping: 0.98,
    max: 100,
    min: 55,
    start: 72,
    volatility: 0.003,
  });

  return (
    <ChartFrame
      caption="Resting heart rate. Custom formatter, exaggerated Y-axis."
      height={200}
    >
      <LiveChart
        badgeVariant="minimal"
        color="#ef4444"
        data={data}
        exaggerate
        formatValue={(v) => `${v.toFixed(0)} bpm`}
        grid={false}
        lineWidth={2.5}
        momentum={false}
        padding={{ left: 0 }}
        theme={chartTheme}
        value={value}
      />
    </ChartFrame>
  );
}

export function MomentumChart() {
  const chartTheme = useChartTheme();
  const { data, value } = useWalker({
    damping: 0.94,
    spikeMagnitude: 0.08,
    spikeProbability: 0.008,
    start: 95,
    volatility: 0.014,
  });

  return (
    <ChartFrame
      caption="Arrows fade out fully before the new direction fades in."
      height={220}
    >
      <LiveChart
        color="#22c55e"
        data={data}
        exaggerate
        momentum
        padding={{ left: 0 }}
        theme={chartTheme}
        value={value}
      />
    </ChartFrame>
  );
}

export function ValueOverlayChart() {
  const chartTheme = useChartTheme();
  const { data, value } = useWalker({
    damping: 0.96,
    start: 2847.3,
    volatility: 0.005,
  });

  return (
    <ChartFrame
      caption="60fps value overlay with momentum colouring."
      height={240}
    >
      <LiveChart
        badge={false}
        color="#3b82f6"
        data={data}
        formatValue={(v) => `$${v.toFixed(2)}`}
        padding={{ left: 0 }}
        showValue
        theme={chartTheme}
        value={value}
        valueMomentumColor
      />
    </ChartFrame>
  );
}

export function CpuChart() {
  const chartTheme = useChartTheme();
  const { data, value } = useWalker({
    damping: 0.94,
    historyDuration: 300,
    historyPoints: 600,
    max: 100,
    min: 2,
    spikeMagnitude: 0.4,
    spikeProbability: 0.015,
    start: 38,
    volatility: 0.012,
  });

  return (
    <ChartFrame
      caption="CPU usage with occasional spikes. Rounded time windows."
      height={260}
    >
      <LiveChart
        color="#f59e0b"
        data={data}
        formatValue={(v) => `${v.toFixed(0)}%`}
        momentum={false}
        padding={{ left: 0 }}
        theme={chartTheme}
        value={value}
        windowStyle="rounded"
        windows={[
          { label: "1m", secs: 60 },
          { label: "5m", secs: 300 },
        ]}
      />
    </ChartFrame>
  );
}

export function BitcoinChart() {
  const chartTheme = useChartTheme();
  const { data, value } = useWalker({
    damping: 0.95,
    historyDuration: 600,
    historyPoints: 1200,
    spikeMagnitude: 0.06,
    spikeProbability: 0.008,
    start: 67_250,
    volatility: 0.003,
  });

  return (
    <ChartFrame
      caption='Polymarket-style prediction line. "Will Bitcoin stay above $67,500?"'
      height={260}
    >
      <LiveChart
        color="#8b5cf6"
        data={data}
        formatValue={(v) =>
          `$${v.toLocaleString("en-US", {
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
          })}`
        }
        padding={{ left: 0 }}
        referenceLine={{ label: "Above $67,500", value: 67_500 }}
        theme={chartTheme}
        value={value}
        windowStyle="rounded"
        windows={[
          { label: "1m", secs: 60 },
          { label: "5m", secs: 300 },
          { label: "10m", secs: 600 },
        ]}
      />
    </ChartFrame>
  );
}

export function OrderbookChart() {
  const chartTheme = useChartTheme();
  const [state, setState] = useState<{
    data: LiveChartPoint[];
    value: number;
    orderbook: OrderbookData;
  }>({
    data: [],
    orderbook: { asks: [], bids: [] },
    value: 67_250,
  });

  useEffect(() => {
    const walker = createWalker({
      damping: 0.94,
      spikeMagnitude: 0.08,
      spikeProbability: 0.012,
      start: 67_250,
      volatility: 0.004,
    });
    setState({
      data: walker.history,
      orderbook: makeOrderbook(walker.value),
      value: walker.value,
    });
    const id = setInterval(() => {
      const next = walker.tick();
      setState({
        data: next.history,
        orderbook: makeOrderbook(next.value),
        value: next.value,
      });
    }, 250);
    return () => clearInterval(id);
  }, []);

  return (
    <ChartFrame
      caption="Kalshi-style orderbook stream. Bid and ask sizes float upward behind the price line."
      height={260}
    >
      <LiveChart
        color="#8b5cf6"
        data={state.data}
        formatValue={(v) =>
          `$${v.toLocaleString("en-US", {
            maximumFractionDigits: 0,
            minimumFractionDigits: 0,
          })}`
        }
        momentum
        orderbook={state.orderbook}
        padding={{ left: 0 }}
        theme={chartTheme}
        value={state.value}
      />
    </ChartFrame>
  );
}

type CandleState = {
  points: LiveChartPoint[];
  candles: CandlePoint[];
  liveCandle?: CandlePoint;
  value: number;
};

function createCandleWalker(start: number, width: number) {
  let value = start;
  let velocity = 0;
  const points: LiveChartPoint[] = [];
  let candles: CandlePoint[] = [];
  const now = Date.now() / 1000;
  let t = now - 300;

  while (t < now) {
    velocity = 0.75 * velocity + (Math.random() - 0.5) * 0.02;
    const noise = (Math.random() - 0.5) * start * 0.01;
    if (Math.random() < 0.1) {
      velocity += (Math.random() - 0.5) * 0.05;
    }
    value += velocity * start + noise;
    points.push({ time: t, value });
    t += 0.5;
  }

  const rebuild = () => {
    candles = [];
    if (points.length === 0) {
      return;
    }
    let slot = Math.floor((points[0]?.time ?? 0) / width) * width;
    let open = points[0]?.value ?? start;
    let high = open;
    let low = open;
    let close = open;
    for (const point of points) {
      const nextSlot = Math.floor(point.time / width) * width;
      if (nextSlot !== slot) {
        candles.push({ close, high, low, open, time: slot });
        slot = nextSlot;
        open = point.value;
        high = open;
        low = open;
        close = open;
      }
      close = point.value;
      if (point.value > high) {
        high = point.value;
      }
      if (point.value < low) {
        low = point.value;
      }
    }
    candles.push({ close, high, low, open, time: slot });
  };

  rebuild();

  return {
    snapshot(): CandleState {
      const closed = candles.slice(0, -1);
      const live = candles.at(-1);
      return {
        candles: closed,
        liveCandle: live ? { ...live } : undefined,
        points: points.slice(),
        value,
      };
    },
    tick(): CandleState {
      const time = Date.now() / 1000;
      velocity = 0.75 * velocity + (Math.random() - 0.5) * 0.02;
      if (Math.random() < 0.1) {
        velocity += (Math.random() - 0.5) * 0.05;
      }
      value += velocity * start + (Math.random() - 0.5) * start * 0.01;
      points.push({ time, value });
      const cutoff = time - 450;
      while (points.length > 0 && (points[0]?.time ?? 0) < cutoff) {
        points.shift();
      }
      rebuild();
      return this.snapshot();
    },
  };
}

export function CandlestickChart() {
  const chartTheme = useChartTheme();
  const [mode, setMode] = useState<"line" | "candle">("candle");
  const [state, setState] = useState<CandleState>({
    candles: [],
    points: [],
    value: 185,
  });

  useEffect(() => {
    const walker = createCandleWalker(185, 5);
    setState(walker.snapshot());
    const id = setInterval(() => setState(walker.tick()), 100);
    return () => clearInterval(id);
  }, []);

  return (
    <ChartFrame
      caption="Same data, two views. The toggle morphs between line and candlestick."
      height={280}
    >
      <LiveChart
        candles={state.candles}
        candleWidth={6}
        color="#22c55e"
        data={state.points}
        formatValue={(v) => `$${v.toFixed(2).padStart(6, " ")}`}
        liveCandle={state.liveCandle}
        mode={mode}
        momentum={mode === "line"}
        onModeChange={setMode}
        padding={{ left: 0 }}
        theme={chartTheme}
        value={state.value}
        window={180}
      />
    </ChartFrame>
  );
}

export function MultiSeriesChart() {
  const chartTheme = useChartTheme();
  const defs = [
    { color: "#3b82f6", id: "yes", label: "Yes", start: 52 },
    { color: "#ef4444", id: "no", label: "No", start: 34 },
    { color: "#f59e0b", id: "maybe", label: "Maybe", start: 14 },
  ];
  const [series, setSeries] = useState<LiveChartSeries[]>(
    defs.map((d) => ({
      color: d.color,
      data: [],
      id: d.id,
      label: d.label,
      value: d.start,
    }))
  );

  useEffect(() => {
    const values = defs.map((d) => d.start);
    const velocities = defs.map(() => 0);
    const histories: LiveChartPoint[][] = defs.map(() => []);

    const normalize = () => {
      const sum = values.reduce((a, b) => a + b, 0);
      for (let i = 0; i < values.length; i++) {
        values[i] = ((values[i] ?? 0) / sum) * 100;
      }
    };

    const t = Date.now() / 1000 - 30;
    for (let n = 0; n < 300; n++) {
      const time = t + 0.1 * n;
      for (let i = 0; i < defs.length; i++) {
        velocities[i] =
          0.88 * (velocities[i] ?? 0) + (Math.random() - 0.5) * 0.025;
        values[i] =
          (values[i] ?? 0) + (velocities[i] ?? 0) * (defs[i]?.start ?? 1);
        values[i] = Math.max(2, values[i] ?? 0);
      }
      normalize();
      for (let i = 0; i < defs.length; i++) {
        histories[i]?.push({ time, value: values[i] ?? 0 });
      }
    }

    setSeries(
      defs.map((d, i) => ({
        color: d.color,
        data: histories[i]?.slice() ?? [],
        id: d.id,
        label: d.label,
        value: values[i] ?? d.start,
      }))
    );

    const id = setInterval(() => {
      const time = Date.now() / 1000;
      for (let i = 0; i < defs.length; i++) {
        velocities[i] =
          0.88 * (velocities[i] ?? 0) + (Math.random() - 0.5) * 0.025;
        values[i] =
          (values[i] ?? 0) + (velocities[i] ?? 0) * (defs[i]?.start ?? 1);
        values[i] = Math.max(2, values[i] ?? 0);
      }
      normalize();
      for (let i = 0; i < defs.length; i++) {
        histories[i]?.push({ time, value: values[i] ?? 0 });
      }
      const cutoff = time - 45;
      for (const hist of histories) {
        while (hist.length > 0 && (hist[0]?.time ?? 0) < cutoff) {
          hist.shift();
        }
      }
      setSeries(
        defs.map((d, i) => ({
          color: d.color,
          data: histories[i]?.slice() ?? [],
          id: d.id,
          label: d.label,
          value: values[i] ?? d.start,
        }))
      );
    }, 250);

    return () => clearInterval(id);
  }, []);

  return (
    <ChartFrame
      caption="Prediction market. Three outcomes, always summing to 100%. Click the chips to toggle lines."
      height={260}
    >
      <LiveChart
        color="#3b82f6"
        data={[]}
        formatValue={(v) => `${v.toFixed(0)}%`}
        padding={{ left: 0 }}
        series={series}
        theme={chartTheme}
        value={0}
      />
    </ChartFrame>
  );
}

export function LoadingChart() {
  const chartTheme = useChartTheme();
  const [loading, setLoading] = useState(true);
  const { data, value } = useWalker({
    damping: 0.96,
    start: 84,
    volatility: 0.008,
  });

  useEffect(() => {
    let cancelled = false;
    let timers: ReturnType<typeof setTimeout>[] = [];

    const clearAll = () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
      timers = [];
    };

    const cycle = () => {
      if (cancelled) {
        return;
      }
      setLoading(true);
      timers.push(
        setTimeout(() => {
          if (cancelled) {
            return;
          }
          setLoading(false);
          timers.push(setTimeout(cycle, 6000));
        }, 3000)
      );
    };

    timers.push(setTimeout(() => setLoading(false), 3000));
    timers.push(setTimeout(cycle, 9000));

    return () => {
      cancelled = true;
      clearAll();
    };
  }, []);

  return (
    <ChartFrame
      caption="Loading state, then data arrives. Loops every 9 seconds."
      height={200}
    >
      <LiveChart
        color="#3b82f6"
        data={loading ? [] : data}
        loading={loading}
        padding={{ left: 0 }}
        theme={chartTheme}
        value={loading ? 0 : value}
      />
    </ChartFrame>
  );
}

function PauseIcon({ paused }: { paused: boolean }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      style={{ display: "block", overflow: "visible" }}
      viewBox="0 0 14 14"
      width="14"
    >
      {paused ? (
        <path d="M5 3.5L10.5 7L5 10.5V3.5Z" fill="currentColor" />
      ) : (
        <>
          <line
            opacity="1"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
            x1="4.5"
            x2="4.5"
            y1="3.5"
            y2="10.5"
          />
          <line
            opacity="1"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
            x1="9.5"
            x2="9.5"
            y1="3.5"
            y2="10.5"
          />
        </>
      )}
    </svg>
  );
}

export function PausedChart() {
  const chartTheme = useChartTheme();
  const [paused, setPaused] = useState(false);
  const { data, value } = useWalker({
    damping: 0.95,
    spikeMagnitude: 0.06,
    spikeProbability: 0.01,
    start: 125,
    volatility: 0.012,
  });

  return (
    <div className="not-prose my-8">
      <div style={{ height: 220 }}>
        <LiveChart
          color="#22c55e"
          data={data}
          momentum
          padding={{ left: 0 }}
          paused={paused}
          theme={chartTheme}
          value={value}
        />
      </div>
      <button
        className="mx-auto mt-4 flex cursor-pointer items-center justify-center gap-1.5 border-0 bg-transparent p-0 font-inherit text-fd-muted-foreground text-xs"
        onClick={() => setPaused((p) => !p)}
        type="button"
      >
        Click to pause and resume the chart.
        <span style={{ opacity: 0.3 }}>|</span>
        <span style={{ display: "inline-flex" }}>
          <PauseIcon paused={paused} />
        </span>
      </button>
    </div>
  );
}

export function DarkChart() {
  const { data, value } = useWalker({
    damping: 0.95,
    start: 67,
    volatility: 0.012,
  });

  return (
    <ChartFrame
      caption="Dark theme. Same component, different colour."
      height={220}
    >
      <div
        style={{
          background: "#111",
          borderRadius: 8,
          height: "100%",
          overflow: "hidden",
          paddingBottom: 16,
        }}
      >
        <LiveChart
          color="#60a5fa"
          data={data}
          momentum
          padding={{ left: 0 }}
          theme="dark"
          value={value}
        />
      </div>
    </ChartFrame>
  );
}

export function StressTestCharts() {
  const chartTheme = useChartTheme();
  const a = useWalker(
    {
      damping: 0.85,
      spikeMagnitude: 0.2,
      spikeProbability: 0.03,
      start: 50,
      volatility: 0.04,
    },
    100
  );
  const b = useWalker(
    {
      damping: 0.995,
      max: 85,
      min: 60,
      start: 72,
      volatility: 0.002,
    },
    150
  );
  const c = useWalker(
    {
      damping: 0.8,
      spikeMagnitude: 0.3,
      spikeProbability: 0.05,
      start: 1000,
      volatility: 0.05,
    },
    80
  );

  return (
    <div className="not-prose my-8 flex flex-col gap-8">
      <ChartFrame
        caption="Wild swings, fast updates (100ms)"
        className="flex flex-col gap-3"
        height={200}
      >
        <LiveChart
          color="#e11d48"
          data={a.data}
          exaggerate
          momentum
          padding={{ left: 0 }}
          theme={chartTheme}
          value={a.value}
        />
      </ChartFrame>
      <ChartFrame
        caption="Near-flat, ultra-low volatility, exaggerate (150ms)"
        className="flex flex-col gap-3"
        height={200}
      >
        <LiveChart
          badgeVariant="minimal"
          color="#0ea5e9"
          data={b.data}
          exaggerate
          formatValue={(v) => `${v.toFixed(1)} bpm`}
          grid={false}
          padding={{ left: 0 }}
          theme={chartTheme}
          value={b.value}
        />
      </ChartFrame>
      <ChartFrame
        caption="Chaotic, huge spikes (80ms)"
        className="flex flex-col gap-3"
        height={200}
      >
        <LiveChart
          color="#7c3aed"
          data={c.data}
          degen
          exaggerate
          momentum
          padding={{ left: 0 }}
          theme={chartTheme}
          value={c.value}
        />
      </ChartFrame>
    </div>
  );
}

export function SpikyTestCharts() {
  const chartTheme = useChartTheme();
  const a = useWalker(
    {
      damping: 0.6,
      max: 500,
      min: 10,
      spikeMagnitude: 0.5,
      spikeProbability: 0.12,
      start: 100,
      volatility: 0.08,
    },
    60
  );
  const b = useWalker(
    {
      damping: 0.999,
      max: 200,
      min: 5,
      spikeMagnitude: 0.8,
      spikeProbability: 0.04,
      start: 50,
      volatility: 0.001,
    },
    120
  );
  const c = useWalker(
    {
      damping: 0.3,
      max: 600,
      min: 50,
      spikeMagnitude: 0.3,
      spikeProbability: 0.02,
      start: 200,
      volatility: 0.12,
    },
    50
  );

  return (
    <div className="not-prose my-8 flex flex-col gap-8">
      <ChartFrame
        caption="Frequent sharp reversals (60ms updates)"
        className="flex flex-col gap-3"
        height={200}
      >
        <LiveChart
          color="#dc2626"
          data={a.data}
          exaggerate
          fill
          momentum
          padding={{ left: 0 }}
          theme={chartTheme}
          value={a.value}
        />
      </ChartFrame>
      <ChartFrame
        caption="Near-flat with massive isolated spikes (120ms)"
        className="flex flex-col gap-3"
        height={200}
      >
        <LiveChart
          badgeVariant="minimal"
          color="#059669"
          data={b.data}
          exaggerate
          grid={false}
          padding={{ left: 0 }}
          theme={chartTheme}
          value={b.value}
        />
      </ChartFrame>
      <ChartFrame
        caption="Rapid zigzag oscillation (50ms)"
        className="flex flex-col gap-3"
        height={200}
      >
        <LiveChart
          color="#7c3aed"
          data={c.data}
          degen
          exaggerate
          momentum
          padding={{ left: 0 }}
          theme={chartTheme}
          value={c.value}
        />
      </ChartFrame>
    </div>
  );
}

export function GappyChart() {
  const chartTheme = useChartTheme();
  const [state, setState] = useState<{
    data: LiveChartPoint[];
    value: number;
  }>({ data: [], value: 80 });

  useEffect(() => {
    const start = 80;
    let value = start;
    let velocity = 0;
    const history: LiveChartPoint[] = [];
    const now = Date.now() / 1000;
    let t = now - 30;
    let burstLeft = 0;

    while (t < now) {
      const gap =
        Math.random() < 0.3
          ? 0.05 + 0.1 * Math.random()
          : 0.8 + 2.5 * Math.random();
      velocity = 0.7 * velocity + (Math.random() - 0.5) * 0.06;
      if (gap > 1.5) {
        value += (Math.random() - 0.5) * start * 0.15;
      } else {
        value += velocity * start;
      }
      value = Math.max(0.3 * start, Math.min(3 * start, value));
      t += gap;
      if (t < now) {
        history.push({ time: t, value });
      }
    }

    setState({ data: history.slice(), value });

    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const time = Date.now() / 1000;
      if (burstLeft > 0) {
        burstLeft -= 1;
        velocity = 0.7 * velocity + (Math.random() - 0.5) * 0.04;
        value += velocity * start;
      } else if (Math.random() < 0.15) {
        burstLeft = Math.floor(8 * Math.random()) + 3;
        value += (Math.random() - 0.5) * start * 0.2;
        velocity = (Math.random() - 0.5) * 0.08;
      } else {
        velocity *= 0.95;
        value += velocity * start * 0.1;
      }
      value = Math.max(0.3 * start, Math.min(3 * start, value));
      history.push({ time, value });
      const cutoff = time - 45;
      while (history.length > 0 && (history[0]?.time ?? 0) < cutoff) {
        history.shift();
      }
      setState({ data: history.slice(), value });
      timer = setTimeout(
        tick,
        Math.random() < 0.3
          ? 40 + 80 * Math.random()
          : 400 + 800 * Math.random()
      );
    };

    timer = setTimeout(tick, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ marginBottom: "3rem", marginTop: "2rem" }}>
      <div style={{ height: 220 }}>
        <LiveChart
          color="#0891b2"
          data={state.data}
          exaggerate
          fill
          momentum
          padding={{ left: 0 }}
          theme={chartTheme}
          value={state.value}
        />
      </div>
    </div>
  );
}

export function MinimalChart() {
  const chartTheme = useChartTheme();
  const { data, value } = useWalker({
    damping: 0.97,
    start: 25,
    volatility: 0.008,
  });

  return (
    <div style={{ marginBottom: "3rem", marginTop: "2rem" }}>
      <div style={{ height: 180 }}>
        <LiveChart
          badge={false}
          color="#999"
          data={data}
          fill={false}
          grid={false}
          lineWidth={1.5}
          momentum={false}
          padding={{ left: 0 }}
          pulse={false}
          theme={chartTheme}
          value={value}
        />
      </div>
    </div>
  );
}

const CHROME_WINDOWS = [
  { label: "1m", secs: 60 },
  { label: "5m", secs: 300 },
  { label: "10m", secs: 600 },
] as const;

const CHROME_WALKER = {
  damping: 0.95,
  historyDuration: 600,
  historyPoints: 1200,
  max: 220,
  min: 80,
  start: 128,
  trimAfter: 900,
  volatility: 0.012,
} as const;

/** Default built-in window pills — for side-by-side comparison with slots. */
export function ChromeSlotsDefaultChart() {
  const chartTheme = useChartTheme();
  const { data, value } = useWalker(CHROME_WALKER);

  return (
    <ChartFrame
      caption="Built-in chrome (Liveline-style window pills)."
      height={240}
    >
      <LiveChart
        color="#3b82f6"
        data={data}
        padding={{ left: 0 }}
        theme={chartTheme}
        value={value}
        windowStyle="rounded"
        windows={[...CHROME_WINDOWS]}
      />
    </ChartFrame>
  );
}

/** Custom underline tabs via renderWindows — clearly not the default pills. */
export function ChromeSlotsCustomWindowsChart() {
  const chartTheme = useChartTheme();
  const isDark = chartTheme === "dark";
  const { data, value } = useWalker(CHROME_WALKER);

  return (
    <ChartFrame
      caption="Same chart, custom chrome — underline tabs instead of pills."
      height={240}
    >
      <LiveChart
        color="#0d9488"
        data={data}
        padding={{ left: 0 }}
        renderWindows={({ windows, activeSecs, setWindow }) => (
          <div
            style={{
              borderBottom: isDark
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(0,0,0,0.1)",
              display: "flex",
              gap: 0,
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            {windows.map((w) => {
              const active = w.secs === activeSecs;
              return (
                <button
                  aria-pressed={active}
                  key={w.secs}
                  onClick={() => setWindow(w.secs)}
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: active
                      ? "2px solid #0d9488"
                      : "2px solid transparent",
                    color: active
                      ? isDark
                        ? "#5eead4"
                        : "#0f766e"
                      : isDark
                        ? "rgba(255,255,255,0.4)"
                        : "rgba(0,0,0,0.4)",
                    cursor: "pointer",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    letterSpacing: "0.04em",
                    marginBottom: -1,
                    padding: "6px 14px",
                    textTransform: "uppercase",
                  }}
                  type="button"
                >
                  {w.label}
                </button>
              );
            })}
          </div>
        )}
        theme={chartTheme}
        value={value}
        windows={[...CHROME_WINDOWS]}
      />
    </ChartFrame>
  );
}

/** Custom mode toggle — text segments instead of icon pills. */
export function ChromeSlotsCustomModeChart() {
  const chartTheme = useChartTheme();
  const isDark = chartTheme === "dark";
  const [mode, setMode] = useState<"line" | "candle">("candle");
  const [state, setState] = useState<CandleState>({
    candles: [],
    points: [],
    value: 185,
  });

  useEffect(() => {
    const walker = createCandleWalker(185, 5);
    setState(walker.snapshot());
    const id = setInterval(() => setState(walker.tick()), 100);
    return () => clearInterval(id);
  }, []);

  return (
    <ChartFrame
      caption="Custom mode toggle — LINE / CANDLE text, not the default icons."
      height={260}
    >
      <LiveChart
        candles={state.candles}
        candleWidth={6}
        color="#22c55e"
        data={state.points}
        formatValue={(v) => `$${v.toFixed(2)}`}
        liveCandle={state.liveCandle}
        mode={mode}
        momentum={mode === "line"}
        onModeChange={setMode}
        padding={{ left: 0 }}
        renderModeToggle={({ mode: current, setMode: set }) => (
          <div style={{ display: "flex", gap: 6 }}>
            {(["line", "candle"] as const).map((m) => {
              const active = current === m;
              return (
                <button
                  aria-pressed={active}
                  key={m}
                  onClick={() => set(m)}
                  style={{
                    background: active
                      ? isDark
                        ? "rgba(34,197,94,0.2)"
                        : "rgba(22,163,74,0.12)"
                      : "transparent",
                    border: active
                      ? "1px solid #22c55e"
                      : isDark
                        ? "1px solid rgba(255,255,255,0.15)"
                        : "1px solid rgba(0,0,0,0.15)",
                    borderRadius: 4,
                    color: active
                      ? isDark
                        ? "#86efac"
                        : "#15803d"
                      : isDark
                        ? "rgba(255,255,255,0.45)"
                        : "rgba(0,0,0,0.45)",
                    cursor: "pointer",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    padding: "5px 10px",
                    textTransform: "uppercase",
                  }}
                  type="button"
                >
                  {m}
                </button>
              );
            })}
          </div>
        )}
        theme={chartTheme}
        value={state.value}
        window={180}
      />
    </ChartFrame>
  );
}

/** Custom series chips — outline pills with colored dots. */
export function ChromeSlotsCustomSeriesChart() {
  const chartTheme = useChartTheme();
  const isDark = chartTheme === "dark";
  const defs = [
    { color: "#3b82f6", id: "yes", label: "Yes", start: 52 },
    { color: "#ef4444", id: "no", label: "No", start: 34 },
    { color: "#f59e0b", id: "maybe", label: "Maybe", start: 14 },
  ];
  const [series, setSeries] = useState<LiveChartSeries[]>(
    defs.map((d) => ({
      color: d.color,
      data: [],
      id: d.id,
      label: d.label,
      value: d.start,
    }))
  );

  useEffect(() => {
    const values = defs.map((d) => d.start);
    const velocities = defs.map(() => 0);
    const histories: LiveChartPoint[][] = defs.map(() => []);

    const normalize = () => {
      const sum = values.reduce((a, b) => a + b, 0);
      for (let i = 0; i < values.length; i++) {
        values[i] = ((values[i] ?? 0) / sum) * 100;
      }
    };

    const seed = Date.now() / 1000 - 30;
    for (let n = 0; n < 300; n++) {
      const time = seed + 0.1 * n;
      for (let i = 0; i < defs.length; i++) {
        velocities[i] =
          0.9 * (velocities[i] ?? 0) + (Math.random() - 0.5) * 0.8;
        values[i] = Math.max(5, (values[i] ?? 0) + (velocities[i] ?? 0));
      }
      normalize();
      for (let i = 0; i < defs.length; i++) {
        histories[i]?.push({ time, value: values[i] ?? 0 });
      }
    }

    const tick = () => {
      const time = Date.now() / 1000;
      for (let i = 0; i < defs.length; i++) {
        velocities[i] =
          0.9 * (velocities[i] ?? 0) + (Math.random() - 0.5) * 0.8;
        values[i] = Math.max(5, (values[i] ?? 0) + (velocities[i] ?? 0));
      }
      normalize();
      for (let i = 0; i < defs.length; i++) {
        const hist = histories[i];
        if (!hist) {
          continue;
        }
        hist.push({ time, value: values[i] ?? 0 });
        if (hist.length > 400) {
          hist.shift();
        }
      }
      setSeries(
        defs.map((d, i) => ({
          color: d.color,
          data: [...(histories[i] ?? [])],
          id: d.id,
          label: d.label,
          value: values[i] ?? d.start,
        }))
      );
    };

    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, []);

  return (
    <ChartFrame
      caption="Custom series toggle — outline pills you can style with any design system."
      height={240}
    >
      <LiveChart
        data={[]}
        padding={{ left: 0 }}
        renderSeriesToggle={({ series: items, toggle }) => (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {items.map((s) => (
              <button
                aria-pressed={s.visible}
                key={s.id}
                onClick={() => toggle(s.id)}
                style={{
                  alignItems: "center",
                  background: s.visible
                    ? isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)"
                    : "transparent",
                  border: `1.5px solid ${s.visible ? s.color : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
                  borderRadius: 999,
                  color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)",
                  cursor: "pointer",
                  display: "inline-flex",
                  fontSize: 12,
                  fontWeight: 500,
                  gap: 6,
                  opacity: s.visible ? 1 : 0.45,
                  padding: "4px 12px 4px 8px",
                }}
                type="button"
              >
                <span
                  style={{
                    background: s.color,
                    borderRadius: "50%",
                    height: 8,
                    width: 8,
                  }}
                />
                {s.label}
              </button>
            ))}
          </div>
        )}
        series={series}
        theme={chartTheme}
        value={0}
        window={30}
      />
    </ChartFrame>
  );
}
