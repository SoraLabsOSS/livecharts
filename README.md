# LiveCharts

Monorepo for real-time canvas charts.

## Packages

| Package             | Publish | Role                             |
| ------------------- | ------- | -------------------------------- |
| `@livecharts/core`  | private | Framework-agnostic canvas engine |
| `@livecharts/react` | private | `<LiveChart />` React wrapper    |
| `@workspace/ui`     | private | Shared shadcn/Base UI components |
| `livecharts`        | **npm** | Public package — subpaths below  |

## Usage (npm)

```bash
npm install livecharts
```

```tsx
import { LiveChart } from "livecharts/react";
```

```ts
import { LiveChartEngine } from "livecharts";
```

## Shared UI (`@workspace/ui`)

Workspace package for apps (shadcn + Base UI). Add components from `packages/ui`:

```bash
cd packages/ui
bunx shadcn@latest add card
```

Import in an app:

```tsx
import { Button } from "@workspace/ui/components/ui/button";
```

## Develop

```bash
bun install
bun run lint
bun run dev --filter=docs
bun run build --filter=livecharts...
bun run test --filter=@livecharts/core
```

Docs site: [Fumadocs](https://www.fumadocs.dev/docs) app at `apps/docs` (`bun run dev --filter=docs`). Static export deploys to GitHub Pages on push to `main` → https://livecharts.soralabs.io.vn/

Lint/format uses [Ultracite](https://www.ultracite.ai/docs/monorepos) (Biome) at the repo root. `packages/core` and `packages/react` are excluded so Liveline-extracted sources keep their original style.

## Publish

1. Bump `packages/livecharts/package.json` version
2. Commit, tag `vX.Y.Z`, push tag
3. GitHub Actions publishes to npm

Requires `NPM_TOKEN` repository secret.

## License

MIT. Engine based on [Liveline](https://github.com/benjitaylor/liveline) (MIT).
