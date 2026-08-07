import type { EngineConfig, HoverPoint } from "@livecharts/core";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { h } from "vue";
import { LiveChart } from "../LiveChart";

let lastConfig: EngineConfig | null = null;
const setScrubXCalls: Array<number | null> = [];

vi.mock("@livecharts/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@livecharts/core")>();
  return {
    ...actual,
    LiveChartEngine: class {
      setConfig(config: EngineConfig) {
        lastConfig = config;
      }
      start() {}
      destroy() {}
      setScrubX(x: number | null) {
        setScrubXCalls.push(x);
        if (x === null) {
          lastConfig?.onHover?.(null);
          return;
        }
        const point: HoverPoint = { time: 2, value: 11, x, y: 10 };
        lastConfig?.onHover?.(point);
      }
      getSize() {
        return { h: 200, w: 400 };
      }
    },
  };
});

describe("LiveChart Vue bindings", () => {
  beforeEach(() => {
    lastConfig = null;
    setScrubXCalls.length = 0;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 0)
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) =>
      window.clearTimeout(id)
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a canvas and emits windowChange", async () => {
    const wrapper = mount(LiveChart, {
      props: {
        data: [
          { time: 1, value: 10 },
          { time: 2, value: 11 },
        ],
        value: 11,
        windows: [
          { label: "1m", secs: 60 },
          { label: "5m", secs: 300 },
        ],
      },
    });

    expect(wrapper.find("canvas").exists()).toBe(true);
    const fiveMin = wrapper.findAll("button").find((b) => b.text() === "5m");
    expect(fiveMin).toBeTruthy();
    await fiveMin?.trigger("click");
    expect(wrapper.emitted("windowChange")).toEqual([[300]]);
    wrapper.unmount();
  });

  it("uses #windows slot instead of default pills", async () => {
    const wrapper = mount(LiveChart, {
      props: {
        data: [
          { time: 1, value: 10 },
          { time: 2, value: 11 },
        ],
        value: 11,
        windows: [
          { label: "1m", secs: 60 },
          { label: "5m", secs: 300 },
        ],
      },
      slots: {
        windows: (slotProps: {
          windows: { label: string; secs: number }[];
          setWindow: (secs: number) => void;
        }) =>
          slotProps.windows.map((w) =>
            h(
              "button",
              {
                key: w.secs,
                onClick: () => slotProps.setWindow(w.secs),
                type: "button",
              },
              `custom-${w.label}`
            )
          ),
      },
    });

    expect(wrapper.findAll("button").some((b) => b.text() === "5m")).toBe(
      false
    );
    const custom = wrapper
      .findAll("button")
      .find((b) => b.text() === "custom-5m");
    expect(custom).toBeTruthy();
    await custom?.trigger("click");
    expect(wrapper.emitted("windowChange")).toEqual([[300]]);
    wrapper.unmount();
  });

  it("supports keyboard scrub and a live region", async () => {
    const wrapper = mount(LiveChart, {
      props: {
        ariaLabel: "Price chart",
        data: [
          { time: 1, value: 10 },
          { time: 2, value: 11 },
        ],
        value: 11,
      },
    });

    const region = wrapper.find('[role="region"]');
    expect(region.exists()).toBe(true);
    expect(region.attributes("aria-label")).toBe("Price chart");
    expect(region.attributes("tabindex")).toBe("0");

    await region.trigger("focus");
    expect(wrapper.text()).toContain("Current value 11.00");

    await region.trigger("keydown", { key: "ArrowRight" });
    expect(setScrubXCalls.length).toBeGreaterThan(0);
    expect(wrapper.emitted("hover")?.length).toBeGreaterThan(0);

    await region.trigger("keydown", { key: "Escape" });
    expect(setScrubXCalls.at(-1)).toBeNull();
    wrapper.unmount();
  });

  it("syncs window prop when windows pills are not used", async () => {
    const wrapper = mount(LiveChart, {
      props: {
        data: [{ time: 1, value: 10 }],
        value: 10,
        window: 30,
      },
    });

    await wrapper.setProps({ window: 120 });
    expect(wrapper.find("canvas").exists()).toBe(true);
    wrapper.unmount();
  });
});
