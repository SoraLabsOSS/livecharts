import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveChart } from "../LiveChart";

vi.mock("@livecharts/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@livecharts/core")>();
  return {
    ...actual,
    LiveChartEngine: class {
      setConfig() {}
      start() {}
      destroy() {}
    },
  };
});

describe("LiveChart Vue bindings", () => {
  beforeEach(() => {
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

  it("syncs window prop when windows pills are not used", async () => {
    const wrapper = mount(LiveChart, {
      props: {
        data: [{ time: 1, value: 10 }],
        value: 10,
        window: 30,
      },
    });

    await wrapper.setProps({ window: 120 });
    // engine config is pushed via watchEffect — smoke that prop update does not throw
    expect(wrapper.find("canvas").exists()).toBe(true);
    wrapper.unmount();
  });
});
