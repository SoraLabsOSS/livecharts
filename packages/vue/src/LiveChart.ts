import type { DegenOptions, Momentum } from "@livecharts/core";
import {
  resolveSeriesPalettes,
  resolveTheme,
  SERIES_COLORS,
} from "@livecharts/core";
import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  nextTick,
  onBeforeUpdate,
  onMounted,
  onUpdated,
  type PropType,
  ref,
  type VNode,
  watch,
} from "vue";
import type { LiveChartProps } from "./types";
import { useLiveChartEngine } from "./useLiveChartEngine";

const defaultFormatValue = (v: number) => v.toFixed(2);

const defaultFormatTime = (t: number) => {
  const d = new Date(t * 1000);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ss = d.getSeconds().toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};

type IndicatorStyle = { left: number; width: number };

export const LiveChart = defineComponent({
  emits: ["windowChange", "modeChange", "seriesToggle", "hover"],
  name: "LiveChart",
  props: {
    badge: { default: true, type: Boolean },
    badgeTail: { default: true, type: Boolean },
    badgeVariant: {
      default: "default",
      type: String as PropType<LiveChartProps["badgeVariant"]>,
    },
    candles: Array as PropType<LiveChartProps["candles"]>,
    candleWidth: Number as PropType<LiveChartProps["candleWidth"]>,
    class: String,
    color: { default: "#3b82f6", type: String },
    cursor: { default: "crosshair", type: String },
    data: { required: true, type: Array as PropType<LiveChartProps["data"]> },
    degen: [Boolean, Object] as PropType<LiveChartProps["degen"]>,
    emptyText: String as PropType<LiveChartProps["emptyText"]>,
    exaggerate: { default: false, type: Boolean },
    fill: { default: true, type: Boolean },
    formatTime: {
      default: defaultFormatTime,
      type: Function as PropType<LiveChartProps["formatTime"]>,
    },
    formatValue: {
      default: defaultFormatValue,
      type: Function as PropType<LiveChartProps["formatValue"]>,
    },
    grid: { default: true, type: Boolean },
    lerpSpeed: { default: 0.08, type: Number },
    lineData: Array as PropType<LiveChartProps["lineData"]>,
    lineMode: {
      default: undefined,
      type: Boolean as PropType<LiveChartProps["lineMode"]>,
    },
    lineValue: Number as PropType<LiveChartProps["lineValue"]>,
    lineWidth: Number as PropType<LiveChartProps["lineWidth"]>,
    liveCandle: Object as PropType<LiveChartProps["liveCandle"]>,
    loading: { default: false, type: Boolean },
    mode: {
      default: "line",
      type: String as PropType<LiveChartProps["mode"]>,
    },
    momentum: {
      default: true,
      type: [Boolean, String] as PropType<LiveChartProps["momentum"]>,
    },
    orderbook: Object as PropType<LiveChartProps["orderbook"]>,
    padding: Object as PropType<LiveChartProps["padding"]>,
    paused: { default: false, type: Boolean },
    pauseWhenOffscreen: { default: true, type: Boolean },
    pulse: { default: true, type: Boolean },
    referenceLine: Object as PropType<LiveChartProps["referenceLine"]>,
    scrub: { default: true, type: Boolean },
    series: Array as PropType<LiveChartProps["series"]>,
    seriesToggleCompact: { default: false, type: Boolean },
    showValue: { default: false, type: Boolean },
    style: [String, Object, Array] as PropType<LiveChartProps["style"]>,
    theme: {
      default: "dark",
      type: String as PropType<LiveChartProps["theme"]>,
    },
    tooltipOutline: { default: true, type: Boolean },
    tooltipY: { default: 14, type: Number },
    value: { required: true, type: Number },
    valueMomentumColor: { default: false, type: Boolean },
    window: { default: 30, type: Number },
    windowStyle: String as PropType<LiveChartProps["windowStyle"]>,
    windows: Array as PropType<LiveChartProps["windows"]>,
  },
  setup(props, { emit }) {
    const instance = getCurrentInstance();
    /** True when parent listens with `@mode-change` (declared emit). */
    const hasModeChangeListener = () => !!instance?.vnode.props?.onModeChange;

    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const containerRef = ref<HTMLDivElement | null>(null);
    const valueDisplayRef = ref<HTMLSpanElement | null>(null);
    const windowBarRef = ref<HTMLDivElement | null>(null);
    const modeBarRef = ref<HTMLDivElement | null>(null);
    const windowBtnRefs = new Map<number, HTMLButtonElement>();
    const modeBtnRefs = new Map<string, HTMLButtonElement>();

    const indicatorStyle = ref<IndicatorStyle | null>(null);
    const modeIndicatorStyle = ref<IndicatorStyle | null>(null);
    const hiddenSeries = ref(new Set<string>());
    const lastSeriesProp = ref(props.series);

    onBeforeUpdate(() => {
      if (props.series && props.series.length > 0) {
        lastSeriesProp.value = props.series;
      }
    });

    const activeWindowSecs = ref(
      props.windows && props.windows.length > 0
        ? (props.windows[0]?.secs ?? props.window)
        : props.window
    );

    watch(
      () => props.window,
      (secs) => {
        if (!props.windows?.length) {
          activeWindowSecs.value = secs;
        }
      }
    );

    watch(
      () => props.windows,
      (wins) => {
        if (!wins?.length) {
          activeWindowSecs.value = props.window;
          return;
        }
        if (!wins.some((w) => w.secs === activeWindowSecs.value)) {
          activeWindowSecs.value = wins[0]?.secs ?? props.window;
        }
      }
    );

    const isDark = computed(() => props.theme === "dark");
    const isMultiSeries = computed(
      () => props.series != null && props.series.length > 0
    );
    const showSeriesToggle = computed(
      () => (lastSeriesProp.value?.length ?? 0) > 1
    );

    const palette = computed(() => {
      const p = resolveTheme(props.color, props.theme ?? "dark");
      if (props.lineWidth != null) {
        p.lineWidth = props.lineWidth;
      }
      return p;
    });

    const seriesPalettes = computed(() => {
      if (!props.series || props.series.length === 0) {
        return null;
      }
      return resolveSeriesPalettes(props.series, props.theme ?? "dark");
    });

    const multiSeries = computed(() => {
      if (!(props.series && seriesPalettes.value)) {
        return;
      }
      const theme = props.theme ?? "dark";
      return props.series.map((s, i) => ({
        data: s.data,
        id: s.id,
        label: s.label,
        palette:
          seriesPalettes.value?.get(s.id) ??
          resolveTheme(
            s.color || SERIES_COLORS[i % SERIES_COLORS.length],
            theme
          ),
        value: s.value,
      }));
    });

    const showMomentum = computed(() => props.momentum !== false);
    const momentumOverride = computed<Momentum | undefined>(() =>
      typeof props.momentum === "string" ? props.momentum : undefined
    );

    const pad = computed(() => {
      const defaultRight = isMultiSeries.value
        ? props.grid
          ? 54
          : 12
        : props.badge
          ? 80
          : props.grid
            ? 54
            : 12;
      return {
        bottom: props.padding?.bottom ?? 28,
        left: props.padding?.left ?? 12,
        right: props.padding?.right ?? defaultRight,
        top: props.padding?.top ?? 12,
      };
    });

    const degenEnabled = computed(() =>
      props.degen == null ? false : props.degen !== false
    );
    const degenOptions = computed<DegenOptions | undefined>(() =>
      degenEnabled.value
        ? typeof props.degen === "object"
          ? props.degen
          : {}
        : undefined
    );

    const effectiveWindowSecs = computed(() =>
      props.windows ? activeWindowSecs.value : props.window
    );

    const hasCandleData = computed(
      () => (props.candles?.length ?? 0) > 0 || props.liveCandle != null
    );
    const engineMode = computed(() =>
      hasCandleData.value ? "candle" : props.mode
    );
    const engineLineMode = computed(() =>
      hasCandleData.value ? (props.lineMode ?? props.mode === "line") : false
    );
    const activeMode = computed(() =>
      hasCandleData.value ? props.mode : props.lineMode ? "line" : "candle"
    );

    const measureIndicators = () => {
      if (props.windows && props.windows.length > 0) {
        const btn = windowBtnRefs.get(activeWindowSecs.value);
        const bar = windowBarRef.value;
        if (btn && bar) {
          const barRect = bar.getBoundingClientRect();
          const btnRect = btn.getBoundingClientRect();
          indicatorStyle.value = {
            left: btnRect.left - barRect.left,
            width: btnRect.width,
          };
        }
      }
      if (hasModeChangeListener()) {
        const btn = modeBtnRefs.get(activeMode.value ?? "line");
        const bar = modeBarRef.value;
        if (btn && bar) {
          const barRect = bar.getBoundingClientRect();
          const btnRect = btn.getBoundingClientRect();
          modeIndicatorStyle.value = {
            left: btnRect.left - barRect.left,
            width: btnRect.width,
          };
        }
      }
    };

    onUpdated(() => {
      void nextTick(measureIndicators);
    });

    onMounted(() => {
      void nextTick(measureIndicators);
    });

    const handleSeriesToggle = (id: string) => {
      const next = new Set(hiddenSeries.value);
      if (next.has(id)) {
        next.delete(id);
        emit("seriesToggle", id, true);
      } else {
        const totalSeries = props.series?.length ?? 0;
        const visibleCount = totalSeries - next.size;
        if (visibleCount <= 1) {
          return;
        }
        next.add(id);
        emit("seriesToggle", id, false);
      }
      hiddenSeries.value = next;
    };

    useLiveChartEngine(canvasRef, containerRef, () => ({
      badgeTail: props.badgeTail,
      badgeVariant: props.badgeVariant,
      candles: props.candles,
      candleWidth: props.candleWidth,
      data: props.data,
      degenOptions: isMultiSeries.value ? undefined : degenOptions.value,
      emptyText: props.emptyText,
      exaggerate: props.exaggerate,
      formatTime: props.formatTime ?? defaultFormatTime,
      formatValue: props.formatValue ?? defaultFormatValue,
      hiddenSeriesIds: hiddenSeries.value,
      isMultiSeries: isMultiSeries.value,
      lerpSpeed: props.lerpSpeed,
      lineData: props.lineData,
      lineMode: engineLineMode.value,
      lineValue: props.lineValue,
      liveCandle: props.liveCandle,
      loading: props.loading,
      mode: engineMode.value,
      momentumOverride: momentumOverride.value,
      multiSeries: multiSeries.value,
      onHover: (point) => {
        emit("hover", point);
      },
      orderbookData: props.orderbook,
      padding: pad.value,
      palette: palette.value,
      paused: props.paused,
      pauseWhenOffscreen: props.pauseWhenOffscreen,
      referenceLine: props.referenceLine,
      scrub: props.scrub,
      showBadge: isMultiSeries.value ? false : props.badge,
      showFill: isMultiSeries.value ? false : props.fill,
      showGrid: props.grid,
      showMomentum: isMultiSeries.value ? false : showMomentum.value,
      showPulse: props.pulse,
      tooltipOutline: props.tooltipOutline,
      tooltipY: props.tooltipY,
      value: props.value,
      valueDisplayRef: props.showValue ? valueDisplayRef : undefined,
      valueMomentumColor: props.valueMomentumColor,
      windowSecs: effectiveWindowSecs.value,
    }));

    const activeColor = computed(() =>
      isDark.value ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)"
    );
    const inactiveColor = computed(() =>
      isDark.value ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.22)"
    );
    const ws = computed(() => props.windowStyle ?? "default");
    const cursorStyle = computed(() =>
      props.scrub ? props.cursor : "default"
    );

    const chromeBarBg = () =>
      ws.value === "text"
        ? "transparent"
        : isDark.value
          ? "rgba(255,255,255,0.03)"
          : "rgba(0,0,0,0.02)";

    const chromeBarPadding = () =>
      ws.value === "text" ? 0 : ws.value === "rounded" ? 3 : 2;

    const chromeRadius = () => (ws.value === "rounded" ? 999 : 6);

    const slidingIndicator = (style: IndicatorStyle | null): VNode | null => {
      if (ws.value === "text" || !style) {
        return null;
      }
      return h("div", {
        style: {
          background: isDark.value
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.035)",
          borderRadius: ws.value === "rounded" ? 999 : 4,
          height:
            ws.value === "rounded" ? "calc(100% - 6px)" : "calc(100% - 4px)",
          left: style.left,
          pointerEvents: "none",
          position: "absolute",
          top: ws.value === "rounded" ? 3 : 2,
          transition:
            "left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          width: style.width,
        },
      });
    };

    return () => {
      const padding = pad.value;
      const children: VNode[] = [];

      if (props.showValue) {
        children.push(
          h("span", {
            ref: valueDisplayRef,
            style: {
              color: isDark.value ? "rgba(255,255,255,0.85)" : "#111",
              display: "block",
              flexShrink: 0,
              fontFamily: '"SF Mono", Menlo, monospace',
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              marginBottom: 8,
              paddingLeft: padding.left,
              paddingTop: 4,
              transition: "color 0.3s",
            },
          })
        );
      }

      const showChrome =
        (props.windows && props.windows.length > 0) ||
        hasModeChangeListener() ||
        showSeriesToggle.value;

      if (showChrome) {
        const chromeChildren: VNode[] = [];

        if (props.windows && props.windows.length > 0) {
          chromeChildren.push(
            h(
              "div",
              {
                ref: windowBarRef,
                style: {
                  background: chromeBarBg(),
                  borderRadius: chromeRadius(),
                  display: "inline-flex",
                  gap: ws.value === "text" ? 4 : 2,
                  padding: chromeBarPadding(),
                  position: "relative",
                },
              },
              [
                slidingIndicator(indicatorStyle.value),
                ...props.windows.map((w) => {
                  const isActive = w.secs === activeWindowSecs.value;
                  return h(
                    "button",
                    {
                      key: w.secs,
                      onClick: () => {
                        activeWindowSecs.value = w.secs;
                        emit("windowChange", w.secs);
                      },
                      ref: (el: unknown) => {
                        if (el instanceof HTMLButtonElement) {
                          windowBtnRefs.set(w.secs, el);
                        } else {
                          windowBtnRefs.delete(w.secs);
                        }
                      },
                      style: {
                        background: "transparent",
                        border: "none",
                        borderRadius: ws.value === "rounded" ? 999 : 4,
                        color: isActive
                          ? activeColor.value
                          : inactiveColor.value,
                        cursor: "pointer",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        fontSize: 11,
                        fontWeight: isActive ? 600 : 400,
                        lineHeight: "16px",
                        padding: ws.value === "text" ? "2px 6px" : "3px 10px",
                        position: "relative",
                        transition: "color 0.2s, background 0.15s",
                        zIndex: 1,
                      },
                      type: "button",
                    },
                    w.label
                  );
                }),
              ]
            )
          );
        }

        if (hasModeChangeListener()) {
          const lineActive = activeMode.value === "line";
          const candleActive = activeMode.value === "candle";
          chromeChildren.push(
            h(
              "div",
              {
                ref: modeBarRef,
                style: {
                  background: chromeBarBg(),
                  borderRadius: chromeRadius(),
                  display: "inline-flex",
                  gap: ws.value === "text" ? 4 : 2,
                  padding: chromeBarPadding(),
                  position: "relative",
                },
              },
              [
                slidingIndicator(modeIndicatorStyle.value),
                h(
                  "button",
                  {
                    onClick: () => {
                      emit("modeChange", "line");
                    },
                    ref: (el: unknown) => {
                      if (el instanceof HTMLButtonElement) {
                        modeBtnRefs.set("line", el);
                      } else {
                        modeBtnRefs.delete("line");
                      }
                    },
                    style: {
                      alignItems: "center",
                      background: "transparent",
                      border: "none",
                      borderRadius: ws.value === "rounded" ? 999 : 4,
                      cursor: "pointer",
                      display: "flex",
                      padding: "5px 7px",
                      position: "relative",
                      zIndex: 1,
                    },
                    type: "button",
                  },
                  [
                    h(
                      "svg",
                      {
                        fill: "none",
                        height: "12",
                        viewBox: "0 0 12 12",
                        width: "12",
                      },
                      [
                        h("path", {
                          d: "M1 8.5C2.5 8.5 3 4 5.5 4S7.5 7 8.5 7C9.5 7 10 3.5 11 3.5",
                          fill: "none",
                          stroke: lineActive
                            ? activeColor.value
                            : inactiveColor.value,
                          "stroke-linecap": "round",
                          "stroke-width": lineActive ? 1.5 : 1.2,
                        }),
                      ]
                    ),
                  ]
                ),
                h(
                  "button",
                  {
                    onClick: () => {
                      emit("modeChange", "candle");
                    },
                    ref: (el: unknown) => {
                      if (el instanceof HTMLButtonElement) {
                        modeBtnRefs.set("candle", el);
                      } else {
                        modeBtnRefs.delete("candle");
                      }
                    },
                    style: {
                      alignItems: "center",
                      background: "transparent",
                      border: "none",
                      borderRadius: ws.value === "rounded" ? 999 : 4,
                      cursor: "pointer",
                      display: "flex",
                      padding: "5px 7px",
                      position: "relative",
                      zIndex: 1,
                    },
                    type: "button",
                  },
                  [
                    h(
                      "svg",
                      {
                        fill: "none",
                        height: "12",
                        viewBox: "0 0 12 12",
                        width: "12",
                      },
                      [
                        h("line", {
                          stroke: candleActive
                            ? activeColor.value
                            : inactiveColor.value,
                          "stroke-width": "1",
                          x1: "3.5",
                          x2: "3.5",
                          y1: "1",
                          y2: "11",
                        }),
                        h("rect", {
                          fill: candleActive
                            ? activeColor.value
                            : inactiveColor.value,
                          height: "5",
                          rx: "0.5",
                          width: "3",
                          x: "2",
                          y: "3",
                        }),
                        h("line", {
                          stroke: candleActive
                            ? activeColor.value
                            : inactiveColor.value,
                          "stroke-width": "1",
                          x1: "8.5",
                          x2: "8.5",
                          y1: "2",
                          y2: "10",
                        }),
                        h("rect", {
                          fill: candleActive
                            ? activeColor.value
                            : inactiveColor.value,
                          height: "4",
                          rx: "0.5",
                          width: "3",
                          x: "7",
                          y: "4",
                        }),
                      ]
                    ),
                  ]
                ),
              ]
            )
          );
        }

        if (showSeriesToggle.value) {
          chromeChildren.push(
            h(
              "div",
              {
                style: {
                  background: chromeBarBg(),
                  borderRadius: chromeRadius(),
                  display: "inline-flex",
                  gap: ws.value === "text" ? 4 : 2,
                  opacity: isMultiSeries.value ? 1 : 0,
                  padding: chromeBarPadding(),
                  pointerEvents: isMultiSeries.value ? "auto" : "none",
                  transition: "opacity 0.4s",
                },
              },
              (lastSeriesProp.value ?? []).map((s, si) => {
                const isHidden = hiddenSeries.value.has(s.id);
                const seriesColor =
                  s.color || SERIES_COLORS[si % SERIES_COLORS.length];
                return h(
                  "button",
                  {
                    key: s.id,
                    onClick: () => handleSeriesToggle(s.id),
                    style: {
                      alignItems: "center",
                      background: isHidden
                        ? "transparent"
                        : ws.value === "text"
                          ? "transparent"
                          : isDark.value
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.035)",
                      border: "none",
                      borderRadius: ws.value === "rounded" ? 999 : 4,
                      color: isHidden ? inactiveColor.value : activeColor.value,
                      cursor: "pointer",
                      display: "flex",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      fontSize: 11,
                      fontWeight: 500,
                      gap: props.seriesToggleCompact ? 0 : 4,
                      lineHeight: "16px",
                      opacity: isHidden ? 0.4 : 1,
                      padding: props.seriesToggleCompact
                        ? ws.value === "text"
                          ? "2px 4px"
                          : "5px 7px"
                        : ws.value === "text"
                          ? "2px 6px"
                          : "3px 8px",
                      position: "relative",
                      transition: "opacity 0.2s, background 0.15s, color 0.2s",
                      zIndex: 1,
                    },
                    type: "button",
                  },
                  [
                    h("span", {
                      style: {
                        background: seriesColor,
                        borderRadius: "50%",
                        flexShrink: 0,
                        height: props.seriesToggleCompact ? 8 : 6,
                        opacity: isHidden ? 0.4 : 1,
                        transition: "opacity 0.2s",
                        width: props.seriesToggleCompact ? 8 : 6,
                      },
                    }),
                    props.seriesToggleCompact ? null : (s.label ?? s.id),
                  ]
                );
              })
            )
          );
        }

        children.push(
          h(
            "div",
            {
              style: {
                alignItems: "center",
                display: "flex",
                flexShrink: 0,
                gap: 6,
                marginBottom: 6,
                marginLeft: padding.left,
              },
            },
            chromeChildren
          )
        );
      }

      children.push(
        h(
          "div",
          {
            class: props.class,
            ref: containerRef,
            style: [
              {
                flex: 1,
                minHeight: 0,
                position: "relative",
                width: "100%",
              },
              props.style,
            ],
          },
          [
            h("canvas", {
              ref: canvasRef,
              style: { cursor: cursorStyle.value, display: "block" },
            }),
          ]
        )
      );

      return h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
            width: "100%",
          },
        },
        children
      );
    };
  },
});
