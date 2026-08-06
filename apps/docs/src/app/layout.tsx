import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Provider } from "@/components/provider";
import {
  absoluteUrl,
  defaultOpenGraph,
  defaultTwitter,
  siteDescription,
  siteUrl,
} from "@/lib/og";
import { appName } from "@/lib/shared";
import "./global.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  alternates: {
    canonical: absoluteUrl("/"),
  },
  applicationName: appName,
  authors: [{ name: "Sora Labs", url: "https://soralabs.io.vn" }],
  creator: "Sora Labs",
  description: siteDescription,
  icons: {
    icon: "/favicon.ico",
  },
  keywords: [
    "livecharts",
    "canvas",
    "charts",
    "real-time",
    "candlestick",
    "line chart",
    "react",
    "vue",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    ...defaultOpenGraph(appName, siteDescription),
    url: absoluteUrl("/"),
  },
  robots: {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    index: true,
  },
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  twitter: defaultTwitter(appName, siteDescription),
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html className={inter.className} lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
