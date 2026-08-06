/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveChartEngine } from "../engine/LiveChartEngine";
import { resolveTheme } from "../theme";
import type { EngineConfig } from "../engine/config";

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

type IoCallback = (entries: IntersectionObserverEntry[]) => void;

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

describe("offscreen pause", () => {
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
      },
    );
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafId += 1;
      rafCallbacks.push(cb);
      return rafId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      // Drop the cancelled callback so pending frames match real browsers.
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

  function setIntersecting(isIntersecting: boolean) {
    expect(ioCallback).not.toBeNull();
    ioCallback!([
      { isIntersecting } as IntersectionObserverEntry,
    ]);
  }

  function mount(config: EngineConfig) {
    const canvas = document.createElement("canvas");
    const container = document.createElement("div");
    container.appendChild(canvas);
    document.body.appendChild(container);

    const engine = new LiveChartEngine({ canvas, container });
    engine.setConfig(config);
    engine.start();
    return { engine, container };
  }

  it("stops scheduling frames when leaving the viewport", () => {
    const { engine } = mount(baseConfig());
    expect(rafCallbacks.length).toBe(1);

    flushFrames(2);
    expect(rafCallbacks.length).toBe(1);

    setIntersecting(false);
    // Pending frame is cancelled immediately — no need to flush a suspend frame.
    expect(rafCallbacks.length).toBe(0);

    flushFrames(2);
    expect(rafCallbacks.length).toBe(0);

    engine.destroy();
  });

  it("resumes the loop when re-entering the viewport", () => {
    const { engine } = mount(baseConfig());
    setIntersecting(false);
    expect(rafCallbacks.length).toBe(0);

    setIntersecting(true);
    expect(rafCallbacks.length).toBe(1);

    flushFrames(2);
    expect(rafCallbacks.length).toBe(1);

    engine.destroy();
  });

  it("snaps range after a long offscreen pause when value left the frozen range", () => {
    vi.spyOn(performance, "now")
      .mockReturnValueOnce(1000) // suspend mark
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(2000); // resume (>250ms later)

    const { engine } = mount(
      baseConfig({
        value: 11,
        data: [
          { time: 1, value: 10 },
          { time: 2, value: 11 },
        ],
      }),
    );

    // Establish an on-screen range around ~10–11
    flushFrames(3);
    setIntersecting(false);
    expect(rafCallbacks.length).toBe(0);

    // Live value jumps outside the frozen display range while paused
    engine.setConfig(
      baseConfig({
        value: 0,
        data: [
          { time: 1, value: 0 },
          { time: 2, value: 0 },
        ],
      }),
    );

    setIntersecting(true);
    expect(rafCallbacks.length).toBe(1);

    engine.destroy();
    vi.restoreAllMocks();
  });

  it("snaps the live tip after a long offscreen pause", () => {
    let now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => now);

    const { engine } = mount(
      baseConfig({
        value: 11,
        data: [
          { time: 1, value: 10 },
          { time: 2, value: 11 },
        ],
      }),
    );

    flushFrames(3);
    // Simulate a lagging tip while still on-screen
    ;(engine as unknown as { displayValue: number }).displayValue = 50;

    setIntersecting(false);
    now = 5000; // suspended ~4s
    engine.setConfig(
      baseConfig({
        value: 72.2,
        data: [
          { time: 1, value: 70 },
          { time: 2, value: 72.2 },
        ],
      }),
    );

    setIntersecting(true);
    expect((engine as unknown as { displayValue: number }).displayValue).toBe(72.2);
    expect((engine as unknown as { arrowState: { up: number; down: number } }).arrowState).toEqual({
      up: 0,
      down: 0,
    });

    engine.destroy();
    vi.restoreAllMocks();
  });

  it("keeps a paused freeze tip after long offscreen (no live flat line)", () => {
    let now = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => now);

    const { engine } = mount(
      baseConfig({
        paused: true,
        value: 11,
        data: [
          { time: 1, value: 10 },
          { time: 2, value: 11 },
        ],
      }),
    );

    flushFrames(3);
    const priv = engine as unknown as {
      displayValue: number;
      timeDebt: number;
      pausedData: { time: number; value: number }[] | null;
    };
    priv.displayValue = 11;
    priv.timeDebt = 1.5;
    priv.pausedData = [
      { time: 1, value: 10 },
      { time: 2, value: 11 },
    ];

    setIntersecting(false);
    now = 6000; // ~5s offscreen while still paused
    engine.setConfig(
      baseConfig({
        paused: true,
        value: 99,
        data: [
          { time: 1, value: 10 },
          { time: 2, value: 11 },
          { time: 50, value: 99 },
        ],
      }),
    );

    setIntersecting(true);
    // Tip stays frozen — do not snap to live 99
    expect(priv.displayValue).toBe(11);
    // Missed wall-clock rolled into debt so now = wall - debt stays at freeze
    expect(priv.timeDebt).toBeCloseTo(1.5 + 5, 5);
    expect(priv.pausedData).not.toBeNull();

    engine.destroy();
    vi.restoreAllMocks();
  });

  it("keeps looping when pauseWhenOffscreen is false", () => {
    const { engine } = mount(baseConfig({ pauseWhenOffscreen: false }));
    flushFrames(1);
    expect(rafCallbacks.length).toBe(1);

    setIntersecting(false);
    flushFrames(3);
    expect(rafCallbacks.length).toBe(1);

    engine.destroy();
  });
});
