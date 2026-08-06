import { remarkInstall } from "fumadocs-docgen";
import { defineConfig } from "fumadocs-mdx/config";

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      [
        remarkInstall,
        {
          persist: {
            id: "package-manager",
          },
        },
      ],
    ],
  },
});
