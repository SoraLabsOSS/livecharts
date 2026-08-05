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
  lineMode?: boolean;
  lineData?: LiveChartPoint[];
  lineValue?: number;
  onModeChange?: (mode: "line" | "candle") => void;
  onSeriesToggle?: (id: string, visible: boolean) => void;
  seriesToggleCompact?: boolean;

  className?: string;
  style?: CSSProperties;
}
