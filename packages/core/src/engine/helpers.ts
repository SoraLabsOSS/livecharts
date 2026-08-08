import type { LiveChartPoint, ChartLayout, Padding, CandlePoint } from '../types'
import { lerp } from '../math/lerp'
import { easeInOutUi } from '../math/easing'
import { computeRange } from '../math/range'
import { interpolateAtTime } from '../math/interpolate'
import type { EngineConfig } from './config'

// --- Constants ---
export const MAX_DELTA_MS = 50
export const SCRUB_LERP_SPEED = 0.12
export const BADGE_WIDTH_LERP = 0.15
export const BADGE_Y_LERP = 0.35
export const BADGE_Y_LERP_TRANSITIONING = 0.5
export const MOMENTUM_COLOR_LERP = 0.12
/** Window zoom morph — UI budget <300ms; ease-in-out (on-screen move). */
export const WINDOW_TRANSITION_MS = 280
export const WINDOW_BUFFER = 0.05
export const WINDOW_BUFFER_NO_BADGE = 0.015
export const VALUE_SNAP_THRESHOLD = 0.001
export const ADAPTIVE_SPEED_BOOST = 0.2
export const MOMENTUM_GREEN: [number, number, number] = [34, 197, 94]
export const MOMENTUM_RED: [number, number, number] = [239, 68, 68]
/** Reveal exit (data → loading) — keep snappy. */
export const CHART_REVEAL_SPEED = 0.16
/** Reveal enter (loading → data) — ease-out feel: start fast. */
export const CHART_REVEAL_SPEED_FWD = 0.18
export const PAUSE_PROGRESS_SPEED = 0.12
/** Below this debt, resume is a quiet unfreeze (no fade/morph flash). */
export const PAUSE_RESUME_QUIET_MAX_DEBT = 0.15
/** Opacity ease when resuming inside the visible window. */
export const PAUSE_RESUME_FADE_SPEED = 0.18
export const LOADING_ALPHA_SPEED = 0.16
/** Series chip fade — tens/day; keep short. */
export const SERIES_TOGGLE_SPEED = 0.18

// --- Candle-specific constants ---
export const CANDLE_LERP_SPEED = 0.25
/** Candle width morph — under 300ms UI budget. */
export const CANDLE_WIDTH_TRANS_MS = 220
/** Line ↔ candle morph — occasional state change, still <300ms. */
export const LINE_MORPH_MS = 280
export const CLOSE_LINE_LERP_SPEED = 0.25  // matches candle body speed
/** Overlay line density fade — ease-out entrance. */
export const LINE_DENSITY_MS = 240
export const LINE_LERP_BASE = 0.08
export const LINE_ADAPTIVE_BOOST = 0.2
export const LINE_SNAP_THRESHOLD = 0.001
export const RANGE_LERP_SPEED = 0.15
export const RANGE_ADAPTIVE_BOOST = 0.2
export const CANDLE_BUFFER = 0.05
export const CANDLE_BUFFER_NO_BADGE = 0.015

// --- Pure computation helpers, called inside the draw loop ---

export interface WindowTransState {
  from: number; to: number; startMs: number
  rangeFromMin: number; rangeFromMax: number; rangeToMin: number; rangeToMax: number
}

/** Lerp display value with adaptive speed — slow for big jumps, fast for small ticks. */
export function computeAdaptiveSpeed(
  value: number,
  displayValue: number,
  displayMin: number,
  displayMax: number,
  lerpSpeed: number,
  noMotion: boolean,
): number {
  const valGap = Math.abs(value - displayValue)
  const prevRange = displayMax - displayMin || 1
  const gapRatio = Math.min(valGap / prevRange, 1)
  return noMotion ? 1 : lerpSpeed + (1 - gapRatio) * ADAPTIVE_SPEED_BOOST
}

