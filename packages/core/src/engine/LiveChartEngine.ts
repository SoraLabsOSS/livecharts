import type { LiveChartPoint, Momentum, ChartLayout, CandlePoint } from '../types'
import { lerp } from '../math/lerp'
import { computeRange } from '../math/range'
import { detectMomentum } from '../math/momentum'
import { interpolateAtTime } from '../math/interpolate'
import { getDpr, applyDpr } from '../canvas/dpr'
import { drawFrame, drawCandleFrame, drawMultiFrame, FADE_EDGE_WIDTH } from '../draw'
import type { MultiSeriesEntry } from '../draw'
import { drawLoading } from '../draw/loading'
import { drawEmpty } from '../draw/empty'
import { createOrderbookState } from '../draw/orderbook'
import { createParticleState } from '../draw/particles'
import { createShakeState } from '../draw'
import type { GridState } from '../draw/grid'
import type { TimeAxisState } from '../draw/timeAxis'
import type { EngineConfig, EngineSeries } from './config'
import type { BadgeEls } from './badge-dom'
import { createBadgeElements, destroyBadgeElements, updateBadgeDOM } from './badge-dom'
import {
  MAX_DELTA_MS,
  SCRUB_LERP_SPEED,
  WINDOW_BUFFER,
  WINDOW_BUFFER_NO_BADGE,
  VALUE_SNAP_THRESHOLD,
  ADAPTIVE_SPEED_BOOST,
  CHART_REVEAL_SPEED,
  CHART_REVEAL_SPEED_FWD,
  PAUSE_PROGRESS_SPEED,
  PAUSE_RESUME_QUIET_MAX_DEBT,
  PAUSE_RESUME_FADE_SPEED,
  LOADING_ALPHA_SPEED,
  SERIES_TOGGLE_SPEED,
  CANDLE_LERP_SPEED,
  CANDLE_WIDTH_TRANS_MS,
  LINE_MORPH_MS,
  CLOSE_LINE_LERP_SPEED,
  LINE_DENSITY_MS,
  LINE_LERP_BASE,
  LINE_ADAPTIVE_BOOST,
  LINE_SNAP_THRESHOLD,
  CANDLE_BUFFER_NO_BADGE,
  computeAdaptiveSpeed,
  updateWindowTransition,
  updateRange,
  updateHoverState,
  computeCandleRange,
  candleAtX,
  updateCandleRange,
  updateCandleWindowTransition,
  type WindowTransState,
} from './helpers'

export interface LiveChartEngineOptions {
  canvas: HTMLCanvasElement
  container: HTMLElement
  valueDisplay?: HTMLElement | null
}

/**
 * Framework-agnostic real-time chart engine. Owns the canvas draw loop, the
 * badge DOM overlay, and all animation state; the host only feeds it config.
 */
export class LiveChartEngine {
  private readonly canvas: HTMLCanvasElement
  private readonly container: HTMLElement
  private readonly valueDisplay: HTMLElement | null

  private config: EngineConfig | null = null
  private configInited = false

  private running = false
  private isSetup = false
  private cleanups: Array<() => void> = []

  // Animation state (persistent across frames, no allocations)
  private displayValue = 0
  private displayValues = new Map<string, number>()
  private seriesAlpha = new Map<string, number>()
  private displayMin = 0
  private displayMax = 0
  private targetMin = 0
  private targetMax = 0
  private rangeInited = false
  private displayWindow = 0
  private windowTransition: WindowTransState = {
    from: 0, to: 0, startMs: 0,
    rangeFromMin: 0, rangeFromMax: 0, rangeToMin: 0, rangeToMax: 0,
  }
  private arrowState = { up: 0, down: 0 }
  private gridState: GridState = { interval: 0, labels: new Map<number, number>() } // labels: key=Math.round(val*1000), value=alpha
  private timeAxisState: TimeAxisState = { labels: new Map<number, { alpha: number; text: string }>() }
  private orderbookState = createOrderbookState()
  private particleState = createParticleState()
  private shakeState = createShakeState()
  private badgeColor = { green: 1 }
  private badgeY: number | null = null // lerped badge Y, null = uninited
  private reducedMotion = false
  private size = { w: 0, h: 0 }
  private ctx: CanvasRenderingContext2D | null = null
  private raf = 0
  private lastFrame = 0
  /** True when the container is not intersecting the viewport. */
  private offscreen = false
  /** performance.now() when draw loop first suspended; 0 when running. */
  private drawSuspendedSince = 0

  // Badge DOM elements
  private badge: BadgeEls | null = null

  // Hover state
  private hoverX: number | null = null
  private scrubAmount = 0 // 0 = not scrubbing, 1 = fully scrubbing
  private lastHover: { x: number; value: number; time: number } | null = null
  private lastHoverEntries: { color: string; label: string; value: number }[] = []

  // Reveal state (loading → chart morph)
  private chartReveal = 0 // 0 = loading/empty, 1 = fully revealed
  /** 1 = normal; dips on within-window resume for a soft fade-in. */
  private resumeFade = 1

  // Pause state
  private pauseProgress = 0 // 0 = playing, 1 = fully paused
  private timeDebt = 0 // accumulated seconds behind real time
  /** Previous frame's paused flag — detects pause→resume edges. */
  private wasPaused = false

  // Data stash for reverse morph (chart → flat line when data disappears)
  private lastData: LiveChartPoint[] = []
  private lastMultiSeries: EngineSeries[] = []
  private frozenNow = 0

  // Pause data snapshot — freeze visible data when pausing to prevent
  // consumer-side pruning from eroding the left edge of the line
  private pausedData: LiveChartPoint[] | null = null
  private pausedMultiData: Map<string, { data: LiveChartPoint[]; value: number }> | null = null

  // Loading ↔ empty crossfade
  private loadingAlpha = 0

  // --- Candle mode state (only used when mode='candle') ---
  private displayCandle: CandlePoint | null = null
  private liveBirthAlpha = 1
  private liveBull = 0.5
  private lineSmoothClose = 0
  private lineSmoothInited = false
  private closeLineSmooth = 0         // smooth close for dashed line — never resets on candle birth
  private closeLineSmoothInited = false
  private lineModeProg = 0
  private lineModeTrans = { startMs: 0, from: 0, to: 0 }
  private lineDensityProg = 0
  private lineDensityTrans = { startMs: 0, from: 0, to: 0 }
  private lineTickSmooth = 0
  private lineTickSmoothInited = false
  private candleWidthTrans = {
    fromWidth: 1,
    toWidth: 1,
    startMs: 0,
    rangeFromMin: 0, rangeFromMax: 0,
    rangeToMin: 0, rangeToMax: 0,
    oldCandles: [] as CandlePoint[],
    oldWidth: 1,
  }
  private prevCandleData = { candles: [] as CandlePoint[], width: 1 }
  private pausedCandles: CandlePoint[] | null = null
  private pausedLive: CandlePoint | null = null
  private pausedLineData: LiveChartPoint[] | null = null
  private pausedLineValue: number | null = null
  private lastCandles: CandlePoint[] = []
  private lastLive: CandlePoint | null = null
  private lastLineDataStash: LiveChartPoint[] = []
  private lastLineValueStash: number | undefined = undefined

  constructor(opts: LiveChartEngineOptions) {
    this.canvas = opts.canvas
    this.container = opts.container
    this.valueDisplay = opts.valueDisplay ?? null
  }

  /** Feed the latest config. Safe to call every frame / every render. */
  setConfig(config: EngineConfig): void {
    const first = !this.configInited
    this.config = config
    if (first) {
      // Seed the state that the hook used to initialize from the first render
      this.configInited = true
      this.displayValue = config.value
      this.displayWindow = config.windowSecs
      this.windowTransition.from = config.windowSecs
      this.windowTransition.to = config.windowSecs
      this.loadingAlpha = config.loading ? 1 : 0
      const cw = config.candleWidth ?? 1
      this.candleWidthTrans.fromWidth = cw
      this.candleWidthTrans.toWidth = cw
      this.candleWidthTrans.oldWidth = cw
      this.prevCandleData.width = cw
    }
  }

  /** Attach DOM listeners (first call only) and start the rAF loop. */
  start(): void {
    if (!this.isSetup) {
      this.setup()
      this.isSetup = true
    }
    if (this.running) return
    this.running = true
    this.raf = requestAnimationFrame(this.draw)
  }

