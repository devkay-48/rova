# Rova

> Roam the canvas.

Rova is a free, open-source, unified creative suite — one app, one document
format, three modes. It replaces the experience of juggling separate apps
(Photoshop, Illustrator, InDesign and their FOSS equivalents) with a single
workspace where vector, raster, and page-layout work live in the same file
and the same window.

Rova does not reinvent brush engines, vector rasterizers, or layout
typesetting. It **orchestrates** proven open-source engines (Krita, Scribus)
and modern Rust libraries (resvg, usvg, lyon) behind one seamless interface,
built on Tauri + Rust + WebGPU.

## The Three Modes

| Mode | Discipline | What it's for |
|------|-----------|----------------|
| **Forge** | Vector | Logos, icons, type outlines, sharp geometry |
| **Lumen** | Raster | Painting, photo editing, masking, retouching |
| **Folio** | Page layout | Spreads, master pages, text flow, export |

All three modes operate on a single shared document — switching modes is a
UI action, not a file conversion.

## File Format

Rova documents use the `.rova` extension — a zip archive containing a layer
manifest, raster layers (PNG), vector layers (SVG fragments), and text layers
(JSON). Full spec: [`docs/FILE_FORMAT.md`](docs/FILE_FORMAT.md).

## Project Status

🚧 **Early planning / research phase.** Core architecture decisions are
documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Roadmap and
current phase: [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Core Principles

1. **No engine redundancy** — never rewrite a brush engine, rasterizer, or
   typesetting engine that already exists and works.
2. **Unified file format** — one `.rova` file, mode-agnostic, holds every
   layer type.
3. **Plugin-first** — the core app stays thin; features are sandboxed
   JS/TS/WASM plugins.
4. **Privacy & local-first** — no mandatory accounts, no telemetry, AI
   features run entirely on-device and are optional downloads.
5. **Fully open source** — Rova's own code, no exceptions. Bundled GPL tools
   (Krita, Scribus) are run as separate processes, never linked, and are
   credited prominently. See [`docs/ARCHITECTURE.md#licensing--attribution`](docs/ARCHITECTURE.md#licensing--attribution).

## Getting Started (Contributors)

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for repo structure, build
instructions, and the plugin development guide.

## License

Rova core: [TBD — MIT or Apache-2.0]. See `docs/ARCHITECTURE.md` for how this
interacts with bundled GPL components.
