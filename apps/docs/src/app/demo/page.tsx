import type { Metadata } from "next";
import { DemoArticle } from "./demo";

export const metadata: Metadata = {
  description:
    "Real-time animated charts for React — interactive article demo.",
  title: "LiveCharts Demo",
};

export default function DemoPage() {
  return <DemoArticle />;
}
