# LiveCharts

Monorepo for real-time canvas charts.

## Packages

| Package             | Publish | Role                             |
| ------------------- | ------- | -------------------------------- |
| `@livecharts/core`  | private | Framework-agnostic canvas engine |
| `@livecharts/react` | private | `<LiveChart />` React wrapper    |
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

## Develop

```bash
bun install
bun run build --filter=livecharts...
bun run test --filter=@livecharts/core
```

## Publish

1. Bump `packages/livecharts/package.json` version
2. Commit, tag `vX.Y.Z`, push tag
3. GitHub Actions publishes to npm

Requires `NPM_TOKEN` repository secret.

## License

MIT. Engine based on [Liveline](https://github.com/benjitaylor/liveline) (MIT).
