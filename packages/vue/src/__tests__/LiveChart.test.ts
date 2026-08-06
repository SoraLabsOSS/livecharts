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

  it("renders a canvas and forwards window changes", async () => {
    const onWindowChange = vi.fn();

    const wrapper = mount(LiveChart, {
      props: {
        data: [
          { time: 1, value: 10 },
          { time: 2, value: 11 },
        ],
        onWindowChange,
        value: 11,
        windows: [
          { label: "1m", secs: 60 },
          { label: "5m", secs: 300 },
        ],
      },
    });

    expect(wrapper.find("canvas").exists()).toBe(true);
    const buttons = wrapper.findAll("button");
    const fiveMin = buttons.find((b) => b.text() === "5m");
    expect(fiveMin).toBeTruthy();
    await fiveMin!.trigger("click");
    expect(onWindowChange).toHaveBeenCalledWith(300);
    wrapper.unmount();
  });
});
