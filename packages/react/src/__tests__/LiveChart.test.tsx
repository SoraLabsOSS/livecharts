import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveChart } from "../LiveChart";
import { LiveChartTransition } from "../LiveChartTransition";

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

describe("LiveChart React bindings", () => {
  beforeEach(() => {
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
