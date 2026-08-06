import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/og";
import { source } from "@/lib/source";

export const dynamic = "force-static";

const trailingSlash = /\/$/;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      changeFrequency: "weekly",
      lastModified: now,
      priority: 1,
      url: absoluteUrl("/"),
    },
    {
      changeFrequency: "weekly",
      lastModified: now,
      priority: 0.9,
      url: absoluteUrl("/docs"),
    },
  ];

  const docRoutes: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    changeFrequency: "weekly" as const,
    lastModified: now,
    priority: page.url === "/docs" || page.url === "/docs/" ? 0.9 : 0.7,
    url: absoluteUrl(page.url.endsWith("/") ? page.url : `${page.url}/`),
  }));

  // Deduplicate /docs if both static and source list it
  const seen = new Set<string>();
  const entries: MetadataRoute.Sitemap = [];

  for (const entry of [...staticRoutes, ...docRoutes]) {
    const key = entry.url.replace(trailingSlash, "") || siteUrl;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    entries.push(entry);
  }

  return entries;
}
