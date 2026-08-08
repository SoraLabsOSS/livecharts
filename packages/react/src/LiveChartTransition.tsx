import {
  useState,
  useEffect,
  useRef,
  type ReactElement,
  type CSSProperties,
} from "react";

/** Strong ease-out — Emil / animations.dev UI entrance & exit curve. */
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

/** Occasional mode switch cross-fade; keep under 300ms UI budget. */
const DEFAULT_DURATION_MS = 220;

export interface LiveChartTransitionProps {
  /** Key of the active child to display. Must match a child's `key` prop. */
  active: string;
  /** Chart elements with unique `key` props */
  children: ReactElement | ReactElement[];
  /** Cross-fade duration in ms (default 220) */
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  return reduced;
}

/**
 * Cross-fade between chart components (e.g. line ↔ candlestick).
 * Children must have unique `key` props matching possible `active` values.
 *
 * Purpose: prevent a jarring swap between two chart instances (opacity only).
 *
 * @example
 * ```tsx
 * <LiveChartTransition active={chartType}>
 *   <LiveChart key="line" data={data} value={value} />
 *   <LiveChart key="candle" mode="candle" candles={candles} candleWidth={5} data={data} value={value} />
 * </LiveChartTransition>
 * ```
 */
export function LiveChartTransition({
  active,
  children,
  duration = DEFAULT_DURATION_MS,
  className,
  style,
}: LiveChartTransitionProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const reduceMotion = usePrefersReducedMotion();
  // Ref so mid-flight prefers-reduced-motion flips don't cancel an in-progress
  // crossfade via effect cleanup + early-return (stuck outgoing chart).
  const reduceMotionRef = useRef(reduceMotion);
  reduceMotionRef.current = reduceMotion;
  const styleDuration = reduceMotion ? 0 : duration;

  const [mounted, setMounted] = useState<Set<string>>(
    () => new Set([active]),
  );
  const [visible, setVisible] = useState(active);
  const prevRef = useRef(active);

  useEffect(() => {
    if (active === prevRef.current) return () => {};
    const oldKey = prevRef.current;
    prevRef.current = active;

    const ms = reduceMotionRef.current ? 0 : duration;
    setMounted((prev) => new Set([...prev, active]));

    if (ms <= 0) {
      setVisible(active);
      setMounted(new Set([active]));
      return () => {};
    }

    // Double rAF: paint opacity:0 before flipping so the CSS transition fires
    let raf1 = requestAnimationFrame(() => {
      raf1 = requestAnimationFrame(() => setVisible(active));
    });

    const timer = setTimeout(() => {
      setMounted((prev) => {
        const next = new Set(prev);
        next.delete(oldKey);
        return next;
      });
    }, ms + 50);

    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(timer);
    };
  }, [active, duration]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        ...style,
      }}
    >
      {childArray.map((child) => {
        const key = String(child.key ?? "");
        if (!mounted.has(key)) return null;
        const isActive = key === visible;
        return (
          <div
            key={key}
            style={{
              position: "absolute",
              inset: 0,
              opacity: isActive ? 1 : 0,
              transition:
                styleDuration > 0
                  ? `opacity ${styleDuration}ms ${EASE_OUT}`
                  : "none",
              pointerEvents: isActive ? "auto" : "none",
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
