import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: {
    resolve: true,
  },
  entry: {
    "data/index": "src/data/index.ts",
    index: "src/index.ts",
    "react/index": "src/react/index.ts",
  },
  external: ["react", "react-dom", "react/jsx-runtime"],
  format: ["esm", "cjs"],
  jsx: "automatic",
  splitting: false,
});
