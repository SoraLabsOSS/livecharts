/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveChartEngine } from "../engine/LiveChartEngine";
import { resolveTheme } from "../theme";
import type { EngineConfig } from "../engine/config";

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

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
    scrub: true,
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
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    measureText: () => ({ width: 0 }),
  };
  const proxied = new Proxy(ctx, {
    get(target, prop) {
      if (prop in target) return Reflect.get(target, prop);
      return () => undefined;
    },
  });
  canvas.getContext = (() => proxied) as typeof canvas.getContext;
}

describe("setScrubX / getSize", () => {
  let rafCallbacks: FrameRequestCallback[] = [];
  let rafId = 0;

  beforeEach(() => {
    rafCallbacks = [];
    rafId = 0;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
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
      if (rafCallbacks.length > 0 && id === rafId) rafCallbacks.pop();
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
      for (const cb of cbs) cb(performance.now());
    }
  }

  function mount(config: EngineConfig) {
    const canvas = document.createElement("canvas");
    stubCanvasContext(canvas);
    const container = document.createElement("div");
    Object.defineProperty(container, "getBoundingClientRect", {
      value: () => ({
        width: 400,
        height: 200,
        left: 0,
        top: 0,
        right: 400,
        bottom: 200,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });
    container.appendChild(canvas);
    document.body.appendChild(container);
    const engine = new LiveChartEngine({ canvas, container });
    engine.setConfig(config);
    engine.start();
    // Seed size used by draw (ResizeObserver stub does not fire)
    ;(engine as unknown as { size: { w: number; h: number } }).size = {
      w: 400,
      h: 200,
    };
    return { engine, container };
  }

  it("getSize returns the container size", () => {
    const { engine } = mount(baseConfig());
    expect(engine.getSize()).toEqual({ w: 400, h: 200 });
    engine.destroy();
  });

  it("setScrubX drives onHover; null clears", () => {
    const onHover = vi.fn();
    const { engine } = mount(baseConfig({ onHover, scrub: true }));

    flushFrames(2);
    engine.setScrubX(200);
    flushFrames(2);
    expect(onHover).toHaveBeenCalled();
    const lastPoint = onHover.mock.calls.find(
      (c) => c[0] != null,
    )?.[0] as { x: number; value: number; time: number } | undefined;
    expect(lastPoint).toBeTruthy();
    expect(lastPoint!.x).toBeGreaterThan(0);

    onHover.mockClear();
    engine.setScrubX(null);
    expect(onHover).toHaveBeenCalledWith(null);

    engine.destroy();
  });
});
