# LiveCharts

Monorepo for LiveCharts. Publishable package: [`@soralabsoss/livecharts`](./packages/livecharts).

## Getting started

```bash
bun install
bun run build --filter=@soralabsoss/livecharts
bunx @soralabsoss/livecharts
```

## Publish

Push a version tag to trigger npm publish via GitHub Actions:

```bash
git tag v0.0.1
git push origin v0.0.1
```

Requires the `NPM_TOKEN` repository secret.
