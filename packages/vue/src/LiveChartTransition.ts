import {
  Comment,
  defineComponent,
  Fragment,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  type StyleValue,
  Text,
  type VNode,
  watch,
} from "vue";

/** Strong ease-out — Emil / animations.dev UI entrance & exit curve. */
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

/** Occasional mode switch cross-fade; keep under 300ms UI budget. */
const DEFAULT_DURATION_MS = 220;

export interface LiveChartTransitionProps {
  /** Key of the active child to display. Must match a child's `key`. */
  active: string;
  class?: string;
  /** Cross-fade duration in ms (default 220) */
  duration?: number;
  style?: StyleValue;
}

function flattenVNodes(nodes: VNode[]): VNode[] {
  const out: VNode[] = [];
  for (const node of nodes) {
    if (node == null || node.type === Comment || node.type === Text) {
      continue;
    }
    if (node.type === Fragment && Array.isArray(node.children)) {
      out.push(...flattenVNodes(node.children as VNode[]));
      continue;
    }
    out.push(node);
  }
  return out;
}

/**
 * Cross-fade between chart components (e.g. line ↔ candlestick).
 * Slot children must have unique `key`s matching possible `active` values.
 *
 * Purpose: prevent a jarring swap between two chart instances (opacity only).
 *
 * @example
 * ```vue
 * <LiveChartTransition :active="chartType">
 *   <LiveChart key="line" :data="data" :value="value" />
 *   <LiveChart key="candle" mode="candle" :candles="candles" ... />
 * </LiveChartTransition>
 * ```
 */
export const LiveChartTransition = defineComponent({
  name: "LiveChartTransition",
  props: {
    active: { required: true, type: String },
    class: String,
    duration: { default: DEFAULT_DURATION_MS, type: Number },
    style: [String, Object, Array] as PropType<StyleValue>,
  },
  setup(props, { slots }) {
    const mounted = ref(new Set<string>([props.active]));
    const visible = ref(props.active);
    const prevActive = ref(props.active);
    const reduceMotion = ref(false);

    let rafId = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let mql: MediaQueryList | undefined;

    const onMqlChange = () => {
      if (mql) {
        reduceMotion.value = mql.matches;
      }
    };

    const clearTimers = () => {
      cancelAnimationFrame(rafId);
      if (timer != null) {
        clearTimeout(timer);
      }
    };

    const effectiveDuration = () => (reduceMotion.value ? 0 : props.duration);

    onMounted(() => {
      if (typeof window.matchMedia !== "function") {
        return;
      }
      mql = window.matchMedia("(prefers-reduced-motion: reduce)");
      onMqlChange();
      mql.addEventListener("change", onMqlChange);
    });

    onBeforeUnmount(() => {
      clearTimers();
      mql?.removeEventListener("change", onMqlChange);
    });

    watch(
      () => props.active,
      (active) => {
        if (active === prevActive.value) {
          return;
        }

        const oldKey = prevActive.value;
        prevActive.value = active;
        mounted.value = new Set([...mounted.value, active]);
        clearTimers();

        const ms = effectiveDuration();
        if (ms <= 0) {
          visible.value = active;
          mounted.value = new Set([active]);
          return;
        }

        rafId = requestAnimationFrame(() => {
          rafId = requestAnimationFrame(() => {
            visible.value = active;
          });
        });

        timer = setTimeout(() => {
          const next = new Set(mounted.value);
          next.delete(oldKey);
          mounted.value = next;
        }, ms + 50);
      }
    );

    return () => {
      const raw = slots.default?.() ?? [];
      const childArray = flattenVNodes(raw).filter(
        (child) => child.key != null && String(child.key) !== ""
      );
      const ms = effectiveDuration();

      return h(
        "div",
        {
          class: props.class,
          style: [
            {
              height: "100%",
              position: "relative",
              width: "100%",
            },
            props.style,
          ],
        },
        childArray.map((child) => {
          const key = String(child.key);
          if (!mounted.value.has(key)) {
            return null;
          }
          const isActive = key === visible.value;
          return h(
            "div",
            {
              key,
              style: {
                inset: 0,
                opacity: isActive ? 1 : 0,
                pointerEvents: isActive ? "auto" : "none",
                position: "absolute",
                transition: ms > 0 ? `opacity ${ms}ms ${EASE_OUT}` : "none",
              },
            },
            [child]
          );
        })
      );
    };
  },
});
