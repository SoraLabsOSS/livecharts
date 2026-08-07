# Changelog

All notable changes to the published `livecharts` package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-07

### Added

- **`pushTick`** in `livecharts/data` — append a live reading and trim history by time
- Vue docs section (demo, guides) with shared-engine live previews
- Auto-measured bundle size table on Introduction (`BundleSizeTable`)
- Engine lifecycle tests (destroy / window switch / range expansion)

### Changed

- Prefer controlled **`mode`** (`"line" | "candle"`) for candlestick morph; public `lineMode` remains as a soft override
- Publish workflow covers Vue entries and optional `workflow_dispatch` / release triggers
- Docs deploy path filters include package sources so Pages stays in sync

### Deprecated

- Public **`lineMode`** prop on React/Vue — use `mode` / `onModeChange` / `@mode-change` instead. Still accepted; removal planned for a later minor. Low-level `EngineConfig.lineMode` remains the morph driver for direct engine users.

## [0.0.7] - 2026-08-06

### Added

- Vue bindings and `livecharts/vue` package entry
- `pauseWhenOffscreen` (default on) via `IntersectionObserver`

### Fixed

- Vue emit-only callbacks (no double-fire with React-style `on*` props)
- Window pill sync when `window` / `windows` props change

## [0.0.6] - 2026-08-06

Earlier releases: see git tags `v0.0.1`–`v0.0.6`.
