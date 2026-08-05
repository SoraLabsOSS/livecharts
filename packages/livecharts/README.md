# LiveCharts

Real-time animated charts. Canvas engine with framework bindings.

## Install

```bash
npm install livecharts
# peer: react >= 18 (for livecharts/react)
```

## React

```tsx
import { LiveChart } from "livecharts/react";
import type { LiveChartPoint } from "livecharts/react";

function Chart({ data, value }: { data: LiveChartPoint[]; value: number }) {
  return (
    <div style={{ height: 200 }}>
      <LiveChart data={data} value={value} />
    </div>
  );
}
```

## Core (framework-agnostic)

```ts
import { LiveChartEngine, resolveTheme } from "livecharts";
```

## Data helpers

Import helpers from the dedicated entry when no chart runtime is needed:

```ts
import { aggregateCandles, createWalker } from "livecharts/data";
```

The root `livecharts` entry continues to export these helpers for backward
compatibility.

## Monorepo packages (private)

| Package             | Role                                      |
| ------------------- | ----------------------------------------- |
| `@livecharts/core`  | Canvas engine — no React                  |
| `@livecharts/react` | `<LiveChart />` wrapper                   |
| `livecharts`        | Published npm package (bundles the above) |

## License

MIT. Chart engine based on [Liveline](https://github.com/benjitaylor/liveline) by Benji Taylor (MIT).
