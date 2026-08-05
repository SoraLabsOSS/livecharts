import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EngineConfig } from "@livecharts/core";
import { LiveChart } from "../LiveChart";

const setConfigCalls: EngineConfig[] = [];

vi.mock("@livecharts/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@livecharts/core")>();

  return {
    ...actual,
    LiveChartEngine: class {
      setConfig(config: EngineConfig) {
        setConfigCalls.push(config);
      }
      start() {}
      destroy() {}
    },
  };
});

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

describe("candle mode mapping", () => {
  beforeEach(() => {
    setConfigCalls.length = 0;
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

  const candles = [
    { time: 0, open: 10, high: 12, low: 9, close: 11 },
  ];
  const data = [
    { time: 0, value: 10 },
    { time: 1, value: 11 },
  ];

  it('maps mode="line" to engine candle + lineMode when candle data is present', () => {
    render(
      <LiveChart
        candles={candles}
        data={data}
        mode="line"
        value={11}
      />,
    );

    const last = setConfigCalls.at(-1);
    expect(last?.mode).toBe("candle");
    expect(last?.lineMode).toBe(true);
  });

  it('maps mode="candle" to lineMode false when candle data is present', () => {
    render(
      <LiveChart
        candles={candles}
        data={data}
        mode="candle"
        value={11}
      />,
    );

    const last = setConfigCalls.at(-1);
    expect(last?.mode).toBe("candle");
    expect(last?.lineMode).toBe(false);
  });

  it("allows deprecated lineMode override", () => {
    render(
      <LiveChart
        candles={candles}
        data={data}
        lineMode={true}
        mode="candle"
        value={11}
      />,
    );

    const last = setConfigCalls.at(-1);
    expect(last?.mode).toBe("candle");
    expect(last?.lineMode).toBe(true);
  });
});
