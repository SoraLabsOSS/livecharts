import type {
  LiveChartPoint,
  LiveChartPalette,
  Momentum,
  ReferenceLine,
  HoverPoint,
  Padding,
  OrderbookData,
  DegenOptions,
  BadgeVariant,
  CandlePoint,
} from '../types'

/** One series of a multi-series chart. */
export interface EngineSeries {
  id: string
  data: LiveChartPoint[]
  value: number
  palette: LiveChartPalette
  label?: string
}

export interface EngineConfig {
  data: LiveChartPoint[]
  value: number
  palette: LiveChartPalette
  windowSecs: number
  lerpSpeed: number
  showGrid: boolean
  showBadge: boolean
  showMomentum: boolean
  momentumOverride?: Momentum
  showFill: boolean
  referenceLine?: ReferenceLine
  formatValue: (v: number) => string
  formatTime: (t: number) => string
  padding: Required<Padding>
  onHover?: (point: HoverPoint | null) => void
  showPulse: boolean
  scrub: boolean
  exaggerate: boolean
  degenOptions?: DegenOptions
  badgeTail: boolean
  badgeVariant: BadgeVariant
  tooltipY: number
  tooltipOutline: boolean
  valueMomentumColor: boolean
  /** Element that receives the live value text, written to directly each frame. */
  valueDisplay?: HTMLElement | null
  orderbookData?: OrderbookData
  loading?: boolean
  paused?: boolean
  emptyText?: string
  /** Stop the rAF loop while the chart container is offscreen. Default true. */
  pauseWhenOffscreen?: boolean

  // Candlestick mode
  mode: 'line' | 'candle'
  candles?: CandlePoint[]
  candleWidth?: number
  liveCandle?: CandlePoint
  lineMode?: boolean
  lineData?: LiveChartPoint[]
  lineValue?: number

  // Multi-series mode
  multiSeries?: EngineSeries[]
  isMultiSeries?: boolean
  hiddenSeriesIds?: Set<string>
}
