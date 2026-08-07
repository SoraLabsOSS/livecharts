import type { ReactNode } from "react";
import type { ThemeMode, WindowOption } from "@livecharts/core";

export interface ChromeWindowsSlotProps {
  windows: WindowOption[];
  activeSecs: number;
  setWindow: (secs: number) => void;
  theme: ThemeMode;
}

export interface ChromeModeSlotProps {
  mode: "line" | "candle";
  setMode: (mode: "line" | "candle") => void;
  theme: ThemeMode;
}

export interface ChromeSeriesItem {
  id: string;
  label: string;
  color: string;
  visible: boolean;
}

export interface ChromeSeriesSlotProps {
  series: ChromeSeriesItem[];
  toggle: (id: string) => void;
  theme: ThemeMode;
}

export type ChromeWindowsRender = (props: ChromeWindowsSlotProps) => ReactNode;
export type ChromeModeRender = (props: ChromeModeSlotProps) => ReactNode;
export type ChromeSeriesRender = (props: ChromeSeriesSlotProps) => ReactNode;
