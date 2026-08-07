import { resolveTheme } from "@livecharts/core";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { useLiveChartEngine } from "../useLiveChartEngine";

const start = vi.fn();
const destroy = vi.fn();
const setConfig = vi.fn();

vi.mock("@livecharts/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@livecharts/core")>();
  return {
    ...actual,
    LiveChartEngine: class {
      setConfig = setConfig;
      start = start;
      destroy = destroy;
      setScrubX() {}
      getSize() {
        return { h: 200, w: 400 };
      }
    },
  };
});

describe("useLiveChartEngine lifecycle", () => {
  beforeEach(() => {
    start.mockClear();
    destroy.mockClear();
    setConfig.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts and destroys the engine with the host component", async () => {
    const Host = defineComponent({
      setup() {
        const canvasRef = ref<HTMLCanvasElement | null>(null);
        const containerRef = ref<HTMLDivElement | null>(null);
        useLiveChartEngine(canvasRef, containerRef, () => ({
          badgeTail: true,
          badgeVariant: "default" as const,
          data: [{ time: 1, value: 10 }],
          exaggerate: false,
          formatTime: (t: number) => String(t),
          formatValue: (v: number) => String(v),
          lerpSpeed: 0.08,
          loading: false,
          padding: { bottom: 28, left: 12, right: 54, top: 12 },
          palette: resolveTheme("#3b82f6", "dark"),
          paused: false,
          pauseWhenOffscreen: true,
          scrub: true,
          showBadge: true,
          showFill: true,
          showGrid: true,
          showMomentum: false,
          showPulse: true,
          tooltipOutline: true,
          tooltipY: 14,
          value: 10,
          valueMomentumColor: false,
          windowSecs: 30,
        }));
        return () =>
          h("div", { ref: containerRef }, [h("canvas", { ref: canvasRef })]);
      },
    });

    const wrapper = mount(Host);
    await nextTick();
    expect(start).toHaveBeenCalled();
    expect(setConfig).toHaveBeenCalled();
    wrapper.unmount();
    expect(destroy).toHaveBeenCalled();
  });
});
