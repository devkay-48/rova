# Rova — Architecture

This document is the single source of truth for *how* Rova is built and
*why*. If a decision contradicts this doc, this doc wins until it's updated
deliberately — don't silently drift from it.

## 1. Core Philosophy: Orchestrator, Not Engine-Builder

Rova is mostly a **shell**: a window, a canvas, a file format, and a way to
switch between modes. The actual creative work is done either:

- **Natively**, by Rust libraries compiled directly into Rova (fast, no
  external process, used for anything that must feel instant), or
- **By a specialist subprocess** — an existing FOSS tool run in the
  background for heavy, non-real-time operations (filters, exports).

Every feature decision starts by asking: *does this need to respond in
milliseconds (native), or can it take a moment (subprocess)?*

## 2. Tech Stack

- **Shell / app framework:** Tauri (Rust backend + native webview frontend)
- **Core language:** Rust
- **Frontend:** TypeScript (SolidJS preferred over React for canvas-heavy UI
  — lighter reactivity overhead)
- **Graphics:** `wgpu` (cross-platform GPU access — Vulkan on Linux, Metal on
  macOS, DirectX on Windows, from one codebase) + `tiny-skia` (CPU-side 2D
  compositing/blend modes)
- **Packaging:** Flatpak (primary), AppImage (secondary), cross-platform
  builds via Tauri for Windows/macOS

## 3. Mode-by-Mode Implementation

### Forge (Vector) — fully native, no bundled app

- **Parsing:** `usvg` — reads SVG into a clean in-memory tree
- **Geometry:** `lyon` — path booleans, offsetting, stroke-to-fill,
  triangulation for GPU rendering
- **Rendering:** `resvg` (built on `tiny-skia`) for rasterization/export;
  `wgpu` draws the triangulated shapes for the interactive canvas
- **Why no Inkscape:** `resvg`/`usvg`/`lyon` are pure Rust, MIT-licensed,
  <3MB, zero external dependencies, and run in-process — no subprocess
  latency, no GTK runtime to bundle. Editing and rendering both happen
  natively in microseconds.
- **Gap to plan for:** `usvg` is read-focused; writing the tree back to
  `.svg` text for export needs a small serialization step.

### Lumen (Raster) — native canvas + Krita for heavy lifting

- **Interactive canvas:** layer stack = multiple GPU textures composited via
  `wgpu`; brush strokes computed with `tiny-skia` and blended into the active
  texture in real time.
