import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import { baseOptions } from "@/lib/layout.shared";
import {
  absoluteUrl,
  defaultOpenGraph,
  defaultTwitter,
  siteDescription,
} from "@/lib/og";
import { appName } from "@/lib/shared";

export const metadata: Metadata = {
  alternates: {
    canonical: absoluteUrl("/"),
  },
  description: siteDescription,
  openGraph: {
    ...defaultOpenGraph(appName, siteDescription),
    url: absoluteUrl("/"),
  },
  title: {
    absolute: appName,
  },
  twitter: defaultTwitter(appName, siteDescription),
};

export default function Layout({ children }: LayoutProps<"/">) {
  return <HomeLayout {...baseOptions()}>{children}</HomeLayout>;
}
