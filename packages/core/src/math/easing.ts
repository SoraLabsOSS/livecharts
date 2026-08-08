/**
 * Unit easing curves aligned with Emil Kowalski / animations.dev tokens:
 *   ease-out:    cubic-bezier(0.23, 1, 0.32, 1)
 *   ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)
 *
 * Used for discrete canvas morphs (window, line↔candle). Continuous tip
 * following stays on exponential `lerp` — that is data tracking, not UI.
 */

function sampleBezier(s: number, a: number, b: number): number {
  // P0=0, P1=a, P2=b, P3=1
  const inv = 1 - s;
  return 3 * inv * inv * s * a + 3 * inv * s * s * b + s * s * s;
}

function sampleBezierDerivative(s: number, a: number, b: number): number {
  const inv = 1 - s;
  return 3 * inv * inv * a + 6 * inv * s * (b - a) + 3 * s * s * (1 - b);
}

/** Solve cubic-bezier(x1,y1,x2,y2) for progress `t` in [0, 1]. */
export function cubicBezier(
  t: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  let s = t;
  for (let i = 0; i < 8; i++) {
    const x = sampleBezier(s, x1, x2) - t;
    const dx = sampleBezierDerivative(s, x1, x2);
    if (Math.abs(dx) < 1e-6) break;
    s = Math.min(1, Math.max(0, s - x / dx));
  }
  return sampleBezier(s, y1, y2);
}

/** Strong ease-out — entrances, exits, opacity fades. */
export function easeOutUi(t: number): number {
  return cubicBezier(t, 0.23, 1, 0.32, 1);
}

/** Strong ease-in-out — on-screen morphs (window, mode, width). */
export function easeInOutUi(t: number): number {
  return cubicBezier(t, 0.77, 0, 0.175, 1);
}
