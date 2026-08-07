import type { CSSProperties } from "react";
import type {
  LiveChartPoint,
  LiveChartSeries,
  ThemeMode,
  Momentum,
  DegenOptions,
  WindowOption,
  WindowStyle,
  BadgeVariant,
  OrderbookData,
  ReferenceLine,
  HoverPoint,
  Padding,
  CandlePoint,
} from "@livecharts/core";
import type {
  ChromeModeRender,
  ChromeSeriesRender,
  ChromeWindowsRender,
} from "./chrome";

export type {
  ChromeModeSlotProps,
  ChromeSeriesItem,
  ChromeSeriesSlotProps,
  ChromeWindowsSlotProps,
} from "./chrome";

export interface LiveChartProps {
  data: LiveChartPoint[];
  value: number;

  // Multi-series mode — when provided, overrides data/value/color
  series?: LiveChartSeries[];

  // Appearance
  theme?: ThemeMode;
  color?: string;

  // Time
  window?: number;

  // Feature flags
  grid?: boolean;
  badge?: boolean;
  momentum?: boolean | Momentum;
  fill?: boolean;
  loading?: boolean;
  paused?: boolean;
  emptyText?: string;
  /** Stop the rAF loop while the chart is offscreen. Default true. */
  pauseWhenOffscreen?: boolean;
  scrub?: boolean;
  exaggerate?: boolean;
  showValue?: boolean;
  valueMomentumColor?: boolean;
  degen?: boolean | DegenOptions;
  badgeTail?: boolean;

  // Time window buttons
  windows?: WindowOption[];
  onWindowChange?: (secs: number) => void;
  windowStyle?: WindowStyle;

  // Badge
  badgeVariant?: BadgeVariant;

  // Crosshair
  tooltipY?: number;
  tooltipOutline?: boolean;

  // Orderbook
  orderbook?: OrderbookData;

  // Optional
  referenceLine?: ReferenceLine;
  formatValue?: (v: number) => string;
  formatTime?: (t: number) => string;
  lerpSpeed?: number;
  padding?: Padding;
  onHover?: (point: HoverPoint | null) => void;
  cursor?: string;
  pulse?: boolean;
  lineWidth?: number;

  // Candlestick mode
  mode?: "line" | "candle";
  candles?: CandlePoint[];
  candleWidth?: number;
  liveCandle?: CandlePoint;
  /**
   * @deprecated Prefer `mode` / `onModeChange`. When candle data is present,
   * morph state is derived from `mode === "line"`. Still accepted as an override.
   */
  lineMode?: boolean;
  lineData?: LiveChartPoint[];
  lineValue?: number;
  onModeChange?: (mode: "line" | "candle") => void;
  onSeriesToggle?: (id: string, visible: boolean) => void;
  seriesToggleCompact?: boolean;

  /**
   * Replace the built-in time-window button bar with custom DOM.
   * Call `setWindow(secs)` to change the visible horizon.
   */
  renderWindows?: ChromeWindowsRender;
  /**
   * Replace the built-in line/candle toggle. Requires `onModeChange` (same as
   * the default toggle) so `setMode` can update controlled `mode`.
   */
  renderModeToggle?: ChromeModeRender;
  /**
   * Replace the built-in multi-series visibility chips.
   */
  renderSeriesToggle?: ChromeSeriesRender;

  /** Accessible name for the chart region. Default `"Live chart"`. */
  ariaLabel?: string;
  /**
   * Enable focusable plot + keyboard scrub + polite live region.
   * Default `true`. Set `false` to opt out. Requires `scrub` for keyboard scrub.
   */
  a11y?: boolean;

  className?: string;
  style?: CSSProperties;
}
