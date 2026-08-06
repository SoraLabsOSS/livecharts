import type {
  BadgeVariant,
  CandlePoint,
  DegenOptions,
  HoverPoint,
  LiveChartPoint,
  LiveChartSeries,
  Momentum,
  OrderbookData,
  Padding,
  ReferenceLine,
  ThemeMode,
  WindowOption,
  WindowStyle,
} from "@livecharts/core";
import type { StyleValue } from "vue";

export interface LiveChartProps {
  badge?: boolean;
  badgeTail?: boolean;
  badgeVariant?: BadgeVariant;
  candles?: CandlePoint[];
  candleWidth?: number;
  class?: string;
  color?: string;
  cursor?: string;
  data: LiveChartPoint[];
  degen?: boolean | DegenOptions;
  emptyText?: string;
  exaggerate?: boolean;
  fill?: boolean;
  formatTime?: (t: number) => string;
  formatValue?: (v: number) => string;
  grid?: boolean;
  lerpSpeed?: number;
  lineData?: LiveChartPoint[];
  /**
   * @deprecated Prefer `mode` / `@mode-change`. When candle data is present,
   * morph state is derived from `mode === "line"`. Still accepted as an override.
   */
  lineMode?: boolean;
  lineValue?: number;
  lineWidth?: number;
  liveCandle?: CandlePoint;
  loading?: boolean;
  mode?: "line" | "candle";
  momentum?: boolean | Momentum;
  orderbook?: OrderbookData;
  padding?: Padding;
  paused?: boolean;
  /** Stop the rAF loop while the chart is offscreen. Default true. */
  pauseWhenOffscreen?: boolean;
  pulse?: boolean;
  referenceLine?: ReferenceLine;
  scrub?: boolean;
  /** Multi-series mode — when provided, overrides data/value/color */
  series?: LiveChartSeries[];
  seriesToggleCompact?: boolean;
  showValue?: boolean;
  style?: StyleValue;
  theme?: ThemeMode;
  tooltipOutline?: boolean;
  tooltipY?: number;
  value: number;
  valueMomentumColor?: boolean;
  /** Visible time horizon in seconds */
  window?: number;
  windowStyle?: WindowStyle;
  windows?: WindowOption[];
}

/** Events emitted by `<LiveChart />` (use `@window-change`, etc.). */
export interface LiveChartEmits {
  hover: [point: HoverPoint | null];
  modeChange: [mode: "line" | "candle"];
  seriesToggle: [id: string, visible: boolean];
  windowChange: [secs: number];
}