/** Update window transition state, returning current display window and transition progress. */
export function updateWindowTransition(
  cfg: EngineConfig,
  wt: WindowTransState,
  displayWindow: number,
  displayMin: number,
  displayMax: number,
  noMotion: boolean,
  now_ms: number,
  now: number,
  points: LiveChartPoint[],
  smoothValue: number,
  buffer: number,
): { windowSecs: number; windowTransProgress: number } {
  if (wt.to !== cfg.windowSecs) {
    wt.from = displayWindow
    wt.to = cfg.windowSecs
    wt.startMs = now_ms
    wt.rangeFromMin = displayMin
    wt.rangeFromMax = displayMax
    const targetRightEdge = now + cfg.windowSecs * buffer
    const targetLeftEdge = targetRightEdge - cfg.windowSecs
    const targetVisible: LiveChartPoint[] = []
    for (const p of points) {
      if (p.time >= targetLeftEdge - 2 && p.time <= targetRightEdge) {
        targetVisible.push(p)
      }
    }
    if (targetVisible.length > 0) {
      const targetRange = computeRange(targetVisible, smoothValue, cfg.referenceLine?.value, cfg.exaggerate)
      wt.rangeToMin = targetRange.min
      wt.rangeToMax = targetRange.max
    }
  }

  let windowTransProgress = 0
  let resultWindow: number
  if (noMotion || wt.startMs === 0) {
    resultWindow = cfg.windowSecs
  } else {
    const elapsed = now_ms - wt.startMs
    const duration = WINDOW_TRANSITION_MS
    const t = Math.min(elapsed / duration, 1)
    const eased = easeInOutUi(t)
    windowTransProgress = eased
    const logFrom = Math.log(wt.from)
    const logTo = Math.log(wt.to)
    resultWindow = Math.exp(logFrom + (logTo - logFrom) * eased)
    if (t >= 1) {
      resultWindow = cfg.windowSecs
      wt.startMs = 0
      windowTransProgress = 0
    }
  }

  return { windowSecs: resultWindow, windowTransProgress }
}

/** Smooth Y range with lerp. During window transitions, interpolates between pre-computed ranges. */
export function updateRange(
  computedRange: { min: number; max: number },
  rangeInited: boolean,
  targetMin: number,
  targetMax: number,
  displayMin: number,
  displayMax: number,
  isTransitioning: boolean,
  windowTransProgress: number,
  wt: WindowTransState,
  adaptiveSpeed: number,
  chartH: number,
  dt: number,
): { minVal: number; maxVal: number; valRange: number; targetMin: number; targetMax: number; displayMin: number; displayMax: number; rangeInited: boolean } {
  if (!rangeInited) {
    return {
      minVal: computedRange.min, maxVal: computedRange.max,
      valRange: (computedRange.max - computedRange.min) || 0.001,
      targetMin: computedRange.min, targetMax: computedRange.max,
      displayMin: computedRange.min, displayMax: computedRange.max,
      rangeInited: true,
    }
  }

  if (isTransitioning) {
    displayMin = wt.rangeFromMin + (wt.rangeToMin - wt.rangeFromMin) * windowTransProgress
    displayMax = wt.rangeFromMax + (wt.rangeToMax - wt.rangeFromMax) * windowTransProgress
    targetMin = computedRange.min
    targetMax = computedRange.max
  } else {
    const curRange = displayMax - displayMin
    targetMin = computedRange.min
    targetMax = computedRange.max
    displayMin = lerp(displayMin, targetMin, adaptiveSpeed, dt)
    displayMax = lerp(displayMax, targetMax, adaptiveSpeed, dt)
    const pxThreshold = 0.5 * curRange / chartH || 0.001
    if (Math.abs(displayMin - targetMin) < pxThreshold) displayMin = targetMin
    if (Math.abs(displayMax - targetMax) < pxThreshold) displayMax = targetMax
  }

  return {
    minVal: displayMin, maxVal: displayMax,
    valRange: (displayMax - displayMin) || 0.001,
    targetMin, targetMax, displayMin, displayMax,
    rangeInited: true,
  }
}

