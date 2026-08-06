import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts"],
  external: ["vue", "@livecharts/core"],
  format: ["esm", "cjs"],
  splitting: false,
});
