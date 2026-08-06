import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Comment, createTextVNode, h, nextTick } from "vue";
import { LiveChartTransition } from "../LiveChartTransition";

describe("LiveChartTransition", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 0)
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) =>
      window.clearTimeout(id)
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("cross-fades keyed children and unmounts the outgoing child", async () => {
    const wrapper = mount(LiveChartTransition, {
      props: { active: "line", duration: 100 },
      slots: {
        default: () => [
          h("div", { key: "line" }, "Line"),
          h("div", { key: "candle" }, "Candle"),
        ],
      },
    });

    expect(wrapper.text()).toContain("Line");
    expect(wrapper.text()).not.toContain("Candle");

    await wrapper.setProps({ active: "candle" });
    await nextTick();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);

    expect(wrapper.text()).toContain("Candle");

    await vi.advanceTimersByTimeAsync(151);
    expect(wrapper.text()).not.toContain("Line");
    expect(wrapper.text()).toContain("Candle");

    wrapper.unmount();
  });

  it("ignores comment, text, and empty-key nodes", () => {
    const wrapper = mount(LiveChartTransition, {
      props: { active: "line", duration: 100 },
      slots: {
        default: () => [
          h(Comment, null, "ignore"),
          createTextVNode(" "),
          h("div", { key: "" }, "Empty"),
          h("div", { key: "line" }, "Line"),
        ],
      },
    });

    expect(wrapper.text()).toBe("Line");
    wrapper.unmount();
  });
});