/** Compute hover position, interpolated value, and scrub amount. */
export function updateHoverState(
  hoverPixelX: number | null,
  pad: Required<Padding>,
  w: number,
  layout: ChartLayout,
  now: number,
  visible: LiveChartPoint[],
  scrubAmount: number,
  lastHover: { x: number; value: number; time: number } | null,
  cfg: EngineConfig,
  noMotion: boolean,
  leftEdge: number,
  rightEdge: number,
  chartW: number,
  dt: number,
): {
  hoverX: number | null; hoverValue: number | null; hoverTime: number | null
  scrubAmount: number; isActiveHover: boolean
  lastHover: { x: number; value: number; time: number } | null
} {
  let hoverValue: number | null = null
  let hoverTime: number | null = null
  let hoverChartX: number | null = null
  let isActiveHover = false

  if (hoverPixelX !== null && hoverPixelX >= pad.left && hoverPixelX <= w - pad.right) {
    const maxHoverX = layout.toX(now)
    const clampedX = Math.min(hoverPixelX, maxHoverX)
    const t = leftEdge + ((clampedX - pad.left) / chartW) * (rightEdge - leftEdge)
    const v = interpolateAtTime(visible, t)
    if (v !== null) {
      hoverValue = v
      hoverTime = t
      hoverChartX = clampedX
      isActiveHover = true
      lastHover = { x: clampedX, value: v, time: t }
      cfg.onHover?.({ time: t, value: v, x: clampedX, y: layout.toY(v) })
    }
  }

  // Lerp scrub amount
  const scrubTarget = isActiveHover ? 1 : 0
  if (noMotion) {
    scrubAmount = scrubTarget
  } else {
    scrubAmount += (scrubTarget - scrubAmount) * SCRUB_LERP_SPEED
    if (scrubAmount < 0.01) scrubAmount = 0
    if (scrubAmount > 0.99) scrubAmount = 1
  }

  // Use last known position during fade-out
  let drawHoverX = hoverChartX
  let drawHoverValue = hoverValue
  let drawHoverTime = hoverTime
  if (!isActiveHover && scrubAmount > 0 && lastHover) {
    drawHoverX = lastHover.x
    drawHoverValue = lastHover.value
    drawHoverTime = lastHover.time
  }

  return {
    hoverX: drawHoverX, hoverValue: drawHoverValue, hoverTime: drawHoverTime,
    scrubAmount, isActiveHover, lastHover,
  }
}

// --- Candle-specific helper functions ---

export function computeCandleRange(
  candles: CandlePoint[],
): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (const c of candles) {
    if (c.low < min) min = c.low
    if (c.high > max) max = c.high
  }
  if (!isFinite(min) || !isFinite(max)) return { min: 99, max: 101 }
  const range = max - min
  const margin = range * 0.12
  const minRange = range * 0.1 || 0.4
  if (range < minRange) {
    const mid = (min + max) / 2
    return { min: mid - minRange / 2, max: mid + minRange / 2 }
  }
  return { min: min - margin, max: max + margin }
}

export function candleAtX(
  candles: CandlePoint[],
  hoverX: number,
  candleWidth: number,
  layout: ChartLayout,
): CandlePoint | null {
  const time = layout.leftEdge + ((hoverX - layout.pad.left) / layout.chartW) * (layout.rightEdge - layout.leftEdge)
  let lo = 0
  let hi = candles.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const c = candles[mid]
    if (time < c.time) hi = mid - 1
    else if (time >= c.time + candleWidth) lo = mid + 1
    else return c
  }
  return null
}

