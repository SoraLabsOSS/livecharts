import { readFile } from "node:fs/promises";
import path from "node:path";
import { Shiori } from "@workspace/ui/components/og/shiori";
import { ImageResponse } from "next/og";
import { appName } from "./shared";

export const siteUrl = "https://livecharts.soralabs.io.vn";
export const siteDescription =
  "Real-time animated canvas charts — line, candlestick, and multi-series.";
/** Short line for OG artwork (Shiori title slot). */
export const ogTagline = "Real-time animated canvas charts";
export const defaultOgPath = "/og/image.png";

const trailingSlash = /\/$/;
const ogSize = { height: 630, width: 1200 } as const;

let logoDataUrl: string | undefined;

async function getLogoDataUrl() {
  if (logoDataUrl) {
    return logoDataUrl;
  }

  const file = await readFile(path.join(process.cwd(), "public", "logo.jpg"));
  logoDataUrl = `data:image/jpeg;base64,${file.toString("base64")}`;
  return logoDataUrl;
}

export async function createOgImage(title: string) {
  const logo = await getLogoDataUrl();

  return new ImageResponse(
    <Shiori
      background="#f5f2eb"
      brand={appName}
      brandColor="#0a0a0a"
      logo={logo}
      title={title}
      titleColor="#737373"
    />,
    ogSize
  );
}

export function absoluteUrl(pathname: string) {
  const base = siteUrl.replace(trailingSlash, "");
  let pathName = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (pathName !== "/" && !pathName.endsWith("/")) {
    pathName = `${pathName}/`;
  }
  return `${base}${pathName}`;
}

export function defaultOpenGraph(title: string, description: string) {
  return {
    description,
    images: [
      {
        alt: title,
        height: ogSize.height,
        url: defaultOgPath,
        width: ogSize.width,
      },
    ],
    locale: "en_US",
    siteName: appName,
    title,
    type: "website" as const,
    url: siteUrl,
  };
}

export function defaultTwitter(title: string, description: string) {
  return {
    card: "summary_large_image" as const,
    description,
    images: [defaultOgPath],
    title,
  };
}
