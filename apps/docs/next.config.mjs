import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** Project Pages URL: https://soralabsoss.github.io/livecharts/ */
const repo = "livecharts";
const isGithubPages = process.env.GITHUB_PAGES === "true";

/** @type {import('next').NextConfig} */
const config = {
  images: {
    unoptimized: true,
  },
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  ...(isGithubPages
    ? {
        assetPrefix: `/${repo}/`,
        basePath: `/${repo}`,
      }
    : {}),
};

export default withMDX(config);
