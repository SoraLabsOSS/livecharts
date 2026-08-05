import { StrictMode } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveChart } from "../LiveChart";

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

describe("LiveChart engine lifecycle", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
    vi.stubGlobal("requestAnimationFrame", () => 1);
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
    cleanup();
    vi.unstubAllGlobals();
  });

  it("does not leak its badge DOM through a StrictMode remount", () => {
    const { container, unmount } = render(
      <StrictMode>
        <LiveChart
          data={[
            { time: 1, value: 10 },
            { time: 2, value: 11 },
          ]}
          value={11}
        />
      </StrictMode>,
    );

    const chartContainer = container.querySelector("canvas")?.parentElement;
    expect(chartContainer).not.toBeNull();
    expect(chartContainer?.querySelectorAll(":scope > div > svg")).toHaveLength(
      1,
    );

    unmount();
    expect(chartContainer?.querySelectorAll(":scope > div > svg")).toHaveLength(
      0,
    );
  });
});
