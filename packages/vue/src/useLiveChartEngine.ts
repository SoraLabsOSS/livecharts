import { type EngineConfig, LiveChartEngine } from "@livecharts/core";
import {
  onBeforeUnmount,
  onMounted,
  type Ref,
  shallowRef,
  watchEffect,
} from "vue";

/** Config accepted by the composable — ref variant of `EngineConfig.valueDisplay`. */
export type HookConfig = Omit<EngineConfig, "valueDisplay"> & {
  valueDisplayRef?: Ref<HTMLSpanElement | null>;
};

function toEngineConfig(config: HookConfig): EngineConfig {
  const { valueDisplayRef, ...rest } = config;
  return { ...rest, valueDisplay: valueDisplayRef?.value ?? null };
}

/**
 * Thin Vue adapter over {@link LiveChartEngine}.
 * Mounts the engine once, pushes config when it changes, destroys on unmount.
 */
export function useLiveChartEngine(
  canvasRef: Ref<HTMLCanvasElement | null>,
  containerRef: Ref<HTMLDivElement | null>,
  getConfig: () => HookConfig
) {
  const engineRef = shallowRef<LiveChartEngine | null>(null);

  onMounted(() => {
    const canvas = canvasRef.value;
    const container = containerRef.value;
    if (!(canvas && container)) {
      return;
    }

    const engine = new LiveChartEngine({ canvas, container });
    engineRef.value = engine;
    engine.setConfig(toEngineConfig(getConfig()));
    engine.start();
  });

  watchEffect(() => {
    const engine = engineRef.value;
    if (!engine) {
      return;
    }
    engine.setConfig(toEngineConfig(getConfig()));
  });

  onBeforeUnmount(() => {
    engineRef.value?.destroy();
    engineRef.value = null;
  });

  return engineRef;
}
