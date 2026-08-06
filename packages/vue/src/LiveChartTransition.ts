import {
  defineComponent,
  Fragment,
  h,
  onBeforeUnmount,
  type PropType,
  ref,
  type StyleValue,
  type VNode,
  watch,
} from "vue";

export interface LiveChartTransitionProps {
  /** Key of the active child to display. Must match a child's `key`. */
  active: string;
  class?: string;
  /** Cross-fade duration in ms (default 300) */
  duration?: number;
  style?: StyleValue;
}

function flattenVNodes(nodes: VNode[]): VNode[] {
  const out: VNode[] = [];
  for (const node of nodes) {
    if (node == null) {
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
    duration: { default: 300, type: Number },
    style: [String, Object, Array] as PropType<StyleValue>,
  },
  setup(props, { slots }) {
    const mounted = ref(new Set<string>([props.active]));
    const visible = ref(props.active);
    const prevActive = ref(props.active);

    let rafId = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const clearTimers = () => {
      cancelAnimationFrame(rafId);
      if (timer != null) {
        clearTimeout(timer);
      }
    };

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
        rafId = requestAnimationFrame(() => {
          rafId = requestAnimationFrame(() => {
            visible.value = active;
          });
        });

        timer = setTimeout(() => {
          const next = new Set(mounted.value);
          next.delete(oldKey);
          mounted.value = next;
        }, props.duration + 50);
      }
    );

    onBeforeUnmount(clearTimers);

    return () => {
      const raw = slots.default?.() ?? [];
      const childArray = flattenVNodes(raw);

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
          const key = String(child.key ?? "");
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
                transition: `opacity ${props.duration}ms ease`,
              },
            },
            [child]
          );
        })
      );
    };
  },
});
