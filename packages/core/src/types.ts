export interface LiveChartPoint {
  time: number; // unix seconds
  value: number;
}

export type Momentum = "up" | "down" | "flat";
export type ThemeMode = "light" | "dark";
export type WindowStyle = "default" | "rounded" | "text";
export type BadgeVariant = "default" | "minimal";

export interface ReferenceLine {
  value: number;
  label?: string;
}

export interface HoverPoint {
  time: number;
  value: number;
  x: number;
  y: number;
}

export interface Padding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface WindowOption {
  label: string;
  secs: number;
}

export interface OrderbookData {
  bids: [number, number][]; // [price, size][]
  asks: [number, number][]; // [price, size][]
}

export interface DegenOptions {
  /** Multiplier for particle count and size (default 1) */
  scale?: number;
  /** Show particles on down-momentum swings (default false) */
  downMomentum?: boolean;
}

export interface LiveChartSeries {
  id: string;
  data: LiveChartPoint[];
  value: number;
  color: string;
  label?: string;
}

export interface CandlePoint {
  time: number; // unix seconds — candle open time
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LiveChartPalette {
  // Line
  line: string;
  lineWidth: number;

  // Fill gradient
  fillTop: string;
  fillBottom: string;

  // Grid
  gridLine: string;
  gridLabel: string;

  // Dot
  dotUp: string;
  dotDown: string;
  dotFlat: string;
  glowUp: string;
  glowDown: string;
  glowFlat: string;

  // Badge
  badgeOuterBg: string;
  badgeOuterShadow: string;
  badgeBg: string;
  badgeText: string;

  // Dash line
  dashLine: string;

  // Reference line
  refLine: string;
  refLabel: string;

  // Time axis
  timeLabel: string;

  // Crosshair
  crosshairLine: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipBorder: string;

  // Background (for color fading — labels fade toward bg instead of alpha)
  bgRgb: [number, number, number];

  // Fonts
  labelFont: string;
  valueFont: string;
  badgeFont: string;
}

export interface ChartLayout {
  w: number;
  h: number;
  pad: Required<Padding>;
  chartW: number;
  chartH: number;
  leftEdge: number;
  rightEdge: number;
  minVal: number;
  maxVal: number;
  valRange: number;
  toX: (t: number) => number;
  toY: (v: number) => number;
}
