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
    vi.stubGlobal("cancelAnimationFrame", () => {});
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
    flushFrames(1);
    expect(rafCallbacks.length).toBe(0);

    flushFrames(2);
    expect(rafCallbacks.length).toBe(0);

    engine.destroy();
  });

  it("resumes the loop when re-entering the viewport", () => {
    const { engine } = mount(baseConfig());
    setIntersecting(false);
    flushFrames(1);
    expect(rafCallbacks.length).toBe(0);

    setIntersecting(true);
    expect(rafCallbacks.length).toBe(1);

    flushFrames(2);
    expect(rafCallbacks.length).toBe(1);

    engine.destroy();
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
