import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** Project Pages URL: https://soralabsoss.github.io/livecharts/ */
const repo = "livecharts";
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? `/${repo}` : "";

/** @type {import('next').NextConfig} */
const config = {
  // `basePath` is not applied to plain `fetch()` calls, so the static search
  // client needs the prefix at runtime.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  ...(isGithubPages
    ? {
        assetPrefix: `${basePath}/`,
        basePath,
      }
    : {}),
};

export default withMDX(config);
