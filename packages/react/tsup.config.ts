import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  external: ["react", "react/jsx-runtime", "@livecharts/core"],
  splitting: false,
  clean: true,
  jsx: "automatic",
});
