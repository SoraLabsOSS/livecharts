import { describe, expect, it } from "vitest";
import { resolveTheme } from "../theme";

/**
 * Mirrors drawLine's edge inset: stroke centered on the clip boundary is
 * fully discarded by canvas clipping, while badge/dot (outside clip) still
 * move — the rare "value=0 / edge hug" glitch after a stale range.
 */
function clampStrokeY(
  y: number,
  padTop: number,
  padBottom: number,
  height: number,
  lineWidth: number,
): number {
  const strokePad = Math.max(lineWidth * 0.5, 1);
  const yMin = padTop;
  const yMax = height - padBottom;
  return Math.max(yMin + strokePad, Math.min(yMax - strokePad, y));
}

describe("edge stroke clamp", () => {
  it("keeps a bottom-edge value inside the stroke-safe band", () => {
    const palette = resolveTheme("#3b82f6", "dark");
    const h = 200;
    const padTop = 12;
    const padBottom = 28;
    const edgeY = h - padBottom; // exact clip bottom
    const clamped = clampStrokeY(edgeY, padTop, padBottom, h, palette.lineWidth);
    expect(clamped).toBeLessThan(edgeY);
    expect(clamped).toBeGreaterThanOrEqual(padTop + 1);
  });

  it("keeps a top-edge value inside the stroke-safe band", () => {
    const padTop = 12;
    const clamped = clampStrokeY(padTop, padTop, 28, 200, 2);
    expect(clamped).toBeGreaterThan(padTop);
  });

  it("leaves mid-chart values unchanged", () => {
    expect(clampStrokeY(100, 12, 28, 200, 2)).toBe(100);
  });
});
