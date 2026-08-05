import { useEffect, useRef } from "react";
import { LiveChartEngine, type EngineConfig } from "@livecharts/core";

/** Config accepted by the hook — React ref variant of `EngineConfig.valueDisplay`. */
type HookConfig = Omit<EngineConfig, "valueDisplay"> & {
  valueDisplayRef?: React.RefObject<HTMLSpanElement | null>;
};

function toEngineConfig(config: HookConfig): EngineConfig {
  const { valueDisplayRef, ...rest } = config;
  return { ...rest, valueDisplay: valueDisplayRef?.current ?? null };
}

/**
 * Thin React adapter over {@link LiveChartEngine}.
 * Mounts the engine once, pushes config after every render, destroys on unmount.
 */
export function useLiveChartEngine(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  config: HookConfig,
) {
  const engineRef = useRef<LiveChartEngine | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const engine = new LiveChartEngine({ canvas, container });
    engineRef.current = engine;
    engine.setConfig(toEngineConfig(configRef.current));
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [canvasRef, containerRef]);

  // Push latest config post-commit so refs (value display span) are attached.
  useEffect(() => {
    engineRef.current?.setConfig(toEngineConfig(configRef.current));
  });
}
