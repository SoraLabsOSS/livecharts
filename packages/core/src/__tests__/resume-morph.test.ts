/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { LiveChartEngine } from "../engine/LiveChartEngine";
import { PAUSE_RESUME_QUIET_MAX_DEBT } from "../engine/helpers";
import { resolveTheme } from "../theme";
import type { EngineConfig } from "../engine/config";

function baseConfig(overrides: Partial<EngineConfig> = {}): EngineConfig {
  return {
    data: [
      { time: 1, value: 10 },
      { time: 2, value: 11 },
    ],
    value: 11,
    palette: resolveTheme("#3b82f6", "dark"),
    windowSecs: 30,
    lerpSpeed: 0.08,
    showGrid: true,
    showBadge: false,
    showMomentum: false,
    showFill: true,
    formatValue: (v) => String(v),
    formatTime: (t) => String(t),
    padding: { top: 12, right: 12, bottom: 28, left: 12 },
    showPulse: false,
    scrub: false,
    exaggerate: false,
    badgeTail: false,
    badgeVariant: "default",
    tooltipY: 14,
    tooltipOutline: false,
    valueMomentumColor: false,
    mode: "line",
    ...overrides,
  };
}

type ResumePriv = {
  timeDebt: number;
  chartReveal: number;
  resumeFade: number;
  wasPaused: boolean;
  displayValue: number;
  displayWindow: number;
  applyPauseResumeEdge: (paused: boolean) => void;
  beginResumeMorph: () => void;
  beginResumeFade: () => void;
};

describe("pause resume fade / morph", () => {
  function engineWith(cfg: EngineConfig = baseConfig()) {
    const canvas = document.createElement("canvas");
    const container = document.createElement("div");
    const engine = new LiveChartEngine({ canvas, container });
    engine.setConfig(cfg);
    return engine as unknown as LiveChartEngine & ResumePriv;
  }

  it("exports a quiet threshold below a typical window", () => {
    expect(PAUSE_RESUME_QUIET_MAX_DEBT).toBeLessThan(1);
  });

  it("fades within the window without collapsing chartReveal", () => {
    const engine = engineWith(baseConfig({ value: 42, windowSecs: 30 }));
    engine.chartReveal = 1;
    engine.resumeFade = 1;
    engine.displayWindow = 30;
    engine.wasPaused = true;
    engine.timeDebt = 5; // inside 30s window

    engine.applyPauseResumeEdge(false);

    expect(engine.timeDebt).toBe(0);
    expect(engine.chartReveal).toBe(1);
    expect(engine.resumeFade).toBe(0);
    expect(engine.displayValue).toBe(42);
  });

  it("morphs loading→chart when pause debt exceeds the window", () => {
    const engine = engineWith(baseConfig({ value: 42, windowSecs: 30 }));
    engine.chartReveal = 1;
    engine.resumeFade = 1;
    engine.displayWindow = 30;
    engine.wasPaused = true;
    engine.timeDebt = 31;

    engine.applyPauseResumeEdge(false);

    expect(engine.timeDebt).toBe(0);
    expect(engine.chartReveal).toBe(0);
    expect(engine.resumeFade).toBe(1);
    expect(engine.displayValue).toBe(42);
  });

  it("skips fade/morph flash for a tiny pause debt", () => {
    const engine = engineWith();
    engine.chartReveal = 1;
    engine.resumeFade = 1;
    engine.wasPaused = true;
    engine.timeDebt = 0.05;

    engine.applyPauseResumeEdge(false);

    expect(engine.timeDebt).toBe(0);
    expect(engine.chartReveal).toBe(1);
    expect(engine.resumeFade).toBe(1);
  });
});
