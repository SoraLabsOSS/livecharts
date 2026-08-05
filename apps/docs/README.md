# LiveCharts Docs

Fumadocs + Next.js static export. Deployed to GitHub Pages from `main`.

```bash
bun run dev --filter=docs
bun run build --filter=docs
```

Production Pages build (sets `basePath=/livecharts`):

```bash
bun run build:pages --filter=docs
```

Site: https://soralabsoss.github.io/livecharts/

Showcase pages with `<LiveChart />` work on static export — they are client components and hydrate in the browser. Add a `"use client"` demo page under `content/docs` / `src` when ready.
