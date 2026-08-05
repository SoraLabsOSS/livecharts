import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "react/index": "src/react/index.ts",
  },
  format: ["esm", "cjs"],
  dts: {
    resolve: true,
  },
  splitting: false,
  clean: true,
  jsx: "automatic",
  external: ["react", "react-dom", "react/jsx-runtime"],
});
