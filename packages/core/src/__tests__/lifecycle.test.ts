/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveChartEngine } from "../engine/LiveChartEngine";
import {
  updateRange,
  updateWindowTransition,
  type WindowTransState,
} from "../engine/helpers";
import { computeRange } from "../math/range";
import { resolveTheme } from "../theme";
import type { EngineConfig } from "../engine/config";

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

type IoCallback = (entries: IntersectionObserverEntry[]) => void;

function baseConfig(overrides: Partial<EngineConfig> = {}): EngineConfig {
  const now = Date.now() / 1000;
  return {
    data: [
      { time: now - 20, value: 10 },
      { time: now - 10, value: 11 },
      { time: now, value: 12 },
    ],
    value: 12,
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

function stubCanvasContext(canvas: HTMLCanvasElement) {
  const ctx = {
    canvas,
    createLinearGradient: () => ({
      addColorStop: () => undefined,
    }),
    measureText: () => ({ width: 0 }),
  };
  const proxied = new Proxy(ctx, {
    get(target, prop) {
      if (prop in target) {
        return Reflect.get(target, prop);
      }
      return () => undefined;
    },
  });
  canvas.getContext = (() => proxied) as typeof canvas.getContext;
}

describe("engine lifecycle", () => {
  let ioCallback: IoCallback | null = null;
  let rafCallbacks: FrameRequestCallback[] = [];
  let rafId = 0;

  beforeEach(() => {
    ioCallback = null;
    rafCallbacks = [];
    rafId = 0;

    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IoCallback) {
          ioCallback = cb;
        }
        observe() {}
        disconnect() {}
      }
    );
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafId += 1;
      rafCallbacks.push(cb);
      return rafId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      if (rafCallbacks.length > 0 && id === rafId) {
        rafCallbacks.pop();
      }
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function flushFrames(n: number) {
    for (let i = 0; i < n; i += 1) {
      const cbs = rafCallbacks.splice(0);
      for (const cb of cbs) {
        cb(performance.now());
      }
    }
  }

  function mount(config: EngineConfig = baseConfig()) {
    const canvas = document.createElement("canvas");
    stubCanvasContext(canvas);
    const container = document.createElement("div");
    container.appendChild(canvas);
    document.body.appendChild(container);

    const engine = new LiveChartEngine({ canvas, container });
    engine.setConfig(config);
    engine.start();
    return { engine, canvas, container };
  }

  type Priv = {
    raf: number;
    running: boolean;
    displayWindow: number;
    windowTransition: WindowTransState;
    displayValue: number;
    displayMin: number;
    displayMax: number;
    rangeInited: boolean;
    size: { w: number; h: number };
  };

  it("destroys without leaving a pending rAF; IO cannot restart the loop", () => {
    const { engine } = mount();
    expect(rafCallbacks.length).toBe(1);

    engine.destroy();
    expect((engine as unknown as Priv).raf).toBe(0);
    expect((engine as unknown as Priv).running).toBe(false);
    expect(rafCallbacks.length).toBe(0);

    expect(ioCallback).not.toBeNull();
    ioCallback!([{ isIntersecting: true } as IntersectionObserverEntry]);
    expect(rafCallbacks.length).toBe(0);
  });

  it("starts a window transition when windowSecs changes", () => {
    const { engine } = mount(baseConfig({ windowSecs: 30 }));
    const priv = engine as unknown as Priv;
    priv.size = { w: 400, h: 200 };

    flushFrames(2);
    expect(priv.windowTransition.to).toBe(30);

    engine.setConfig(baseConfig({ windowSecs: 300 }));
    flushFrames(1);

    expect(priv.windowTransition.to).toBe(300);
    expect(priv.windowTransition.startMs).toBeGreaterThan(0);
  });

  it("expands target range when live value jumps far outside", () => {
    let nowMs = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => nowMs);

    const now = Date.now() / 1000;
    const { engine } = mount(
      baseConfig({
        data: [
          { time: now - 20, value: 10 },
          { time: now - 10, value: 11 },
          { time: now, value: 12 },
        ],
        value: 12,
      })
    );
    const priv = engine as unknown as Priv;
    priv.size = { w: 400, h: 200 };

    for (let i = 0; i < 6; i += 1) {
      nowMs += 16;
      flushFrames(1);
    }
    expect(priv.rangeInited).toBe(true);
    const maxBefore = priv.displayMax;

    engine.setConfig(
      baseConfig({
        data: [
          { time: now - 20, value: 10 },
          { time: now - 10, value: 11 },
          { time: now, value: 200 },
        ],
        value: 200,
      })
    );

    for (let i = 0; i < 40; i += 1) {
      nowMs += 16;
      flushFrames(1);
    }
    expect(priv.displayValue).toBeGreaterThan(50);
    expect(priv.displayMax).toBeGreaterThan(maxBefore);

    vi.restoreAllMocks();
  });
});

describe("window / range helpers", () => {
  it("updateWindowTransition retargets when windowSecs changes", () => {
    const cfg = baseConfig({ windowSecs: 300 });
    const wt: WindowTransState = {
      from: 30,
      to: 30,
      startMs: 0,
      rangeFromMin: 10,
      rangeFromMax: 12,
      rangeToMin: 10,
      rangeToMax: 12,
    };
    const now = Date.now() / 1000;
    const result = updateWindowTransition(
      cfg,
      wt,
      30,
      10,
      12,
      false,
      1000,
      now,
      cfg.data,
      12,
      0.05
    );

    expect(wt.to).toBe(300);
    expect(wt.startMs).toBe(1000);
    expect(result.windowSecs).toBeGreaterThanOrEqual(30);
  });

  it("computeRange includes a live value outside visible points", () => {
    const range = computeRange(
      [
        { time: 1, value: 10 },
        { time: 2, value: 12 },
      ],
      200
    );
    expect(range.max).toBeGreaterThan(12);
    expect(range.max).toBeGreaterThan(180);
  });

  it("updateRange initializes then tracks a higher computed max", () => {
    const first = updateRange(
      { min: 10, max: 12 },
      false,
      0,
      0,
      0,
      0,
      false,
      0,
      {
        from: 30,
        to: 30,
        startMs: 0,
        rangeFromMin: 0,
        rangeFromMax: 0,
        rangeToMin: 0,
        rangeToMax: 0,
      },
      0.2,
      200,
      16
    );
    expect(first.rangeInited).toBe(true);
    expect(first.displayMax).toBe(12);

    const next = updateRange(
      { min: 10, max: 220 },
      true,
      first.targetMin,
      first.targetMax,
      first.displayMin,
      first.displayMax,
      false,
      0,
      {
        from: 30,
        to: 30,
        startMs: 0,
        rangeFromMin: 0,
        rangeFromMax: 0,
        rangeToMin: 0,
        rangeToMax: 0,
      },
      0.5,
      200,
      16
    );
    expect(next.targetMax).toBe(220);
    expect(next.displayMax).toBeGreaterThan(first.displayMax);
  });
});
