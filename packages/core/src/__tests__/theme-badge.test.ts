import { describe, it, expect } from "vitest";
import { parseColorRgb, resolveTheme, SERIES_COLORS } from "../theme";
import { badgeSvgPath, badgePillOnly } from "../draw/badge";
import { loadingY, loadingBreath } from "../draw/loadingShape";
import { computeRange } from "../math/range";
import type { LiveChartPoint } from "../types";

describe("parseColorRgb", () => {
  it("parses #rgb", () => {
    expect(parseColorRgb("#f00")).toEqual([255, 0, 0]);
  });

  it("parses #rrggbb", () => {
    expect(parseColorRgb("#3b82f6")).toEqual([59, 130, 246]);
  });

  it("parses rgb()", () => {
    expect(parseColorRgb("rgb(10, 20, 30)")).toEqual([10, 20, 30]);
  });

  it("falls back for unknown", () => {
    expect(parseColorRgb("not-a-color")).toEqual([128, 128, 128]);
  });
});

describe("resolveTheme", () => {
  it("uses accent as line color", () => {
    const p = resolveTheme("#3b82f6", "dark");
    expect(p.line).toBe("#3b82f6");
    expect(p.dotUp).toBe("#22c55e");
    expect(p.dotDown).toBe("#ef4444");
  });

  it("differs dark vs light grid", () => {
    const dark = resolveTheme("#3b82f6", "dark");
    const light = resolveTheme("#3b82f6", "light");
    expect(dark.gridLine).not.toBe(light.gridLine);
    expect(dark.bgRgb).toEqual([10, 10, 10]);
    expect(light.bgRgb).toEqual([255, 255, 255]);
  });

  it("exports SERIES_COLORS", () => {
    expect(SERIES_COLORS.length).toBeGreaterThan(0);
  });
});

describe("badge paths", () => {
  it("badgeSvgPath is stable for fixed sizes", () => {
    const path = badgeSvgPath(40, 16, 5, 2.5);
    expect(path).toContain("M");
    expect(path).toContain("Z");
    expect(path).toBe(badgeSvgPath(40, 16, 5, 2.5));
  });

  it("badgePillOnly is a closed path", () => {
    const path = badgePillOnly(40, 16);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });
});

describe("loadingShape", () => {
  it("loadingY returns center when amplitude is 0", () => {
    expect(loadingY(0.5, 100, 0, 0)).toBe(100);
  });

  it("loadingBreath stays in expected band", () => {
    for (const t of [0, 600, 1200, 2400]) {
      const a = loadingBreath(t);
      expect(a).toBeGreaterThanOrEqual(0.14);
      expect(a).toBeLessThanOrEqual(0.3);
    }
  });
});

describe("computeRange exaggerate", () => {
  const pts = (values: number[]): LiveChartPoint[] =>
    values.map((v, i) => ({ time: i, value: v }));

  it("uses tighter margins when exaggerate is true", () => {
    const normal = computeRange(pts([10, 20]), 15, undefined, false);
    const tight = computeRange(pts([10, 20]), 15, undefined, true);
    expect(tight.max - tight.min).toBeLessThan(normal.max - normal.min);
  });
});
