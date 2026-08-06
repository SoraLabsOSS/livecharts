import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import {
  BasicChart,
  BitcoinChart,
  CandlestickChart,
  CpuChart,
  DarkChart,
  GappyChart,
  HeartRateChart,
  HeroChart,
  LoadingChart,
  MinimalChart,
  MomentumChart,
  MultiSeriesChart,
  OrderbookChart,
  PausedChart,
  SpikyTestCharts,
  StressTestCharts,
  ValueOverlayChart,
} from "@/components/demo/charts";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    BasicChart,
    BitcoinChart,
    CandlestickChart,
    CpuChart,
    DarkChart,
    GappyChart,
    HeartRateChart,
    HeroChart,
    LoadingChart,
    MinimalChart,
    MomentumChart,
    MultiSeriesChart,
    OrderbookChart,
    PausedChart,
    SpikyTestCharts,
    StressTestCharts,
    Tab,
    Tabs,
    ValueOverlayChart,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
