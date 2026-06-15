# Contributing to Rova

Thanks for your interest in Rova. This doc covers repo structure, local
setup, and how to start building plugins. For *why* things are built the way
they are, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — read that
first if anything here seems arbitrary.

## Repo Structure (Monorepo)

```
rova/
├── apps/
│   └── rova/                 # Tauri shell — main app entry point
│       ├── src-tauri/        # Rust backend
│       └── src/              # TypeScript/SolidJS frontend
├── crates/
│   ├── rova-format/          # .rova read/write (zip + manifest.json)
│   ├── rova-forge/            # Vector engine (usvg + lyon + resvg)
│   ├── rova-lumen/            # Raster canvas (wgpu + tiny-skia) + Krita bridge
│   ├── rova-folio/            # Page layout canvas (cosmic-text) + Scribus bridge
│   ├── rova-ai/                # Candle-based SAM/SD subprocess
│   └── rova-plugins/          # Sandboxed JS/WASM plugin runtime
├── plugins/
│   └── examples/              # Reference plugins (start here if building one)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── FILE_FORMAT.md
│   └── ROADMAP.md
└── README.md
```

Each `crates/rova-*` package should be buildable and testable in isolation
where possible — this keeps the "thin core" promise honest and makes it
easier for contributors to work on one mode without standing up the whole
app.

## Local Setup

> This section will be filled in as Phase 1 scaffolding lands. Until then:

- Requires: Rust (stable), Node.js (for the frontend), Tauri CLI
- `cargo build` builds the Rust crates
- Frontend dev server instructions TBD once `apps/rova` exists

## Where to Start

Check [`docs/ROADMAP.md`](docs/ROADMAP.md) for the current phase. Pick up
items from the current phase's checklist — avoid jumping ahead to later
phases (e.g., don't start on Lumen's Krita bridge while Phase 1's PoC isn't
done) to keep scope under control.

## Plugin Development (Phase 5+)

Plugins are sandboxed JS/TS or WASM modules with no default permissions.
Every plugin implements some subset of this lifecycle:

```ts
interface RovaPlugin {
  init?(): void;
  onLayerSelect?(layer: Layer): void;
  render?(context: RenderContext): void;
  onExport?(document: RovaDocument): void;
}
```

A plugin manifest declares what it needs:

```json
{
  "name": "example-plugin",
  "entry": "index.js",
  "permissions": []
}
```

`permissions` defaults to an empty array. If your plugin needs filesystem or
network access, it must be declared explicitly and will prompt the user on
install.

Reference plugins live in `plugins/examples/` — copy one as a starting
point rather than building from scratch.

## Licensing Reminders for Contributors

- Code you write for `crates/rova-*` and `apps/rova` falls under Rova's core
  license (see `README.md`).
- **Do not** copy code from Krita, Scribus, or Inkscape into this repo —
  those are GPL and integrated only via subprocess (see
  `docs/ARCHITECTURE.md#licensing--attribution`). Linking their code directly
  would change Rova's licensing obligations.
- New dependencies should be checked for license compatibility (MIT/Apache
  preferred) before adding to `Cargo.toml` or `package.json`.

## Code of Conduct

[TBD — add before accepting external contributions]
