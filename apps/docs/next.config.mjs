import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** Custom domain: https://livecharts.soralabs.io.vn/ */
/** @type {import('next').NextConfig} */
const config = {
  env: {
    // Empty under the custom domain (site is served at `/`). Kept so search /
    // markdown / OG helpers can still share one prefix helper.
    NEXT_PUBLIC_BASE_PATH: "",
  },
  images: {
    unoptimized: true,
  },
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  transpilePackages: ["livecharts"],
};

export default withMDX(config);