- **Heavy operations (filters, complex effects):** bundled Krita, invoked via
  `kritarunner` — Krita's headless Python automation runner. Rova writes the
  current layer(s) to a `.kra` file, runs a `kritarunner` script against
  `libkis` (Krita's stable scripting API), reads the result back.
- **Why this split:** brush strokes must be instant; filters can show a
  "processing..." state. `libkis` is explicitly maintained as a stable
  contract, making this a durable integration point.

### Folio (Page Layout) — native canvas + Scribus for PDF export

- **Interactive canvas:** text frames, image frames, shapes positioned on a
  page via `wgpu`; text shaping/reflow via `cosmic-text` (pure Rust).
- **PDF export:** bundled Scribus, invoked headless (`-g` flag, no GUI) with
  a Python script using Scribus's Scripter API (`PDFfile().save()`). Rova
  writes a `.sla` file, runs Scribus against an export script, reads back the
  PDF.
- **Known friction:** Scribus has no dedicated headless runner (unlike
  Krita's `kritarunner`) — this is a full subprocess launch with GUI
  suppressed. Pin a specific Scribus version/AppImage to avoid Python version
  mismatches across distros. (Reference: the `sla2pdf` project wraps this
  exact pattern.)

## 4. Local AI

- **Framework:** `Candle` (pure Rust ML framework, `wgpu`-compatible GPU
  backends) — no Python, no separate AI runtime.
- **Masking:** Segment Anything (SAM) — click/selection → precise object
  mask. Powers "smart select" in Lumen.
- **Generative fill:** Stable Diffusion — masked region + text prompt →
  generated pixels.
- **Isolation:** AI inference runs in its own subprocess (Rust binary using
  Candle) — GPU OOM or model crash affects only that process, not the whole
  app.
- **Distribution:** AI features are **optional, on-demand downloads** —
  models are NOT in the base install. Base install stays lean; AI features
  prompt the user before downloading (e.g., "Download Generative Fill model
  — 4.2GB?").
- **Privacy guarantee:** all inference is on-device. No image or prompt data
  ever leaves the machine. This is enforced by Flatpak sandboxing (see
  Packaging below), not just policy.

## 5. Plugin Architecture

- **Runtime:** a lightweight, embedded, sandboxed JS engine (pure Rust JS
  engine — not a bundled Node.js). WASM modules also supported for
  performance-critical plugins.
- **Manifest:** each plugin declares name, entry point, and a permissions
  list (filesystem, network, etc.) — **all permissions default to off.**
- **Lifecycle API** (the contract every plugin can implement):
  - `init()` — called on load
  - `onLayerSelect(layer)` — called when the active layer changes
  - `render(context)` — called if the plugin draws to the canvas
  - `onExport(document)` — called during export, for plugins that hook into
    output
- **Why embedded + sandboxed:** "installing a plugin" = dropping a folder in,
  not running `npm install`. Default-off permissions make the privacy-first
  promise enforceable, not just stated.

## 6. The Unified File Format (`.rova`)

Full spec in `docs/FILE_FORMAT.md`. Summary: a zip archive (extending the
OpenRaster convention) with a `manifest.json` describing a layer stack.
Layers are typed (`raster`, `vector`, `text`) and positioned via a shared
affine `transform`, regardless of which mode created them. The `manifest.json`
`activeStudio` field (`"forge"` | `"lumen"` | `"folio"`) controls which mode
the app opens to — it does NOT restrict what layer types a document can
contain.

## 7. Packaging & Runtime Strategy

- **Primary distribution:** Flatpak, submitted to Flathub.
- **Bundled engines:** Krita (headless via `kritarunner`) and Scribus
  (headless via Scripter API) — both Qt-based, both sit on the
  `org.kde.Platform` runtime. **One shared runtime, not two.**
- **No GTK runtime needed** — dropping Inkscape (GTK-based) means
  `org.gnome.Platform` is not required at all.
- **Estimated base install:** ~1.5–2.5GB (engines + one runtime stack),
  before optional AI models.
- **Sandboxing:** Flatpak sandbox configured with no network access by
  default — a concrete, auditable privacy claim.
- **Update model:** updating Rova = updating the whole bundle, including
  Krita/Scribus versions inside it. Release cadence is loosely coupled to
  upstream releases of those tools — track their security advisories.

## 8. Licensing & Attribution

- **Rova's own code:** permissive license (MIT or Apache-2.0 — TBD), enabling
  a healthy plugin ecosystem.
- **Krita & Scribus (GPL):** run as **separate subprocesses**, never linked
  into Rova's binary. This is the "borrowed car, not welded together"
  distinction — it keeps Rova's license separate from theirs.
- **resvg / usvg / lyon / Candle (MIT/Apache):** linked directly — no
  licensing complications.
- **Required:** a visible "Built With" / credits screen acknowledging Krita,
  Scribus, resvg, and every other dependency. This is both a legal courtesy
  and a trust-building signal to the FOSS communities Rova depends on.

## 9. Open Questions / Revisit Later

- Final license choice for Rova core (MIT vs Apache-2.0)
- Frontend framework: SolidJS vs alternatives (revisit once canvas
  performance is measurable)
- Whether Folio's text engine (`cosmic-text`) needs supplementing for
  complex multi-column layouts
- Cross-platform (Windows/macOS) Flatpak-equivalent packaging strategy
  (Flatpak is Linux-only — Tauri's native bundlers needed for other OSes)
