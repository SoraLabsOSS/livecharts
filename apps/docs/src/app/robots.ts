import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/og";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    host: siteUrl,
    rules: {
      allow: "/",
      userAgent: "*",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