/** Smooth Y range for candle mode — adaptive speed, no target tracking. */
export function updateCandleRange(
  computedRange: { min: number; max: number },
  rangeInited: boolean,
  displayMin: number,
  displayMax: number,
  isTransitioning: boolean,
  windowTransProgress: number,
  wt: { rangeFromMin: number; rangeFromMax: number; rangeToMin: number; rangeToMax: number },
  chartH: number,
  dt: number,
): { minVal: number; maxVal: number; valRange: number; displayMin: number; displayMax: number; rangeInited: boolean } {
  if (!rangeInited) {
    return {
      minVal: computedRange.min, maxVal: computedRange.max,
      valRange: (computedRange.max - computedRange.min) || 0.001,
      displayMin: computedRange.min, displayMax: computedRange.max,
      rangeInited: true,
    }
  }

  if (isTransitioning) {
    displayMin = wt.rangeFromMin + (wt.rangeToMin - wt.rangeFromMin) * windowTransProgress
    displayMax = wt.rangeFromMax + (wt.rangeToMax - wt.rangeFromMax) * windowTransProgress
  } else {
    const curRange = displayMax - displayMin || 1
    const gapMin = Math.abs(displayMin - computedRange.min)
    const gapMax = Math.abs(displayMax - computedRange.max)
    const gapRatio = Math.min((gapMin + gapMax) / curRange, 1)
    const speed = RANGE_LERP_SPEED + (1 - gapRatio) * RANGE_ADAPTIVE_BOOST

    displayMin = lerp(displayMin, computedRange.min, speed, dt)
    displayMax = lerp(displayMax, computedRange.max, speed, dt)
    const pxThreshold = 0.5 * curRange / chartH || 0.001
    if (Math.abs(displayMin - computedRange.min) < pxThreshold) displayMin = computedRange.min
    if (Math.abs(displayMax - computedRange.max) < pxThreshold) displayMax = computedRange.max
  }

  return {
    minVal: displayMin, maxVal: displayMax,
    valRange: (displayMax - displayMin) || 0.001,
    displayMin, displayMax,
    rangeInited: true,
  }
}

/** Candle window transition — uses candle data instead of line points. */
export function updateCandleWindowTransition(
  targetWindowSecs: number,
  wt: { from: number; to: number; startMs: number; rangeFromMin: number; rangeFromMax: number; rangeToMin: number; rangeToMax: number },
  displayWindow: number,
  displayMin: number,
  displayMax: number,
  now_ms: number,
  now: number,
  candles: CandlePoint[],
  liveCandle: CandlePoint | undefined,
  candleWidth: number,
  buffer: number,
): { windowSecs: number; windowTransProgress: number } {
  if (wt.to !== targetWindowSecs) {
    wt.from = displayWindow
    wt.to = targetWindowSecs
    wt.startMs = now_ms
    wt.rangeFromMin = displayMin
    wt.rangeFromMax = displayMax
    const targetRightEdge = now + targetWindowSecs * buffer
    const targetLeftEdge = targetRightEdge - targetWindowSecs
    const targetVisible: CandlePoint[] = []
    for (const c of candles) {
      if (c.time + candleWidth >= targetLeftEdge && c.time <= targetRightEdge) {
        targetVisible.push(c)
      }
    }
    if (liveCandle && liveCandle.time + candleWidth >= targetLeftEdge && liveCandle.time <= targetRightEdge) {
      targetVisible.push(liveCandle)
    }
    if (targetVisible.length > 0) {
      const tr = computeCandleRange(targetVisible)
      wt.rangeToMin = tr.min
      wt.rangeToMax = tr.max
    }
  }

  let windowTransProgress = 0
  let resultWindow: number
  if (wt.startMs === 0) {
    resultWindow = targetWindowSecs
  } else {
    const elapsed = now_ms - wt.startMs
    const t = Math.min(elapsed / WINDOW_TRANSITION_MS, 1)
    const eased = easeInOutUi(t)
    windowTransProgress = eased
    const logFrom = Math.log(wt.from)
    const logTo = Math.log(wt.to)
    resultWindow = Math.exp(logFrom + (logTo - logFrom) * eased)
    if (t >= 1) {
      resultWindow = targetWindowSecs
      wt.startMs = 0
      windowTransProgress = 0
    }
  }

  return { windowSecs: resultWindow, windowTransProgress }
}