  /** Stop the rAF loop, keeping DOM listeners so `start()` can resume. */
  stop(): void {
    this.running = false
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  /** Stop the loop and tear down every DOM element / listener. */
  destroy(): void {
    this.stop()
    for (let i = this.cleanups.length - 1; i >= 0; i--) {
      this.cleanups[i]()
    }
    this.cleanups = []
    this.isSetup = false
    this.ctx = null
  }

  // ─── Setup ────────────────────────────────────────────────────────────────

  private setup(): void {
    this.setupBadge()
    this.setupResizeObserver()
    this.setupPointerEvents()
    this.setupReducedMotion()
    this.setupVisibility()
    this.setupOffscreen()
  }

  /** Create badge DOM elements (once, appended to container) */
  private setupBadge(): void {
    const badge = createBadgeElements(this.container)
    this.badge = badge
    this.cleanups.push(() => {
      destroyBadgeElements(this.container, badge)
      this.badge = null
    })
  }

  /** ResizeObserver — update size without layout thrashing */
  private setupResizeObserver(): void {
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      this.size = { w: width, h: height }
    })

    ro.observe(this.container)
    // Init size
    const rect = this.container.getBoundingClientRect()
    this.size = { w: rect.width, h: rect.height }

    this.cleanups.push(() => ro.disconnect())
  }

  /** Mouse + touch events for hover/scrub */
  private setupPointerEvents(): void {
    const container = this.container

    const onMove = (e: MouseEvent) => {
      if (!this.config?.scrub) return
      const rect = container.getBoundingClientRect()
      this.hoverX = e.clientX - rect.left
    }
    const onLeave = () => {
      this.hoverX = null
      this.config?.onHover?.(null)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (!this.config?.scrub) return
      if (e.touches.length !== 1) return
      const rect = container.getBoundingClientRect()
      this.hoverX = e.touches[0].clientX - rect.left
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!this.config?.scrub) return
      if (e.touches.length !== 1) return
      e.preventDefault() // prevent scroll while scrubbing
      const rect = container.getBoundingClientRect()
      this.hoverX = e.touches[0].clientX - rect.left
    }
    const onTouchEnd = () => {
      this.hoverX = null
      this.config?.onHover?.(null)
    }

    container.addEventListener('mousemove', onMove)
    container.addEventListener('mouseleave', onLeave)
    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd)
    container.addEventListener('touchcancel', onTouchEnd)

    this.cleanups.push(() => {
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseleave', onLeave)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
      container.removeEventListener('touchcancel', onTouchEnd)
    })
  }

  /** Reduced motion detection */
  private setupReducedMotion(): void {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.reducedMotion = mql.matches
    const onChange = (e: MediaQueryListEvent) => { this.reducedMotion = e.matches }
    mql.addEventListener('change', onChange)
    this.cleanups.push(() => mql.removeEventListener('change', onChange))
  }

  /** Pause/resume on visibility change (don't spin rAF when tab is hidden) */
  private setupVisibility(): void {
    const onVisibility = () => {
      if (!this.running) return
      if (document.hidden) {
        this.markDrawSuspended()
        return
      }
      this.tryResumeDrawLoop()
    }
    document.addEventListener('visibilitychange', onVisibility)
    this.cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility))
  }

  /** Pause/resume when the chart scrolls out of (or into) the viewport. */
  private setupOffscreen(): void {
    if (typeof IntersectionObserver === 'undefined') return

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        this.offscreen = !entry.isIntersecting
        if (!this.running) return
        if (this.isDrawSuspended()) {
          this.markDrawSuspended()
          return
        }
        this.tryResumeDrawLoop()
      },
      { threshold: 0 },
    )
    io.observe(this.container)
    this.cleanups.push(() => io.disconnect())
  }

  private pauseWhenOffscreenEnabled(): boolean {
    return this.config?.pauseWhenOffscreen !== false
  }

  private isDrawSuspended(): boolean {
    return document.hidden || (this.pauseWhenOffscreenEnabled() && this.offscreen)
  }

  /** Record suspend start; cancel any pending frame so we don't clear mid-pause. */
  private markDrawSuspended(): void {
    if (!this.drawSuspendedSince) this.drawSuspendedSince = performance.now()
    if (this.raf) {
      cancelAnimationFrame(this.raf)
      this.raf = 0
    }
  }

  private clearPauseSnapshots(): void {
    this.pausedData = null
    this.pausedMultiData = null
    this.pausedCandles = null
    this.pausedLive = null
    this.pausedLineData = null
    this.pausedLineValue = null
  }

  /** Snap tip / range / candle smoothers to the live config (shared by fade + morph). */
  private snapTipToLive(): void {
    if (!this.config) return
    const cfg = this.config
    this.rangeInited = false
    this.displayValue = cfg.value
    if (cfg.multiSeries) {
      for (const s of cfg.multiSeries) {
        this.displayValues.set(s.id, s.value)
      }
    }
    if (cfg.liveCandle) {
      this.closeLineSmooth = cfg.liveCandle.close
      this.closeLineSmoothInited = true
      this.lineSmoothClose = cfg.liveCandle.close
    }
    if (cfg.lineValue != null) {
      this.lineTickSmooth = cfg.lineValue
      this.lineTickSmoothInited = true
    }
    this.arrowState.up = 0
    this.arrowState.down = 0
  }

  /** Within-window resume: jump to live and fade opacity in (no loading squiggle). */
  private beginResumeFade(): void {
    this.timeDebt = 0
    this.clearPauseSnapshots()
    this.resumeFade = 0
    this.snapTipToLive()
  }

  /** Beyond-window resume: snap to live and morph loading → chart. */
  private beginResumeMorph(): void {
    this.timeDebt = 0
    this.clearPauseSnapshots()
    this.chartReveal = 0
    this.resumeFade = 1
    this.snapTipToLive()
  }

  /** Handle pause→resume edge: fade inside the window, morph when debt exceeds it. */
  private applyPauseResumeEdge(paused: boolean): void {
    if (!paused && this.wasPaused) {
      const windowSecs = this.displayWindow || this.config?.windowSecs || 30
      if (this.timeDebt > windowSecs) {
        this.beginResumeMorph()
      } else if (this.timeDebt > PAUSE_RESUME_QUIET_MAX_DEBT) {
        this.beginResumeFade()
      } else {
        this.timeDebt = 0
        this.clearPauseSnapshots()
      }
    } else if (!paused && this.timeDebt > 0.001) {
      this.timeDebt = 0
    }
    this.wasPaused = paused
  }

  /**
   * After a long tab/offscreen suspend the live tip was frozen while data kept
   * moving. Snap smoothed values so resume doesn't animate a near-vertical
   * stub with jittering momentum arrows at the tip.
   *
   * If the chart is intentionally `paused`, do not snap to live — instead
   * roll the missed wall-clock into `timeDebt` so the freeze tip stays put.
   * (Offscreen stops rAF, so debt would otherwise go stale and draw a long
   * flat line from the snapshot to the live tip.)
   */
  private snapAfterLongSuspend(pausedFor: number): void {
    if (pausedFor <= 250 || !this.config) return
    const cfg = this.config

    if (cfg.paused) {
      this.timeDebt += pausedFor / 1000
      return
    }

    // Always re-seed range — long suspend leaves a stale window that fights
    // the live tip and reads as a jittering spike at the tip.
    this.rangeInited = false
    this.displayValue = cfg.value
    if (cfg.multiSeries) {
      for (const s of cfg.multiSeries) {
        this.displayValues.set(s.id, s.value)
      }
    }
    if (cfg.liveCandle) {
      this.closeLineSmooth = cfg.liveCandle.close
      this.closeLineSmoothInited = true
      this.lineSmoothClose = cfg.liveCandle.close
    }
    if (cfg.lineValue != null) {
      this.lineTickSmooth = cfg.lineValue
      this.lineTickSmoothInited = true
    }
    this.arrowState.up = 0
    this.arrowState.down = 0
  }

  /**
   * Restart the rAF loop after tab/offscreen pause.
   * If we were suspended long enough that the live value left the frozen
   * display range, snap range on the next frame so the stroke doesn't sit
   * on the clip edge (invisible) while min/max slowly catch up.
   */
  private tryResumeDrawLoop(): void {
    if (!this.running || this.isDrawSuspended() || this.raf) return

    if (this.drawSuspendedSince) {
      this.snapAfterLongSuspend(performance.now() - this.drawSuspendedSince)
      this.drawSuspendedSince = 0
    }

    this.lastFrame = 0
    this.raf = requestAnimationFrame(this.draw)
  }

  // ─── Draw loop ────────────────────────────────────────────────────────────

  private draw = (): void => {
    if (this.isDrawSuspended()) {
      this.markDrawSuspended()
      return  // stop the loop; visibility / intersection listeners will restart it
    }

    // Resume path when the previous frame self-stopped without an IO event
    // (e.g. pauseWhenOffscreen flipped false via setConfig).
    if (this.drawSuspendedSince) {
      this.snapAfterLongSuspend(performance.now() - this.drawSuspendedSince)
      this.drawSuspendedSince = 0
    }

    const canvas = this.canvas
    const { w, h } = this.size
    const cfg = this.config
    if (!cfg || w === 0 || h === 0) {
      this.raf = requestAnimationFrame(this.draw)
      return
    }

    const dpr = getDpr()

    // Delta time for frame-rate-independent lerps
    const now_ms = performance.now()
    const dt = this.lastFrame ? Math.min(now_ms - this.lastFrame, MAX_DELTA_MS) : 16.67
    this.lastFrame = now_ms

    // Resize canvas if needed
    const targetW = Math.round(w * dpr)
    const targetH = Math.round(h * dpr)
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW
      canvas.height = targetH
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
    }

    let ctx = this.ctx
    if (!ctx || ctx.canvas !== canvas) {
      ctx = canvas.getContext('2d')
      this.ctx = ctx
    }
    if (!ctx) {
      this.raf = requestAnimationFrame(this.draw)
      return
    }

    applyDpr(ctx, dpr, w, h)

    // Reduced motion: use speed=1 to skip all lerps (instant snap)
    const noMotion = this.reducedMotion

    // --- Mode-specific pause data snapshot ---
    const isCandle = cfg.mode === 'candle'

    if (isCandle) {
      if (cfg.paused && this.pausedCandles === null && (cfg.candles?.length ?? 0) > 0) {
        this.pausedCandles = cfg.candles!.slice()
        this.pausedLive = cfg.liveCandle ?? null
        this.pausedLineData = cfg.lineData?.slice() ?? null
        this.pausedLineValue = cfg.lineValue ?? null
      }
      if (!cfg.paused) {
        this.pausedCandles = null
        this.pausedLive = null
        this.pausedLineData = null
        this.pausedLineValue = null
      }
    } else if (cfg.isMultiSeries && cfg.multiSeries) {
      if (cfg.paused && this.pausedMultiData === null) {
        const snap = new Map<string, { data: LiveChartPoint[]; value: number }>()
        for (const s of cfg.multiSeries) {
          if (s.data.length >= 2) snap.set(s.id, { data: s.data.slice(), value: s.value })
        }
        if (snap.size > 0) this.pausedMultiData = snap
      }
      if (!cfg.paused) {
        this.pausedMultiData = null
      }
    } else {
      if (cfg.paused && this.pausedData === null && cfg.data.length >= 2) {
        this.pausedData = cfg.data.slice()
      }
      if (!cfg.paused) {
        this.pausedData = null
      }
    }

    // --- Pause time management ---
    const pauseTarget = cfg.paused ? 1 : 0
    this.pauseProgress = noMotion
      ? pauseTarget
      : lerp(this.pauseProgress, pauseTarget, PAUSE_PROGRESS_SPEED, dt)
    if (this.pauseProgress < 0.005) this.pauseProgress = 0
    if (this.pauseProgress > 0.995) this.pauseProgress = 1
    const pauseProgress = this.pauseProgress
    const pausedDt = dt * (1 - pauseProgress)

    const realDtSec = dt / 1000
    this.timeDebt += realDtSec * pauseProgress
    this.applyPauseResumeEdge(!!cfg.paused)

    const points = isCandle ? ([] as LiveChartPoint[]) : (this.pausedData ?? cfg.data)
    const effectiveCandles = isCandle
      ? (this.pausedCandles ?? (cfg.candles ?? []))
      : ([] as CandlePoint[])
    const hasMultiData = cfg.isMultiSeries && cfg.multiSeries
      ? cfg.multiSeries.some(s => s.data.length >= 2)
      : false
    const hasData = isCandle ? effectiveCandles.length >= 2 : (hasMultiData || points.length >= 2)
    const pad = cfg.padding
    const chartH = h - pad.top - pad.bottom

    // --- Loading alpha (loading ↔ empty crossfade) ---
    const loadingTarget = cfg.loading ? 1 : 0
    this.loadingAlpha = noMotion
      ? loadingTarget
      : lerp(this.loadingAlpha, loadingTarget, LOADING_ALPHA_SPEED, dt)
    if (this.loadingAlpha < 0.01) this.loadingAlpha = 0
    if (this.loadingAlpha > 0.99) this.loadingAlpha = 1
    const loadingAlpha = this.loadingAlpha

    // --- Chart reveal (loading/empty → data morph) ---
    const revealTarget = (!cfg.loading && hasData) ? 1 : 0
    this.chartReveal = noMotion
      ? revealTarget
      : lerp(this.chartReveal, revealTarget,
          revealTarget === 1 ? CHART_REVEAL_SPEED_FWD : CHART_REVEAL_SPEED, dt)
    if (Math.abs(this.chartReveal - revealTarget) < 0.005) {
      this.chartReveal = revealTarget
    }
    const chartReveal = this.chartReveal

    this.resumeFade = noMotion
      ? 1
      : lerp(this.resumeFade, 1, PAUSE_RESUME_FADE_SPEED, dt)
    if (this.resumeFade > 0.995) this.resumeFade = 1
    const resumeFade = this.resumeFade

    // Reset range when reveal fully collapses — guarantees a fresh snap
    // (not a slow lerp from stale values) when data reappears.
    if (chartReveal < 0.01) {
      this.rangeInited = false
    }

    // Data stash for reverse morph — keep drawing chart while it morphs back
    // to the squiggly shape (identical to loading/empty line at reveal=0)
    let useStash: boolean
    let useMultiStash = false
    if (isCandle) {
      useStash = !hasData && chartReveal > 0.005 && this.lastCandles.length > 0
      // Candle stash updated inside candle pipeline after computing visible
    } else {
      // Multi-series stash
      useMultiStash = !hasData && chartReveal > 0.005 && this.lastMultiSeries.length > 0
      if (hasMultiData && cfg.multiSeries) {
        this.lastMultiSeries = cfg.multiSeries.map(s => ({
          id: s.id, data: s.data.slice(), value: s.value, palette: s.palette, label: s.label,
        }))
      }
      // Clear multi stash when single-series data arrives
      if (hasData && !cfg.isMultiSeries) this.lastMultiSeries = []

      useStash = !useMultiStash && !hasData && chartReveal > 0.005 && this.lastData.length >= 2
      if (hasData && !cfg.isMultiSeries) this.lastData = points
    }

    // Update lineModeProg even during early return — prevents the
    // transition from freezing when the user toggles lineMode while
    // in loading or empty state. Without this, lineModeProg stays at
    // its pre-loading value and causes an accent-colored line flash
    // when data arrives (BUG #3).
    if (isCandle) {
      const lmt = this.lineModeTrans
      const lineModeTarget = cfg.lineMode ? 1 : 0
      if (lmt.to !== lineModeTarget) {
        lmt.from = this.lineModeProg
        lmt.to = lineModeTarget
        lmt.startMs = now_ms
      }
      if (lmt.startMs > 0) {
        const elapsed = now_ms - lmt.startMs
        const t = Math.min(elapsed / LINE_MORPH_MS, 1)
        this.lineModeProg = lmt.from + (lmt.to - lmt.from) * ((1 - Math.cos(t * Math.PI)) / 2)
        if (t >= 1) { this.lineModeProg = lmt.to; lmt.startMs = 0 }
      } else {
        this.lineModeProg = lmt.to
      }
    }

    if (!hasData && !useStash && !useMultiStash) {
      // No chart pipeline — draw loading or empty as the sole visual.
      // Grey loading line for candle mode and multi-series (no single accent color)
      const loadingColor = (isCandle || cfg.isMultiSeries || this.lastMultiSeries.length > 0)
        ? cfg.palette.gridLabel
        : undefined
      if (loadingAlpha > 0.01) {
        drawLoading(ctx, w, h, pad, cfg.palette, now_ms, loadingAlpha, loadingColor)
      }
      if ((1 - loadingAlpha) > 0.01) {
        drawEmpty(ctx, w, h, pad, cfg.palette, 1 - loadingAlpha, now_ms, false, cfg.emptyText)
      }
      // Left-edge fade
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      const fadeGrad = ctx.createLinearGradient(pad.left, 0, pad.left + FADE_EDGE_WIDTH, 0)
      fadeGrad.addColorStop(0, 'rgba(0, 0, 0, 1)')
      fadeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = fadeGrad
      ctx.fillRect(0, 0, pad.left + FADE_EDGE_WIDTH, h)
      ctx.restore()

      if (this.badge) this.badge.container.style.display = 'none'
      this.raf = requestAnimationFrame(this.draw)
      return
    }

    if (isCandle) {
      // ═══════════════════════════════════════════════════════
      // CANDLE MODE PIPELINE
      // ═══════════════════════════════════════════════════════

      // Badge is never visible in pure candle mode (only during line morph),
      // so always use the smaller buffer to avoid dead space on the right.
      const candleBuffer = CANDLE_BUFFER_NO_BADGE

      // Frozen now — prevent candles from scrolling during reverse morph
      if (hasData) this.frozenNow = Date.now() / 1000 - this.timeDebt
      const now = (hasData || chartReveal < 0.005)
        ? Date.now() / 1000 - this.timeDebt
        : this.frozenNow
      const rawLive = this.pausedCandles ? (this.pausedLive ?? undefined) : cfg.liveCandle
      let effectiveLineData = this.pausedLineData ?? cfg.lineData
      let effectiveLineValue = this.pausedLineValue ?? cfg.lineValue
      // Stash tick data for reverse morph — keeps tick resolution during morphback
      if (hasData && effectiveLineData && effectiveLineData.length > 0) {
        this.lastLineDataStash = effectiveLineData
        this.lastLineValueStash = effectiveLineValue
      }
      if (useStash && this.lastLineDataStash.length > 0) {
        effectiveLineData = this.lastLineDataStash
        effectiveLineValue = this.lastLineValueStash
      }
      const candleWidthSecs = cfg.candleWidth ?? 1

      // --- Candle width morph transition ---
      const cwt = this.candleWidthTrans
      let morphT = -1
      let displayCandleWidth: number
      if (cwt.startMs > 0) {
        const elapsed = now_ms - cwt.startMs
        const t = Math.min(elapsed / CANDLE_WIDTH_TRANS_MS, 1)
        morphT = (1 - Math.cos(t * Math.PI)) / 2
        displayCandleWidth = Math.exp(
          Math.log(cwt.fromWidth) + (Math.log(cwt.toWidth) - Math.log(cwt.fromWidth)) * morphT,
        )
        if (t >= 1) { displayCandleWidth = cwt.toWidth; cwt.startMs = 0; morphT = -1 }
      } else {
        displayCandleWidth = cwt.toWidth
      }
      if (candleWidthSecs !== cwt.toWidth) {
        cwt.oldCandles = this.prevCandleData.candles
        cwt.oldWidth = this.prevCandleData.width
        cwt.fromWidth = displayCandleWidth
        cwt.toWidth = candleWidthSecs
        cwt.startMs = now_ms
        morphT = 0
        cwt.rangeFromMin = this.displayMin
        cwt.rangeFromMax = this.displayMax
        const curWindow = this.displayWindow
        const re = now + curWindow * candleBuffer
        const le = re - curWindow
        const targetVis: CandlePoint[] = []
        for (const c of effectiveCandles) {
          if (c.time + candleWidthSecs >= le && c.time <= re) targetVis.push(c)
        }
        if (rawLive) targetVis.push(rawLive)
        if (targetVis.length > 0) {
          const tr = computeCandleRange(targetVis)
          cwt.rangeToMin = tr.min
          cwt.rangeToMax = tr.max
        } else {
          cwt.rangeToMin = this.displayMin
          cwt.rangeToMax = this.displayMax
        }
      }
      this.prevCandleData = { candles: cfg.candles ?? [], width: candleWidthSecs }

      // lineModeProg is updated before the early return (see above).
      const lineModeProg = this.lineModeProg

      // --- Line density transition ---
      const ldt = this.lineDensityTrans
      const hasTickData = effectiveLineData && effectiveLineData.length > 0
      const densityTarget = (cfg.lineMode && lineModeProg >= 0.3 && hasTickData) ? 1 : 0
      if (ldt.to !== densityTarget) {
        ldt.from = this.lineDensityProg
        ldt.to = densityTarget
        ldt.startMs = now_ms
      }
      let lineDensityProg: number
      if (ldt.startMs > 0) {
        const elapsed = now_ms - ldt.startMs
        const t = Math.min(elapsed / LINE_DENSITY_MS, 1)
        lineDensityProg = ldt.from + (ldt.to - ldt.from) * (1 - (1 - t) * (1 - t))
        if (t >= 1) { lineDensityProg = ldt.to; ldt.startMs = 0 }
      } else {
        lineDensityProg = ldt.to
      }
      this.lineDensityProg = lineDensityProg

      // --- Window transition ---
      const transition = this.windowTransition
      const windowResult = updateCandleWindowTransition(
        cfg.windowSecs, transition, this.displayWindow,
        this.displayMin, this.displayMax,
        now_ms, now, effectiveCandles, rawLive, candleWidthSecs, candleBuffer,
      )
      this.displayWindow = windowResult.windowSecs
      const windowSecs = windowResult.windowSecs
      const windowTransProgress = windowResult.windowTransProgress
      const isWindowTransitioning = transition.startMs > 0

      const rightEdge = now + windowSecs * candleBuffer
      const leftEdge = rightEdge - windowSecs

      // --- Live candle OHLC lerp ---
      let smoothLive: CandlePoint | undefined
      if (rawLive) {
        const prev = this.displayCandle
        if (!prev || prev.time !== rawLive.time) {
          this.displayCandle = {
            time: rawLive.time, open: rawLive.open,
            high: rawLive.open, low: rawLive.open, close: rawLive.open,
          }
          this.liveBirthAlpha = 0
        } else {
          const dc = this.displayCandle!
          dc.open = lerp(dc.open, rawLive.open, CANDLE_LERP_SPEED, pausedDt)
          dc.high = lerp(dc.high, rawLive.high, CANDLE_LERP_SPEED, pausedDt)
          dc.low = lerp(dc.low, rawLive.low, CANDLE_LERP_SPEED, pausedDt)
          dc.close = lerp(dc.close, rawLive.close, CANDLE_LERP_SPEED, pausedDt)
        }
        this.liveBirthAlpha = lerp(this.liveBirthAlpha, 1, 0.2, pausedDt)
        if (this.liveBirthAlpha > 0.99) this.liveBirthAlpha = 1
        const dc = this.displayCandle!
        const bullTarget = dc.close >= dc.open ? 1 : 0
        this.liveBull = lerp(this.liveBull, bullTarget, 0.12, pausedDt)
        if (this.liveBull > 0.99) this.liveBull = 1
        if (this.liveBull < 0.01) this.liveBull = 0
        smoothLive = dc
      } else {
        this.displayCandle = null
        this.liveBirthAlpha = 1
        this.liveBull = 0.5
      }

      // --- Smooth close for dashed price line ---
      // Tracks rawLive.close at candle-body speed but never resets on candle
      // birth, so the dashed line doesn't jump when a new candle starts.
      if (rawLive) {
        if (!this.closeLineSmoothInited) {
          this.closeLineSmooth = rawLive.close
          this.closeLineSmoothInited = true
        } else {
          this.closeLineSmooth = lerp(this.closeLineSmooth, rawLive.close, CLOSE_LINE_LERP_SPEED, pausedDt)
          const gap = Math.abs(this.closeLineSmooth - rawLive.close)
          const range = this.displayMax - this.displayMin || 1
          if (gap < range * 0.0005) this.closeLineSmooth = rawLive.close
        }
      } else if (!useStash) {
        this.closeLineSmoothInited = false
      }

      // --- Smooth close for line mode ---
      if (rawLive) {
        if (!this.lineSmoothInited) {
          this.lineSmoothClose = rawLive.close
          this.lineSmoothInited = true
        } else {
          const valGap = Math.abs(rawLive.close - this.lineSmoothClose)
          const prevRange = this.displayMax - this.displayMin || 1
          const gapRatio = Math.min(valGap / prevRange, 1)
          const adaptiveSpeed = LINE_LERP_BASE + (1 - gapRatio) * LINE_ADAPTIVE_BOOST
          this.lineSmoothClose = lerp(this.lineSmoothClose, rawLive.close, adaptiveSpeed, pausedDt)
          if (valGap < prevRange * LINE_SNAP_THRESHOLD) this.lineSmoothClose = rawLive.close
        }
      } else if (!useStash) {
        // Only reset when not using stash — during reverse morph,
        // freeze the smooth value (matches line mode's displayValue freeze)
        this.lineSmoothInited = false
      }

      // --- Smooth tick value for density transition ---
      if (effectiveLineValue !== undefined && hasTickData) {
        if (!this.lineTickSmoothInited) {
          this.lineTickSmooth = effectiveLineValue
          this.lineTickSmoothInited = true
        } else {
          const valGap = Math.abs(effectiveLineValue - this.lineTickSmooth)
          const prevRange = this.displayMax - this.displayMin || 1
          const gapRatio = Math.min(valGap / prevRange, 1)
          const adaptiveSpeed = LINE_LERP_BASE + (1 - gapRatio) * LINE_ADAPTIVE_BOOST
          this.lineTickSmooth = lerp(this.lineTickSmooth, effectiveLineValue, adaptiveSpeed, pausedDt)
          if (valGap < prevRange * LINE_SNAP_THRESHOLD) this.lineTickSmooth = effectiveLineValue
        }
      } else if (!useStash) {
        this.lineTickSmoothInited = false
      }

      // --- Build visible candles ---
      const visible: CandlePoint[] = []
      for (const c of effectiveCandles) {
        if (c.time + candleWidthSecs >= leftEdge && c.time <= rightEdge) visible.push(c)
      }
      if (smoothLive && smoothLive.time + displayCandleWidth >= leftEdge && smoothLive.time <= rightEdge) {
        visible.push(smoothLive)
      }
      let oldVisible: CandlePoint[] = []
      if (morphT >= 0 && cwt.oldCandles.length > 0) {
        for (const c of cwt.oldCandles) {
          if (c.time + cwt.oldWidth >= leftEdge && c.time <= rightEdge) oldVisible.push(c)
        }
      }

      // Stash visible candles for reverse morph
      if (hasData) {
        this.lastCandles = visible
        this.lastLive = smoothLive ?? null
      }
      const effectiveVisible = useStash ? this.lastCandles : visible
      const effectiveLive = useStash ? (this.lastLive ?? undefined) : smoothLive

      // --- Range computation ---
      // Always use full OHLC range regardless of line mode progress.
      // The close-only and tick-level ranges are tighter (no wicks),
      // so blending between them during morphs shifts the Y axis and
      // causes visible grid label drift + line position jumps.
      // Using one consistent OHLC range means zero range change during
      // the morph — the line gets slightly more Y margin in line mode
      // (room for wicks it doesn't use) but that's an acceptable trade-off.
      const chartW = w - pad.left - pad.right
      const computed = effectiveVisible.length > 0
        ? computeCandleRange(effectiveVisible)
        : { min: this.displayMin, max: this.displayMax }

      const rangeResult = updateCandleRange(
        computed, this.rangeInited,
        this.displayMin, this.displayMax,
        isWindowTransitioning, windowTransProgress, transition,
        chartH, pausedDt,
      )
      if (morphT >= 0) {
        rangeResult.displayMin = cwt.rangeFromMin + (cwt.rangeToMin - cwt.rangeFromMin) * morphT
        rangeResult.displayMax = cwt.rangeFromMax + (cwt.rangeToMax - cwt.rangeFromMax) * morphT
        rangeResult.minVal = rangeResult.displayMin
        rangeResult.maxVal = rangeResult.displayMax
        rangeResult.valRange = (rangeResult.displayMax - rangeResult.displayMin) || 0.001
      }
      this.rangeInited = rangeResult.rangeInited
      this.displayMin = rangeResult.displayMin
      this.displayMax = rangeResult.displayMax
      const { minVal, maxVal, valRange } = rangeResult

      const layout: ChartLayout = {
        w, h, pad,
        chartW, chartH,
        leftEdge, rightEdge,
        minVal, maxVal, valRange,
        toX: (t: number) => pad.left + ((t - leftEdge) / (rightEdge - leftEdge)) * chartW,
        toY: (v: number) => pad.top + (1 - (v - minVal) / valRange) * chartH,
      }

      // --- Hover + scrub ---
      const hoverPx = this.hoverX
      let hoveredCandle: CandlePoint | null = null
      let isActiveHover = false
      if (hoverPx !== null && hoverPx >= pad.left && hoverPx <= w - pad.right) {
        hoveredCandle = candleAtX(effectiveVisible, hoverPx, displayCandleWidth, layout)
        if (hoveredCandle) isActiveHover = true
      }
      const scrubTarget = isActiveHover ? 1 : 0
      this.scrubAmount = lerp(this.scrubAmount, scrubTarget, 0.12, dt)
      if (this.scrubAmount < 0.01) this.scrubAmount = 0
      if (this.scrubAmount > 0.99) this.scrubAmount = 1
      const scrubAmount = this.scrubAmount

      let drawHoverX = hoverPx
      let drawHoverTime = 0
      let drawHoverCandle: CandlePoint | null = hoveredCandle
      if (!isActiveHover && scrubAmount > 0 && this.lastHover) {
        drawHoverX = this.lastHover.x
        drawHoverTime = this.lastHover.time
        drawHoverCandle = candleAtX(effectiveVisible, this.lastHover.x, displayCandleWidth, layout)
      } else if (isActiveHover && hoverPx !== null) {
        drawHoverTime = layout.leftEdge + ((hoverPx - pad.left) / chartW) * (layout.rightEdge - layout.leftEdge)
        this.lastHover = { x: hoverPx, value: hoveredCandle?.close ?? 0, time: drawHoverTime }
      }

      let drawCandles = effectiveVisible
      let drawOldCandles = oldVisible
      let drawLive = effectiveLive

      // Line mode: blend live close toward smooth close
      if (lineModeProg > 0.01 && drawLive && this.lineSmoothInited) {
        const blended = drawLive.close + (this.lineSmoothClose - drawLive.close) * lineModeProg
        drawLive = { ...drawLive, close: blended }
        const li = drawCandles.length - 1
        if (li >= 0 && drawCandles[li].time === drawLive.time) {
          drawCandles = drawCandles.slice()
          drawCandles[li] = { ...drawCandles[li], close: blended }
        }
      }

      // Line mode OHLC collapse
      if (lineModeProg > 0.01 && lineModeProg < 0.99) {
        const collapseOHLC = (c: CandlePoint): CandlePoint => {
          const inv = 1 - lineModeProg
          return {
            time: c.time,
            open: c.close + (c.open - c.close) * inv,
            high: c.close + (c.high - c.close) * inv,
            low: c.close + (c.low - c.close) * inv,
            close: c.close,
          }
        }
        drawCandles = drawCandles.map(collapseOHLC)
        if (drawOldCandles.length > 0) drawOldCandles = drawOldCandles.map(collapseOHLC)
        if (drawLive) drawLive = collapseOHLC(drawLive)
      }

      // Build lineVisible for drawLine — value-space points that drawLine
      // converts to screen coords with its own morphY/alpha/color logic.
      // Use tick-level resolution whenever the line is visible (lineModeProg > 0.05),
      // not just when lineDensityProg > 0.01.  The density transition finishes
      // 150ms before the line fades out; without this, lineVisible abruptly drops
      // from ~300 smooth points to ~5 stepped candle-close points while the line
      // is still at ~30% opacity, causing a visible shape jump.
      let lineVisible: LiveChartPoint[]
      let lineSmoothValue: number
      if (effectiveLineData && effectiveLineData.length > 0
        && (lineDensityProg > 0.01 || lineModeProg > 0.05)) {
        // Density transition: blend candle-close values toward tick values
        const closeRefs: { t: number; v: number }[] = []
        for (const c of drawCandles) {
          closeRefs.push({ t: c.time + displayCandleWidth / 2, v: c.close })
        }
        if (drawLive) closeRefs.push({ t: now, v: drawLive.close })

        lineVisible = []
        let refIdx = 0
        for (const pt of effectiveLineData) {
          if (pt.time < leftEdge || pt.time > rightEdge) continue
          while (refIdx < closeRefs.length - 2 && closeRefs[refIdx + 1].t < pt.time) refIdx++
          let interpClose: number
          if (closeRefs.length === 0) {
            interpClose = pt.value
          } else if (closeRefs.length === 1 || pt.time <= closeRefs[0].t) {
            interpClose = closeRefs[0].v
          } else if (refIdx >= closeRefs.length - 1) {
            interpClose = closeRefs[closeRefs.length - 1].v
          } else {
            const a = closeRefs[refIdx]
            const b = closeRefs[refIdx + 1]
            const span = b.t - a.t
            const frac = span > 0 ? Math.max(0, Math.min(1, (pt.time - a.t) / span)) : 0
            interpClose = a.v + (b.v - a.v) * frac
          }
          const blended = interpClose + (pt.value - interpClose) * lineDensityProg
          lineVisible.push({ time: pt.time, value: blended })
        }

        const smoothTick = this.lineTickSmoothInited
          ? this.lineTickSmooth
          : (effectiveLineValue ?? effectiveLineData[effectiveLineData.length - 1].value)
        // No explicit live tip — drawLine appends one at toX(now) using lineSmoothValue
        lineSmoothValue = this.lineSmoothClose
          + (smoothTick - this.lineSmoothClose) * lineDensityProg
      } else {
        // Candle-close resolution — no live tip; drawLine appends one at toX(now)
        lineVisible = drawCandles.map(c => ({
          time: c.time + displayCandleWidth / 2,
          value: c.close,
        }))
        lineSmoothValue = this.lineSmoothInited
          ? this.lineSmoothClose
          : (drawLive?.close ?? drawCandles[drawCandles.length - 1]?.close ?? 0)
      }

      // Pad lineVisible to span full chart width during reveal morph.
      // Without this, data that doesn't fill the window creates a partial-width
      // line that pops when it hands off to the full-width loading squiggly.
      if (chartReveal < 1 && lineVisible.length >= 2) {
        const firstTime = lineVisible[0].time
        const windowSpan = rightEdge - leftEdge
        if (firstTime - leftEdge > windowSpan * 0.05) {
          const firstVal = lineVisible[0].value
          const step = windowSpan / 32
          const padded: LiveChartPoint[] = []
          for (let t = leftEdge; t < firstTime - step * 0.5; t += step) {
            padded.push({ time: t, value: firstVal })
          }
          lineVisible = [...padded, ...lineVisible]
        }
      }

      // --- Draw ---
      ctx.save()
      if (resumeFade < 1) ctx.globalAlpha *= resumeFade
      drawCandleFrame(ctx, layout, cfg.palette, {
        candles: drawCandles,
        displayCandleWidth,
        oldCandles: drawOldCandles,
        oldWidth: cwt.oldWidth,
        morphT,
        liveCandle: drawLive,
        closePriceCandle: this.closeLineSmoothInited && rawLive
          ? { ...rawLive, close: this.closeLineSmooth }
          : rawLive,
        liveTime: effectiveLive?.time ?? -1,
        liveBirthAlpha: this.liveBirthAlpha,
        liveBullBlend: this.liveBull,
        lineModeProg,
        chartReveal,
        now_ms,
        now,
        pauseProgress,
        showGrid: cfg.showGrid,
        scrubAmount,
        hoverX: drawHoverX,
        hoverValue: drawHoverCandle?.close ?? null,
        hoverTime: drawHoverTime,
        hoveredCandle: drawHoverCandle,
        formatValue: cfg.formatValue,
        formatTime: cfg.formatTime,
        gridState: this.gridState,
        timeAxisState: this.timeAxisState,
        dt: pausedDt,
        targetWindowSecs: cfg.windowSecs,
        tooltipY: cfg.tooltipY,
        tooltipOutline: cfg.tooltipOutline,
        lineVisible,
        lineSmoothValue,
        emptyText: cfg.emptyText,
        loadingAlpha,
        // Show empty overlay when not loading AND loadingAlpha has fully
        // decayed. This prevents the gradient gap from flashing during
        // loading→live (where loadingAlpha starts at ~1), while still
        // allowing smooth fade-out during empty→live (loadingAlpha is 0).
        showEmptyOverlay: !(cfg.loading ?? false) && loadingAlpha < 0.01,
      })
      ctx.restore()

      // Badge in candle mode — only when in line mode (lineModeProg > 0.5)
      if (this.badge) {
        if (lineModeProg > 0.5 && cfg.showBadge) {
          const momentum = detectMomentum(lineVisible)
          this.badgeY = updateBadgeDOM(
            this.badge, cfg, lineSmoothValue, layout, momentum,
            this.badgeY, this.badgeColor,
            isWindowTransitioning, noMotion, ctx, pausedDt,
            chartReveal,
          )
          // Fade badge in/out with lineModeProg (0.5→1 maps to 0→1)
          const badgeFade = (lineModeProg - 0.5) * 2
          if (this.badge.container.style.display !== 'none') {
            const base = this.badge.container.style.opacity
              ? parseFloat(this.badge.container.style.opacity) : 1
            this.badge.container.style.opacity = String(
              base * badgeFade * (1 - pauseProgress),
            )
          }
        } else {
          this.badge.container.style.display = 'none'
        }
      }

    } else if ((cfg.isMultiSeries && cfg.multiSeries && cfg.multiSeries.length > 0) || useMultiStash) {
    // ═══════════════════════════════════════════════════════
    // MULTI-SERIES LINE MODE PIPELINE
    // ═══════════════════════════════════════════════════════

    const effectiveMultiSeries = useMultiStash ? this.lastMultiSeries : cfg.multiSeries!

    // Reserve just enough right-side space so endpoint labels don't overlap
    // grid value text (which starts at w - pad.right + 8). Labels are drawn
    // at lineEnd + 6, so overlap = labelW + 6 - 8 = labelW - 2.
    // Scale with chartReveal so layout doesn't shift during loading collapse.
    let labelReserve = 0
    if (effectiveMultiSeries.some(s => s.label)) {
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
      let maxLabelW = 0
      for (const s of effectiveMultiSeries) {
        if (s.label) {
          const lw = ctx.measureText(s.label).width
          if (lw > maxLabelW) maxLabelW = lw
        }
      }
      labelReserve = Math.max(0, maxLabelW - 2) * chartReveal
    }

    const chartW = w - pad.left - pad.right - labelReserve
    const buffer = cfg.showBadge ? WINDOW_BUFFER : WINDOW_BUFFER_NO_BADGE

    // Clean stale entries from displayValues (series that were removed)
    if (!useMultiStash) {
      const currentIds = new Set(effectiveMultiSeries.map(s => s.id))
      for (const key of this.displayValues.keys()) {
        if (!currentIds.has(key)) this.displayValues.delete(key)
      }
    }

    // Use first series data for window transition seeding
    const firstSeries = effectiveMultiSeries[0]
    const transition = this.windowTransition
    if (hasData) this.frozenNow = Date.now() / 1000 - this.timeDebt
    const now = useMultiStash ? this.frozenNow : Date.now() / 1000 - this.timeDebt

    // Per-series smooth values (freeze when using stash)
    const smoothValues = new Map<string, number>()
    for (const s of effectiveMultiSeries) {
      let dv = this.displayValues.get(s.id)
      if (dv === undefined) dv = s.value
      if (!useMultiStash) {
        const adaptiveSpeed = computeAdaptiveSpeed(
          s.value, dv,
          this.displayMin, this.displayMax,
          cfg.lerpSpeed, noMotion,
        )
        dv = lerp(dv, s.value, adaptiveSpeed, pausedDt)
        const prevRange = this.displayMax - this.displayMin || 1
        if (Math.abs(dv - s.value) < prevRange * VALUE_SNAP_THRESHOLD) dv = s.value
        this.displayValues.set(s.id, dv)
      }
      smoothValues.set(s.id, dv)
    }

    // Per-series visibility alpha (lerp toward 0 for hidden, 1 for visible)
    const hiddenIds = cfg.hiddenSeriesIds
    const seriesAlphas = this.seriesAlpha
    for (const s of effectiveMultiSeries) {
      let alpha = seriesAlphas.get(s.id) ?? 1
      const target = hiddenIds?.has(s.id) ? 0 : 1
      alpha = noMotion ? target : lerp(alpha, target, SERIES_TOGGLE_SPEED, pausedDt)
      if (alpha < 0.01) alpha = 0
      if (alpha > 0.99) alpha = 1
      seriesAlphas.set(s.id, alpha)
    }

    // Window transition — seed with all series data for accurate range
    const firstData = this.pausedMultiData?.get(firstSeries.id)?.data ?? firstSeries.data
    const windowResult = updateWindowTransition(
      cfg, transition, this.displayWindow,
      this.displayMin, this.displayMax,
      noMotion, now_ms, now, firstData, smoothValues.get(firstSeries.id) ?? firstSeries.value, buffer,
    )
    // Override range target with union of ALL series (not just first)
    if (transition.startMs > 0 && effectiveMultiSeries.length > 1) {
      const targetRightEdge = now + cfg.windowSecs * buffer
      const targetLeftEdge = targetRightEdge - cfg.windowSecs
      let unionMin = Infinity
      let unionMax = -Infinity
      for (const s of effectiveMultiSeries) {
        const sData = this.pausedMultiData?.get(s.id)?.data ?? s.data
        const sv = smoothValues.get(s.id) ?? s.value
        const targetVisible: LiveChartPoint[] = []
        for (const p of sData) {
          if (p.time >= targetLeftEdge - 2 && p.time <= targetRightEdge) targetVisible.push(p)
        }
        if (targetVisible.length > 0) {
          const range = computeRange(targetVisible, sv, cfg.referenceLine?.value, cfg.exaggerate)
          if (range.min < unionMin) unionMin = range.min
          if (range.max > unionMax) unionMax = range.max
        }
      }
      if (isFinite(unionMin) && isFinite(unionMax)) {
        transition.rangeToMin = unionMin
        transition.rangeToMax = unionMax
      }
    }
    this.displayWindow = windowResult.windowSecs
    const windowSecs = windowResult.windowSecs
    const windowTransProgress = windowResult.windowTransProgress
    const isWindowTransitioning = transition.startMs > 0

    const rightEdge = now + windowSecs * buffer
    const leftEdge = rightEdge - windowSecs
    const filterRight = rightEdge - (rightEdge - now) * pauseProgress

    // Build per-series visible arrays and compute global range
    // Use paused snapshots when available to prevent left-edge erosion
    // Exclude hidden series (alpha < 0.01) from range so Y-axis adjusts
    const seriesEntries: MultiSeriesEntry[] = []
    let globalMin = Infinity
    let globalMax = -Infinity
    for (const s of effectiveMultiSeries) {
      const snap = this.pausedMultiData?.get(s.id)
      const seriesData = snap?.data ?? s.data
      const visible: LiveChartPoint[] = []
      for (const p of seriesData) {
        if (p.time >= leftEdge - 2 && p.time <= filterRight) visible.push(p)
      }
      const sv = smoothValues.get(s.id) ?? s.value
      const alpha = seriesAlphas.get(s.id) ?? 1
      if (visible.length >= 2) {
        // Only include in range if series is at least partially visible
        if (alpha > 0.01) {
          const range = computeRange(visible, sv, cfg.referenceLine?.value, cfg.exaggerate)
          if (range.min < globalMin) globalMin = range.min
          if (range.max > globalMax) globalMax = range.max
        }
        // Always push to entries (drawMultiFrame skips via alpha)
        seriesEntries.push({ visible, smoothValue: sv, palette: s.palette, label: s.label, alpha })
      }
    }

    if (seriesEntries.length === 0) {
      // No visible data — draw loading/empty fallback (matching single-series behavior)
      // Grey loading line for multi-series (no single accent color to use)
      if (loadingAlpha > 0.01) {
        drawLoading(ctx, w, h, pad, cfg.palette, now_ms, loadingAlpha, cfg.palette.gridLabel)
      }
      if ((1 - loadingAlpha) > 0.01) {
        drawEmpty(ctx, w, h, pad, cfg.palette, 1 - loadingAlpha, now_ms, false, cfg.emptyText)
      }
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      const fadeGrad = ctx.createLinearGradient(pad.left, 0, pad.left + FADE_EDGE_WIDTH, 0)
      fadeGrad.addColorStop(0, 'rgba(0, 0, 0, 1)')
      fadeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = fadeGrad
      ctx.fillRect(0, 0, pad.left + FADE_EDGE_WIDTH, h)
      ctx.restore()
      if (this.badge) this.badge.container.style.display = 'none'
      this.raf = requestAnimationFrame(this.draw)
      return
    }

    // Smooth global range
    const computedRange = { min: isFinite(globalMin) ? globalMin : 0, max: isFinite(globalMax) ? globalMax : 1 }
    const adaptiveSpeed = cfg.lerpSpeed + ADAPTIVE_SPEED_BOOST * 0.5
    const rangeResult = updateRange(
      computedRange, this.rangeInited,
      this.targetMin, this.targetMax,
      this.displayMin, this.displayMax,
      isWindowTransitioning, windowTransProgress, transition,
      adaptiveSpeed, chartH, pausedDt,
    )
    this.rangeInited = rangeResult.rangeInited
    this.targetMin = rangeResult.targetMin
    this.targetMax = rangeResult.targetMax
    this.displayMin = rangeResult.displayMin
    this.displayMax = rangeResult.displayMax
    const { minVal, maxVal, valRange } = rangeResult

    const layout: ChartLayout = {
      w, h, pad,
      chartW, chartH,
      leftEdge, rightEdge,
      minVal, maxVal, valRange,
      toX: (t: number) => pad.left + ((t - leftEdge) / (rightEdge - leftEdge)) * chartW,
      toY: (v: number) => pad.top + (1 - (v - minVal) / valRange) * chartH,
    }

    // Hover — interpolate value at hover time for each series
    const hoverPx = this.hoverX
    let drawHoverX: number | null = null
    let drawHoverTime: number | null = null
    let isActiveHover = false
    let hoverEntries: { color: string; label: string; value: number }[] = []

    if (hoverPx !== null && hoverPx >= pad.left && hoverPx <= w - pad.right) {
      const maxHoverX = layout.toX(now)
      const clampedX = Math.min(hoverPx, maxHoverX)
      const t = leftEdge + ((clampedX - pad.left) / chartW) * (rightEdge - leftEdge)
      drawHoverX = clampedX
      drawHoverTime = t
      isActiveHover = true

      for (const entry of seriesEntries) {
        // Skip hidden series from crosshair tooltip
        if ((entry.alpha ?? 1) < 0.5) continue
        const v = interpolateAtTime(entry.visible, t)
        if (v !== null) {
          hoverEntries.push({ color: entry.palette.line, label: entry.label ?? '', value: v })
        }
      }
      this.lastHover = { x: clampedX, value: hoverEntries[0]?.value ?? 0, time: t }
      this.lastHoverEntries = hoverEntries
      cfg.onHover?.({ time: t, value: hoverEntries[0]?.value ?? 0, x: clampedX, y: layout.toY(hoverEntries[0]?.value ?? 0) })
    }

    // Scrub amount
    const scrubTarget = isActiveHover ? 1 : 0
    if (noMotion) {
      this.scrubAmount = scrubTarget
    } else {
      this.scrubAmount += (scrubTarget - this.scrubAmount) * SCRUB_LERP_SPEED
      if (this.scrubAmount < 0.01) this.scrubAmount = 0
      if (this.scrubAmount > 0.99) this.scrubAmount = 1
    }

    // Fade-out: use last known hover position + cached entries
    if (!isActiveHover && this.scrubAmount > 0 && this.lastHover) {
      drawHoverX = this.lastHover.x
      drawHoverTime = this.lastHover.time
      hoverEntries = this.lastHoverEntries
    }

    // Draw multi-series frame
    ctx.save()
    if (resumeFade < 1) ctx.globalAlpha *= resumeFade
    drawMultiFrame(ctx, layout, {
      series: seriesEntries,
      now,
      showGrid: cfg.showGrid,
      showPulse: cfg.showPulse,
      referenceLine: cfg.referenceLine,
      hoverX: drawHoverX,
      hoverTime: drawHoverTime,
      hoverEntries,
      scrubAmount: this.scrubAmount,
      windowSecs,
      formatValue: cfg.formatValue,
      formatTime: cfg.formatTime,
      gridState: this.gridState,
      timeAxisState: this.timeAxisState,
      dt,
      targetWindowSecs: cfg.windowSecs,
      tooltipY: cfg.tooltipY,
      tooltipOutline: cfg.tooltipOutline,
      chartReveal,
      pauseProgress,
      now_ms,
      primaryPalette: cfg.palette,
    })
    ctx.restore()

    // During reverse morph (chart → loading/empty), overlay the empty text
    // as chartReveal drops — identical to single-series behavior
    const bgAlpha = 1 - chartReveal
    if (bgAlpha > 0.01 && revealTarget === 0 && !cfg.loading) {
      const bgEmptyAlpha = (1 - loadingAlpha) * bgAlpha
      if (bgEmptyAlpha > 0.01) {
        drawEmpty(ctx, w, h, pad, cfg.palette, bgEmptyAlpha, now_ms, true, cfg.emptyText)
      }
    }

    // Hide badge in multi-series mode
    if (this.badge) this.badge.container.style.display = 'none'

    } else {
    // ═══════════════════════════════════════════════════════
    // LINE MODE PIPELINE (existing)
    // ═══════════════════════════════════════════════════════

    const effectivePoints = useStash ? this.lastData : points

    const chartW = w - pad.left - pad.right

    // Dynamic buffer: when badge is off, use a smaller buffer so the dot
    // sits closer to the right edge. When momentum arrows + badge are both
    // on, ensure enough gap for the arrows to fit.
    const baseBuffer = cfg.showBadge ? WINDOW_BUFFER : WINDOW_BUFFER_NO_BADGE
    const needsArrowRoom = cfg.showMomentum && cfg.showBadge
    const buffer = needsArrowRoom
      ? Math.max(baseBuffer, 37 / Math.max(chartW, 1))
      : baseBuffer

    // Window transition
    const transition = this.windowTransition
    if (hasData) this.frozenNow = Date.now() / 1000 - this.timeDebt
    const now = useStash ? this.frozenNow : Date.now() / 1000 - this.timeDebt

    // Adaptive speed + smooth value (freeze lerp when using stashed data)
    const adaptiveSpeed = computeAdaptiveSpeed(
      cfg.value, this.displayValue,
      this.displayMin, this.displayMax,
      cfg.lerpSpeed, noMotion,
    )
    let smoothValue = this.displayValue
    if (!useStash) {
      this.displayValue = lerp(this.displayValue, cfg.value, adaptiveSpeed, pausedDt)
      // Skip snap when pausing — cfg.value keeps changing from the consumer,
      // so the snap would cause visible jumps in a supposedly frozen chart
      if (pauseProgress < 0.5) {
        const prevRange = this.displayMax - this.displayMin || 1
        if (Math.abs(this.displayValue - cfg.value) < prevRange * VALUE_SNAP_THRESHOLD) {
          this.displayValue = cfg.value
        }
      }
      smoothValue = this.displayValue
    }

    const windowResult = updateWindowTransition(
      cfg, transition, this.displayWindow,
      this.displayMin, this.displayMax,
      noMotion, now_ms, now, effectivePoints, smoothValue, buffer,
    )
    this.displayWindow = windowResult.windowSecs
    const windowSecs = windowResult.windowSecs
    const windowTransProgress = windowResult.windowTransProgress

    const rightEdge = now + windowSecs * buffer
    const leftEdge = rightEdge - windowSecs

    // Cap at `now` while pausing so new samples can't appear past the tip.
    const filterRight = Math.min(
      now,
      rightEdge - (rightEdge - now) * pauseProgress,
    )
    const visible: LiveChartPoint[] = []
    for (const p of effectivePoints) {
      if (p.time >= leftEdge - 2 && p.time <= filterRight) {
        visible.push(p)
      }
    }

    if (visible.length < 2) {
      if (this.badge) this.badge.container.style.display = 'none'
      this.raf = requestAnimationFrame(this.draw)
      return
    }

    // Compute + smooth Y range
    const computedRange = computeRange(visible, smoothValue, cfg.referenceLine?.value, cfg.exaggerate)
    const isWindowTransitioning = transition.startMs > 0
    const rangeResult = updateRange(
      computedRange, this.rangeInited,
      this.targetMin, this.targetMax,
      this.displayMin, this.displayMax,
      isWindowTransitioning, windowTransProgress, transition,
      adaptiveSpeed, chartH, pausedDt,
    )
    this.rangeInited = rangeResult.rangeInited
    this.targetMin = rangeResult.targetMin
    this.targetMax = rangeResult.targetMax
    this.displayMin = rangeResult.displayMin
    this.displayMax = rangeResult.displayMax
    const { minVal, maxVal, valRange } = rangeResult

    const layout: ChartLayout = {
      w, h, pad,
      chartW, chartH,
      leftEdge, rightEdge,
      minVal, maxVal, valRange,
      toX: (t: number) => pad.left + ((t - leftEdge) / (rightEdge - leftEdge)) * chartW,
      toY: (v: number) => pad.top + (1 - (v - minVal) / valRange) * chartH,
    }

    // Momentum
    const momentum: Momentum = cfg.momentumOverride ?? detectMomentum(visible)

    // Hover + scrub
    const hoverResult = updateHoverState(
      this.hoverX, pad, w, layout, now, visible,
      this.scrubAmount, this.lastHover,
      cfg, noMotion, leftEdge, rightEdge, chartW, dt,
    )
    this.scrubAmount = hoverResult.scrubAmount
    this.lastHover = hoverResult.lastHover
    const { hoverX: drawHoverX, hoverValue: drawHoverValue, hoverTime: drawHoverTime } = hoverResult

    // Compute swing magnitude for particles (recent velocity / visible range)
    const lookback = Math.min(5, visible.length - 1)
    const recentDelta = lookback > 0
      ? Math.abs(visible[visible.length - 1].value - visible[visible.length - 1 - lookback].value)
      : 0
    const swingMagnitude = valRange > 0 ? Math.min(recentDelta / valRange, 1) : 0

    // Draw canvas content (everything except badge)
    ctx.save()
    if (resumeFade < 1) ctx.globalAlpha *= resumeFade
    drawFrame(ctx, layout, cfg.palette, {
      visible,
      smoothValue,
      now,
      momentum,
      arrowState: this.arrowState,
      showGrid: cfg.showGrid,
      showMomentum: cfg.showMomentum,
      showPulse: cfg.showPulse,
      showFill: cfg.showFill,
      referenceLine: cfg.referenceLine,
      hoverX: drawHoverX,
      hoverValue: drawHoverValue,
      hoverTime: drawHoverTime,
      scrubAmount: this.scrubAmount,
      windowSecs,
      formatValue: cfg.formatValue,
      formatTime: cfg.formatTime,
      gridState: this.gridState,
      timeAxisState: this.timeAxisState,
      dt,
      targetWindowSecs: cfg.windowSecs,
      tooltipY: cfg.tooltipY,
      tooltipOutline: cfg.tooltipOutline,
      orderbookData: cfg.orderbookData,
      orderbookState: cfg.orderbookData ? this.orderbookState : undefined,
      particleState: cfg.degenOptions ? this.particleState : undefined,
      particleOptions: cfg.degenOptions,
      swingMagnitude,
      shakeState: cfg.degenOptions ? this.shakeState : undefined,
      chartReveal,
      pauseProgress,
      now_ms,
    })
    ctx.restore()

    // During morph (chart ↔ empty), overlay the gradient gap + text on
    // top of the morphing chart line. skipLine=true avoids double-drawing
    // the squiggly. The gap fades in smoothly as chartReveal drops.
    const bgAlpha = 1 - chartReveal
    if (bgAlpha > 0.01 && revealTarget === 0 && !cfg.loading) {
      const bgEmptyAlpha = (1 - loadingAlpha) * bgAlpha
      if (bgEmptyAlpha > 0.01) {
        drawEmpty(ctx, w, h, pad, cfg.palette, bgEmptyAlpha, now_ms, true, cfg.emptyText)
      }
    }

    // Badge (DOM element, floats above container)
    const badge = this.badge
    if (badge) {
      this.badgeY = updateBadgeDOM(
        badge, cfg, smoothValue, layout, momentum,
        this.badgeY, this.badgeColor,
        isWindowTransitioning, noMotion, ctx, pausedDt,
        chartReveal,
      )
      // Hide badge during pause — fully fades out as pauseProgress → 1
      if (pauseProgress > 0.01 && badge.container.style.display !== 'none') {
        const base = badge.container.style.opacity ? parseFloat(badge.container.style.opacity) : 1
        badge.container.style.opacity = String(base * (1 - pauseProgress))
      }
    }

    // --- Live value display (DOM element, written to directly — no re-renders) ---
    const valEl = cfg.valueDisplay ?? this.valueDisplay
    if (valEl) {
      // When momentum colour is on, strip sign — colour already communicates direction
      const displayVal = cfg.valueMomentumColor ? Math.abs(smoothValue) : smoothValue
      valEl.textContent = cfg.formatValue(displayVal)
      if (cfg.valueMomentumColor) {
        const mc = momentum === 'up' ? '#22c55e' : momentum === 'down' ? '#ef4444' : ''
        if (mc) valEl.style.color = mc
        else valEl.style.removeProperty('color')
      }
    }

    } // end else (line mode)

    this.raf = requestAnimationFrame(this.draw)
  }
}
