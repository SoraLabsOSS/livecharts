import type { Metadata } from "next";
import { absoluteUrl, defaultOpenGraph, defaultTwitter } from "@/lib/og";
import { DemoArticle } from "./demo";

const title = "Demo";
const description =
  "Interactive LiveCharts article — real-time line, candlestick, pause, and multi-series demos.";

export const metadata: Metadata = {
  alternates: {
    canonical: absoluteUrl("/demo"),
  },
  description,
  openGraph: {
    ...defaultOpenGraph(title, description),
    url: absoluteUrl("/demo"),
  },
  title,
  twitter: defaultTwitter(title, description),
};

export default function DemoPage() {
  return <DemoArticle />;
}
