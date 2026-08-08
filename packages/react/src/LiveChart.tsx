import {
  useRef,
  useState,
  useLayoutEffect,
  useMemo,
  useCallback,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import type { Momentum, DegenOptions, HoverPoint } from "@livecharts/core";
import {
  resolveTheme,
  resolveSeriesPalettes,
  SERIES_COLORS,
} from "@livecharts/core";
import type { LiveChartProps } from "./types";
import { useLiveChartEngine } from "./useLiveChartEngine";

const defaultFormatValue = (v: number) => v.toFixed(2);

const defaultFormatTime = (t: number) => {
  const d = new Date(t * 1000);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const A11Y_KEY_HINT =
  "Arrow keys scrub the chart. Home and End jump to the edges. Escape clears the scrub.";

const liveRegionStyle: CSSProperties = {
  border: 0,
  clip: "rect(0, 0, 0, 0)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
};

export function LiveChart({
  data,
  value,
  series: seriesProp,
  theme = "dark",
  color = "#3b82f6",
  window: windowSecs = 30,
  grid = true,
  badge = true,
  momentum = true,
  fill = true,
  scrub = true,
  loading = false,
  paused = false,
  emptyText,
  pauseWhenOffscreen = true,
  exaggerate = false,
  degen: degenProp,
  badgeTail = true,
  badgeVariant = "default",
  showValue = false,
  valueMomentumColor = false,
  windows,
  onWindowChange,
  windowStyle,
  tooltipY = 14,
  tooltipOutline = true,
  orderbook,
  referenceLine,
  formatValue = defaultFormatValue,
  formatTime = defaultFormatTime,
  lerpSpeed = 0.08,
  padding: paddingOverride,
  onHover,
  cursor = "crosshair",
  pulse = true,
  mode = "line",
  candles,
  candleWidth,
  liveCandle,
  lineMode,
  lineData,
  lineValue,
  onModeChange,
  onSeriesToggle,
  seriesToggleCompact = false,
  renderWindows,
  renderModeToggle,
  renderSeriesToggle,
  ariaLabel = "Live chart",
  a11y = true,
  lineWidth,
  className,
  style,
}: LiveChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const valueDisplayRef = useRef<HTMLSpanElement>(null);
  const windowBarRef = useRef<HTMLDivElement>(null);
  const windowBtnRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const modeBarRef = useRef<HTMLDivElement>(null);
  const modeBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [modeIndicatorStyle, setModeIndicatorStyle] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const lastSeriesPropRef = useRef(seriesProp);
  if (seriesProp && seriesProp.length > 0)
    lastSeriesPropRef.current = seriesProp;

  const palette = useMemo(() => {
    const p = resolveTheme(color, theme);
    if (lineWidth != null) p.lineWidth = lineWidth;
    return p;
  }, [color, theme, lineWidth]);
  const isDark = theme === "dark";
  const isMultiSeries = seriesProp != null && seriesProp.length > 0;
  const showSeriesToggle = (lastSeriesPropRef.current?.length ?? 0) > 1;

  // Per-series palettes (memoized on series ids + colors + theme)
  const seriesPalettes = useMemo(() => {
    if (!seriesProp || seriesProp.length === 0) return null;
    return resolveSeriesPalettes(seriesProp, theme);
  }, [seriesProp, theme]);

  // Normalized multi-series config for the engine
  const multiSeries = useMemo(() => {
    if (!seriesProp || !seriesPalettes) return undefined;
    return seriesProp.map((s, i) => ({
      id: s.id,
      data: s.data,
      value: s.value,
      palette:
        seriesPalettes.get(s.id) ??
        resolveTheme(s.color || SERIES_COLORS[i % SERIES_COLORS.length], theme),
      label: s.label,
    }));
  }, [seriesProp, seriesPalettes, theme]);

  // Resolve momentum prop: boolean enables auto-detect, string overrides
  const showMomentum = momentum !== false;
  const momentumOverride: Momentum | undefined =
    typeof momentum === "string" ? momentum : undefined;

  const defaultRight = isMultiSeries
    ? grid
      ? 54
      : 12
    : badge
      ? 80
      : grid
        ? 54
        : 12;
  const pad = {
    top: paddingOverride?.top ?? 12,
    right: paddingOverride?.right ?? defaultRight,
    bottom: paddingOverride?.bottom ?? 28,
    left: paddingOverride?.left ?? 12,
  };

  // Degen mode: explicit prop wins
  const degenEnabled = degenProp != null ? degenProp !== false : false;
  const degenOptions: DegenOptions | undefined = degenEnabled
    ? typeof degenProp === "object"
      ? degenProp
      : {}
    : undefined;

  // Window buttons state
  const [activeWindowSecs, setActiveWindowSecs] = useState(
    windows && windows.length > 0 ? windows[0].secs : windowSecs,
  );
  const effectiveWindowSecs = windows ? activeWindowSecs : windowSecs;

  // Keep internal horizon in sync when `windows` / `window` props change
  useLayoutEffect(() => {
    if (!windows?.length) {
      setActiveWindowSecs(windowSecs);
      return;
    }
    if (!windows.some((w) => w.secs === activeWindowSecs)) {
      setActiveWindowSecs(windows[0]!.secs);
    }
  }, [windows, windowSecs, activeWindowSecs]);

  // Measure active window button for sliding indicator (default chrome only)
  useLayoutEffect(() => {
    if (!windows || windows.length === 0 || renderWindows) return;
    const btn = windowBtnRefs.current.get(activeWindowSecs);
    const bar = windowBarRef.current;
    if (btn && bar) {
      const barRect = bar.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - barRect.left,
        width: btnRect.width,
      });
    }
  }, [activeWindowSecs, windows, renderWindows]);

  // Candle morph: engine always runs candle mode; lineMode drives the morph.
  const hasCandleData = (candles?.length ?? 0) > 0 || liveCandle != null;
  const engineMode = hasCandleData ? "candle" : mode;
  const engineLineMode = hasCandleData
    ? (lineMode ?? mode === "line")
    : false;

  // Mode toggle UI keys off `mode` when candle chrome is shown
  const activeMode = hasCandleData ? mode : lineMode ? "line" : "candle";
  useLayoutEffect(() => {
    if (!onModeChange || renderModeToggle) return;
    const btn = modeBtnRefs.current.get(activeMode);
    const bar = modeBarRef.current;
    if (btn && bar) {
      const barRect = bar.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setModeIndicatorStyle({
        left: btnRect.left - barRect.left,
        width: btnRect.width,
      });
    }
  }, [activeMode, onModeChange, renderModeToggle]);

  // Series toggle handler — prevent hiding the last visible series
  const handleSeriesToggle = useCallback(
    (id: string) => {
      setHiddenSeries((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          onSeriesToggle?.(id, true);
        } else {
          // Count visible series — don't hide last one
          const totalSeries = seriesProp?.length ?? 0;
          const visibleCount = totalSeries - next.size;
          if (visibleCount <= 1) return prev;
          next.add(id);
          onSeriesToggle?.(id, false);
        }
        return next;
      });
    },
    [seriesProp?.length, onSeriesToggle],
  );

  const handleWindowSelect = useCallback(
    (secs: number) => {
      setActiveWindowSecs(secs);
      onWindowChange?.(secs);
    },
    [onWindowChange],
  );

  const handleModeSelect = useCallback(
    (next: "line" | "candle") => {
      onModeChange?.(next);
    },
    [onModeChange],
  );

  const seriesChromeItems = useMemo(() => {
    const list = lastSeriesPropRef.current ?? [];
    return list.map((s, si) => ({
      id: s.id,
      label: s.label ?? s.id,
      color: s.color || SERIES_COLORS[si % SERIES_COLORS.length],
      visible: !hiddenSeries.has(s.id),
    }));
  }, [hiddenSeries, seriesProp]);

  const showModeChrome = !!onModeChange;
  const showWindowsChrome = !!(windows && windows.length > 0);
  const showSeriesChrome = showSeriesToggle || !!renderSeriesToggle;

  const ws = windowStyle ?? "default";

  const a11yEnabled = a11y && scrub;
  const [a11yAnnounce, setA11yAnnounce] = useState("");
  const scrubXRef = useRef<number | null>(null);
  const keyboardScrubRef = useRef(false);

  const handleHover = useCallback(
    (point: HoverPoint | null) => {
      onHover?.(point);
      // Keep last scrub X on pointer leave so Arrow keys continue from the
      // visible scrub line; Escape / setScrubX(null) still clears the ref.
      if (point === null) return;
      scrubXRef.current = point.x;
      if (keyboardScrubRef.current) {
        keyboardScrubRef.current = false;
        setA11yAnnounce(
          `${formatValue(point.value)}, ${formatTime(point.time)}`,
        );
      }
    },
    [onHover, formatValue, formatTime],
  );

  const engineRef = useLiveChartEngine(canvasRef, containerRef, {
    data,
    value,
    palette,
    windowSecs: effectiveWindowSecs,
    lerpSpeed,
    showGrid: grid,
    showBadge: isMultiSeries ? false : badge,
    showMomentum: isMultiSeries ? false : showMomentum,
    momentumOverride,
    showFill: isMultiSeries ? false : fill,
    referenceLine,
    formatValue,
    formatTime,
    padding: pad,
    onHover: handleHover,
    showPulse: pulse,
    scrub,
    exaggerate,
    degenOptions: isMultiSeries ? undefined : degenOptions,
    badgeTail,
    badgeVariant,
    tooltipY,
    tooltipOutline,
    valueMomentumColor,
    valueDisplayRef: showValue ? valueDisplayRef : undefined,
    orderbookData: orderbook,
    loading,
    paused,
    emptyText,
    pauseWhenOffscreen,
    mode: engineMode,
    candles,
    candleWidth,
    liveCandle,
    lineMode: engineLineMode,
    lineData,
    lineValue,
    multiSeries,
    isMultiSeries,
    hiddenSeriesIds: hiddenSeries,
  });

  const moveScrub = useCallback(
    (nextX: number | null) => {
      const engine = engineRef.current;
      if (!engine) return;
      scrubXRef.current = nextX;
      if (nextX === null) {
        keyboardScrubRef.current = false;
        engine.setScrubX(null);
        setA11yAnnounce("");
        return;
      }
      keyboardScrubRef.current = true;
      engine.setScrubX(nextX);
    },
    [engineRef],
  );

  const handleChartKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (!a11yEnabled) return;
      const engine = engineRef.current;
      if (!engine) return;
      const { w } = engine.getSize();
      if (w <= 0) return;

      const left = pad.left;
      const right = Math.max(left + 1, w - pad.right);
      const step = Math.max(4, w * 0.02);
      let next = scrubXRef.current;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          next = (next ?? right) - step;
          break;
        case "ArrowRight":
          e.preventDefault();
          next = (next ?? left) + step;
          break;
        case "Home":
          e.preventDefault();
          next = left;
          break;
        case "End":
          e.preventDefault();
          next = right;
          break;
        case "Escape":
          e.preventDefault();
          moveScrub(null);
          return;
        default:
          return;
      }

      moveScrub(Math.min(right, Math.max(left, next)));
    },
    [a11yEnabled, engineRef, pad.left, pad.right, moveScrub],
  );

  const handleChartFocus = useCallback(() => {
    if (!a11yEnabled) return;
    setA11yAnnounce(`Current value ${formatValue(value)}`);
  }, [a11yEnabled, formatValue, value]);

  const cursorStyle = scrub ? cursor : "default";

  const activeColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)";
  const inactiveColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.22)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {/* Live value display — above the chart */}
      {showValue && (
        <span
          ref={valueDisplayRef}
          style={{
            display: "block",
            flexShrink: 0,
            fontSize: 20,
            fontWeight: 500,
            fontFamily: '"SF Mono", Menlo, monospace',
            color: isDark ? "rgba(255,255,255,0.85)" : "#111",
            transition: "color 200ms ease",
            letterSpacing: "-0.01em",
            marginBottom: 8,
            paddingTop: 4,
            paddingLeft: pad.left,
          }}
        />
      )}

      {/* Control bars row — window pills + mode toggle + series chips side by side */}
      {(showWindowsChrome || showModeChrome || showSeriesChrome) && (
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
            marginLeft: pad.left,
          }}
        >
          {/* Time window controls */}
          {showWindowsChrome &&
            (renderWindows ? (
              renderWindows({
                windows: windows!,
                activeSecs: activeWindowSecs,
                setWindow: handleWindowSelect,
                theme,
              })
            ) : (
            <div
              ref={windowBarRef}
              style={{
                position: "relative",
                display: "inline-flex",
                gap: ws === "text" ? 4 : 2,
                background:
                  ws === "text"
                    ? "transparent"
                    : isDark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.02)",
                borderRadius: ws === "rounded" ? 999 : 6,
                padding: ws === "text" ? 0 : ws === "rounded" ? 3 : 2,
              }}
            >
              {/* Sliding indicator (default + rounded) */}
              {ws !== "text" && indicatorStyle && (
                <div
                  style={{
                    position: "absolute",
                    top: ws === "rounded" ? 3 : 2,
                    left: indicatorStyle.left,
                    width: indicatorStyle.width,
                    height:
                      ws === "rounded"
                        ? "calc(100% - 6px)"
                        : "calc(100% - 4px)",
                    background: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.035)",
                    borderRadius: ws === "rounded" ? 999 : 4,
                    transition:
                      "left 200ms cubic-bezier(0.77, 0, 0.175, 1), width 200ms cubic-bezier(0.77, 0, 0.175, 1)",
                    pointerEvents: "none" as const,
                  }}
                />
              )}
              {windows!.map((w) => {
                const isActive = w.secs === activeWindowSecs;
                return (
                  <button
                    key={w.secs}
                    ref={(el) => {
                      if (el) windowBtnRefs.current.set(w.secs, el);
                      else windowBtnRefs.current.delete(w.secs);
                    }}
                    onClick={() => handleWindowSelect(w.secs)}
                    style={{
                      position: "relative",
                      zIndex: 1,
                      fontSize: 11,
                      padding: ws === "text" ? "2px 6px" : "3px 10px",
                      borderRadius: ws === "rounded" ? 999 : 4,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      fontWeight: isActive ? 600 : 400,
                      background: "transparent",
                      color: isActive ? activeColor : inactiveColor,
                      transition: "color 160ms ease, background 160ms ease",
                      lineHeight: "16px",
                    }}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
            ))}

          {/* Mode toggle — separate bar with its own sliding indicator */}
          {showModeChrome &&
            (renderModeToggle ? (
              renderModeToggle({
                mode: activeMode ?? "line",
                setMode: handleModeSelect,
                theme,
              })
            ) : (
            <div
              ref={modeBarRef}
              style={{
                position: "relative",
                display: "inline-flex",
                gap: ws === "text" ? 4 : 2,
                background:
                  ws === "text"
                    ? "transparent"
                    : isDark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.02)",
                borderRadius: ws === "rounded" ? 999 : 6,
                padding: ws === "text" ? 0 : ws === "rounded" ? 3 : 2,
              }}
            >
              {/* Sliding indicator */}
              {ws !== "text" && modeIndicatorStyle && (
                <div
                  style={{
                    position: "absolute",
                    top: ws === "rounded" ? 3 : 2,
                    left: modeIndicatorStyle.left,
                    width: modeIndicatorStyle.width,
                    height:
                      ws === "rounded"
                        ? "calc(100% - 6px)"
                        : "calc(100% - 4px)",
                    background: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.035)",
                    borderRadius: ws === "rounded" ? 999 : 4,
                    transition:
                      "left 200ms cubic-bezier(0.77, 0, 0.175, 1), width 200ms cubic-bezier(0.77, 0, 0.175, 1)",
                    pointerEvents: "none" as const,
                  }}
                />
              )}
              {/* Line icon */}
              <button
                ref={(el) => {
                  if (el) modeBtnRefs.current.set("line", el);
                  else modeBtnRefs.current.delete("line");
                }}
                onClick={() => handleModeSelect("line")}
                style={{
                  position: "relative",
                  zIndex: 1,
                  padding: "5px 7px",
                  borderRadius: ws === "rounded" ? 999 : 4,
                  border: "none",
                  cursor: "pointer",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M1 8.5C2.5 8.5 3 4 5.5 4S7.5 7 8.5 7C9.5 7 10 3.5 11 3.5"
                    stroke={activeMode === "line" ? activeColor : inactiveColor}
                    strokeWidth={activeMode === "line" ? 1.5 : 1.2}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </button>
              {/* Candle icon */}
              <button
                ref={(el) => {
                  if (el) modeBtnRefs.current.set("candle", el);
                  else modeBtnRefs.current.delete("candle");
                }}
                onClick={() => handleModeSelect("candle")}
                style={{
                  position: "relative",
                  zIndex: 1,
                  padding: "5px 7px",
                  borderRadius: ws === "rounded" ? 999 : 4,
                  border: "none",
                  cursor: "pointer",
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <line
                    x1="3.5"
                    y1="1"
                    x2="3.5"
                    y2="11"
                    stroke={
                      activeMode === "candle" ? activeColor : inactiveColor
                    }
                    strokeWidth="1"
                  />
                  <rect
                    x="2"
                    y="3"
                    width="3"
                    height="5"
                    rx="0.5"
                    fill={activeMode === "candle" ? activeColor : inactiveColor}
                  />
                  <line
                    x1="8.5"
                    y1="2"
                    x2="8.5"
                    y2="10"
                    stroke={
                      activeMode === "candle" ? activeColor : inactiveColor
                    }
                    strokeWidth="1"
                  />
                  <rect
                    x="7"
                    y="4"
                    width="3"
                    height="4"
                    rx="0.5"
                    fill={activeMode === "candle" ? activeColor : inactiveColor}
                  />
                </svg>
              </button>
            </div>
            ))}

          {/* Series toggle chips */}
          {showSeriesChrome &&
            (renderSeriesToggle ? (
              renderSeriesToggle({
                series: seriesChromeItems,
                toggle: handleSeriesToggle,
                theme,
              })
            ) : showSeriesToggle ? (
            <div
              style={{
                display: "inline-flex",
                gap: ws === "text" ? 4 : 2,
                background:
                  ws === "text"
                    ? "transparent"
                    : isDark
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(0,0,0,0.02)",
                borderRadius: ws === "rounded" ? 999 : 6,
                padding: ws === "text" ? 0 : ws === "rounded" ? 3 : 2,
                opacity: isMultiSeries ? 1 : 0,
                transition: "opacity 200ms cubic-bezier(0.23, 1, 0.32, 1)",
                pointerEvents: isMultiSeries ? "auto" : "none",
              }}
            >
              {(lastSeriesPropRef.current ?? []).map((s, si) => {
                const isHidden = hiddenSeries.has(s.id);
                const seriesColor =
                  s.color || SERIES_COLORS[si % SERIES_COLORS.length];
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSeriesToggle(s.id)}
                    style={{
                      position: "relative",
                      zIndex: 1,
                      fontSize: 11,
                      padding: seriesToggleCompact
                        ? ws === "text"
                          ? "2px 4px"
                          : "5px 7px"
                        : ws === "text"
                          ? "2px 6px"
                          : "3px 8px",
                      borderRadius: ws === "rounded" ? 999 : 4,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      fontWeight: 500,
                      background: isHidden
                        ? "transparent"
                        : ws === "text"
                          ? "transparent"
                          : isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.035)",
                      color: isHidden ? inactiveColor : activeColor,
                      opacity: isHidden ? 0.4 : 1,
                      transition:
                        "opacity 160ms ease, background 160ms ease, color 160ms ease",
                      lineHeight: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: seriesToggleCompact ? 0 : 4,
                    }}
                  >
                    <span
                      style={{
                        width: seriesToggleCompact ? 8 : 6,
                        height: seriesToggleCompact ? 8 : 6,
                        borderRadius: "50%",
                        background: seriesColor,
                        flexShrink: 0,
                        opacity: isHidden ? 0.4 : 1,
                        transition: "opacity 160ms ease",
                      }}
                    />
                    {!seriesToggleCompact && (s.label ?? s.id)}
                  </button>
                );
              })}
            </div>
            ) : null)}
        </div>
      )}

      <div
        ref={containerRef}
        className={className}
        role={a11yEnabled ? "region" : undefined}
        aria-label={a11yEnabled ? ariaLabel : undefined}
        aria-description={a11yEnabled ? A11Y_KEY_HINT : undefined}
        tabIndex={a11yEnabled ? 0 : undefined}
        onKeyDown={a11yEnabled ? handleChartKeyDown : undefined}
        onFocus={a11yEnabled ? handleChartFocus : undefined}
        style={{
          width: "100%",
          flex: 1,
          // height:0 + flex:1 fills leftover under chrome; minHeight
          // keeps a usable plot if the parent never sets a height
          height: 0,
          minHeight: 120,
          minWidth: 0,
          position: "relative",
          overflow: "hidden",
          outline: "none",
          ...style,
        }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            display: "block",
            cursor: cursorStyle,
            width: "100%",
            height: "100%",
          }}
        />
        {a11yEnabled ? (
          <div aria-atomic="true" aria-live="polite" style={liveRegionStyle}>
            {a11yAnnounce}
          </div>
        ) : null}
      </div>
    </div>
  );
}
