import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EngineConfig, HoverPoint } from "@livecharts/core";
import { LiveChart } from "../LiveChart";
import { LiveChartTransition } from "../LiveChartTransition";

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
        return { w: 400, h: 200 };
      }
    },
  };
});

describe("LiveChart React bindings", () => {
  beforeEach(() => {
    lastConfig = null;
    setScrubXCalls.length = 0;
    vi.useFakeTimers();
    vi.stubGlobal(
      "requestAnimationFrame",
      (callback: FrameRequestCallback) =>
        window.setTimeout(() => callback(performance.now()), 0),
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) =>
      window.clearTimeout(id),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("renders a canvas and forwards window changes", () => {
    const onWindowChange = vi.fn();

    const { container } = render(
      <LiveChart
        data={[
          { time: 1, value: 10 },
          { time: 2, value: 11 },
        ]}
        value={11}
        windows={[
          { label: "1m", secs: 60 },
          { label: "5m", secs: 300 },
        ]}
        onWindowChange={onWindowChange}
      />,
    );

    expect(container.querySelector("canvas")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "5m" }));
    expect(onWindowChange).toHaveBeenCalledWith(300);
  });

  it("uses renderWindows instead of the default window pills", () => {
    const onWindowChange = vi.fn();

    render(
      <LiveChart
        data={[
          { time: 1, value: 10 },
          { time: 2, value: 11 },
        ]}
        value={11}
        windows={[
          { label: "1m", secs: 60 },
          { label: "5m", secs: 300 },
        ]}
        onWindowChange={onWindowChange}
        renderWindows={({ windows, activeSecs, setWindow }) => (
          <div>
            {windows.map((w) => (
              <button
                key={w.secs}
                type="button"
                data-active={w.secs === activeSecs ? "1" : "0"}
                onClick={() => setWindow(w.secs)}
              >
                custom-{w.label}
              </button>
            ))}
          </div>
        )}
      />,
    );

    expect(screen.queryByRole("button", { name: "5m" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "custom-5m" }));
    expect(onWindowChange).toHaveBeenCalledWith(300);
  });

  it("supports keyboard scrub and a live region", () => {
    const onHover = vi.fn();

    render(
      <LiveChart
        ariaLabel="Price chart"
        data={[
          { time: 1, value: 10 },
          { time: 2, value: 11 },
        ]}
        value={11}
        onHover={onHover}
      />,
    );

    const region = screen.getByRole("region", { name: "Price chart" });
    expect(region.getAttribute("tabindex")).toBe("0");

    fireEvent.focus(region);
    expect(screen.getByText("Current value 11.00")).toBeTruthy();

    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(setScrubXCalls.length).toBeGreaterThan(0);
    expect(onHover).toHaveBeenCalled();
    const point = onHover.mock.calls.find((c) => c[0] != null)?.[0] as
      | HoverPoint
      | undefined;
    expect(point?.value).toBe(11);

    fireEvent.keyDown(region, { key: "Escape" });
    expect(setScrubXCalls.at(-1)).toBeNull();
    expect(onHover).toHaveBeenCalledWith(null);
  });

  it("continues keyboard scrub from the last pointer hover X after leave", () => {
    render(
      <LiveChart
        ariaLabel="Price chart"
        data={[
          { time: 1, value: 10 },
          { time: 2, value: 11 },
        ]}
        value={11}
      />,
    );

    const region = screen.getByRole("region", { name: "Price chart" });
    act(() => {
      lastConfig?.onHover?.({ time: 1.5, value: 10.5, x: 200, y: 40 });
      lastConfig?.onHover?.(null);
    });

    fireEvent.keyDown(region, { key: "ArrowRight" });
    // w=400 → step = max(4, 8) = 8; continues from pointer x=200
    expect(setScrubXCalls.at(-1)).toBe(208);
  });

  it("cross-fades keyed children and unmounts the outgoing child", async () => {
    const { rerender } = render(
      <LiveChartTransition active="line" duration={100}>
        <div key="line">Line</div>
        <div key="candle">Candle</div>
      </LiveChartTransition>,
    );

    expect(screen.getByText("Line")).toBeTruthy();
    expect(screen.queryByText("Candle")).toBeNull();

    rerender(
      <LiveChartTransition active="candle" duration={100}>
        <div key="line">Line</div>
        <div key="candle">Candle</div>
      </LiveChartTransition>,
    );

    expect(screen.getByText("Candle")).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(151);
    });

    expect(screen.queryByText("Line")).toBeNull();
    expect(screen.getByText("Candle")).toBeTruthy();
  });
});
