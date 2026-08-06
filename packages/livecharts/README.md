# LiveCharts

Real-time animated charts. Canvas engine with framework bindings.

## Install

```bash
npm install livecharts
```

Peers (optional, depending on entry):

- `react` ≥ 18 for `livecharts/react`
- `vue` ≥ 3.4 for `livecharts/vue`

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

## Vue

```vue
<script setup lang="ts">
import { LiveChart, LiveChartTransition } from "livecharts/vue";
import type { LiveChartPoint } from "livecharts/vue";
import { ref } from "vue";

const data = ref<LiveChartPoint[]>([]);
const value = ref(0);
</script>

<template>
  <div style="height: 200px">
    <LiveChart :data="data" :value="value" />
  </div>
</template>
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
| `@livecharts/core`  | Canvas engine — no framework              |
| `@livecharts/react` | React `<LiveChart />` wrapper             |
| `@livecharts/vue`   | Vue 3 `<LiveChart />` + `LiveChartTransition` |
| `livecharts`        | Published npm package (bundles the above) |

## License

MIT. Chart engine based on [Liveline](https://github.com/benjitaylor/liveline) by Benji Taylor (MIT).
