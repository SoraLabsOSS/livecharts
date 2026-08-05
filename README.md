# LiveCharts

Monorepo for LiveCharts. Publishable package: [`livecharts`](./packages/livecharts).

## Getting started

```bash
bun install
bun run build --filter=livecharts
bunx livecharts
```

## Publish

Push a version tag to trigger npm publish via GitHub Actions:

```bash
git tag v0.0.1
git push origin v0.0.1
```

Requires the `NPM_TOKEN` repository secret.
