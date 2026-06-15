# Rova — Roadmap

This roadmap is organized into phases. Each phase has a goal, a checklist,
and a "done when" milestone. Don't start a phase's checklist until the
previous phase's milestone is demonstrably working — this keeps scope honest
and avoids burnout.

---

## Phase 0 — Foundations (current)

**Goal:** Naming, architecture, and file format decisions locked in.

- [x] App name (Rova), mode names (Forge/Lumen/Folio), extension (`.rova`)
- [x] Tech stack decision (Tauri + Rust + wgpu)
- [x] Engine decisions (Krita via kritarunner, Scribus via Scripter API,
      resvg/usvg/lyon native for Forge, Inkscape dropped)
- [x] File format spec drafted (`docs/FILE_FORMAT.md`)
- [x] Licensing approach (open source core, GPL tools as subprocesses)

**Done when:** `docs/ARCHITECTURE.md` and `docs/FILE_FORMAT.md` exist and both
founders agree they're accurate.

---

## Phase 1 — Proof of Concept (Weeks 1–4)

**Goal:** One window that can render both a PNG layer and an SVG layer on
the same canvas, pan/zoom together, and save/load as `.rova`.

### Week 1 — Scaffolding
- [ ] Init Tauri project (Rust backend, SolidJS frontend)
- [ ] Confirm build runs on Linux first
- [ ] Stand up a minimal Flatpak build target early
- [ ] Render an empty `<canvas>` to confirm Tauri ↔ webview pipeline

### Week 2 — Layer model + dual rendering
- [ ] Define minimal TS layer interface: `{ id, type, src, transform, opacity }`
- [ ] Render a raster (PNG) layer via `drawImage`
- [ ] Render an SVG layer as an overlay with synced transform
- [ ] Implement pan/zoom moving both layers in lockstep

### Week 3 — File format I/O
- [ ] Add `zip` + `serde` (Rust) for `.rova` archive read/write
- [ ] Implement `manifest.json` (de)serialization per `docs/FILE_FORMAT.md`
- [ ] Build a sample `.rova` with one PNG + one SVG layer; load and render
- [ ] Implement save: serialize current state back into the archive

### Week 4 — Mode switcher + plugin stub
- [ ] Minimal studio tab UI (Forge / Lumen — Folio can wait)
- [ ] Define plugin lifecycle interface in TS (`init`, `render`,
      `onLayerSelect`, `onExport`) — unimplemented is fine, lock the shape
- [ ] **Milestone demo:** open a `.rova` file, see PNG + SVG composited
      correctly, select/move each layer independently, save, reopen, verify
      state persisted

**Done when:** the Week 4 milestone demo works end to end.

---

## Phase 2 — Forge MVP (Vector)

**Goal:** Forge becomes genuinely usable for basic vector work — not just
displaying an SVG, but editing it.

- [ ] Integrate `usvg` for parsing SVG into an editable tree
- [ ] Integrate `lyon` for path triangulation (GPU-renderable shapes)
- [ ] Basic shape tools: rectangle, ellipse, pen/path tool
- [ ] Node editing: select, move, add/delete nodes on a path
- [ ] Path boolean operations (union, subtract) via `lyon`
- [ ] SVG tree → `.svg` serialization for saving vector layers
- [ ] Basic fill/stroke styling (color, width)

**Done when:** a user can draw, edit, and style a simple vector shape (e.g.,
a logo with 2–3 shapes) entirely within Forge, save it, and reopen it with
all edits intact.

---

## Phase 3 — Lumen MVP (Raster)

**Goal:** A working paint canvas with at least one "send to Krita" round trip.

- [ ] `wgpu` texture-based layer stack for raster layers
- [ ] Basic brush engine (`tiny-skia` compositing — size, opacity, hardness)
- [ ] Layer blend modes (normal, multiply, screen — OpenRaster-compatible)
- [ ] `kritarunner` bridge: write active layer(s) to `.kra`, run a filter
      script via `libkis`, read result back
- [ ] First real filter via Krita bridge (e.g., Gaussian blur or a color
      adjustment) — proves the round trip end to end

**Done when:** a user can paint a basic raster layer natively AND apply at
least one Krita-powered filter to it, with the result appearing back in
Rova's canvas.

---

## Phase 4 — Folio MVP (Page Layout)

**Goal:** Basic page layout with PDF export via Scribus.

- [ ] Page-based canvas (frames for text/images/shapes) via `wgpu`
- [ ] Text shaping/reflow via `cosmic-text`
- [ ] `.sla` export of current layout for Scribus handoff
- [ ] Scribus headless bridge (`-g` + Scripter script) for PDF export
- [ ] Pin Scribus version/AppImage to avoid distro Python mismatches

**Done when:** a user can lay out a simple one-page document (a text block +
an image frame) and export it to PDF via the Scribus bridge.

---

## Phase 5 — Plugin SDK

**Goal:** A real plugin can be written by someone outside the core team.

- [ ] Embed a sandboxed JS engine (pure Rust, not Node)
- [ ] Implement the lifecycle API: `init`, `onLayerSelect`, `render`,
      `onExport`
- [ ] Permission system (filesystem/network — default OFF)
- [ ] Plugin manifest format + loader
- [ ] WASM plugin support (alongside JS)
- [ ] Write one reference plugin (e.g., a simple filter or export format)
      and document the process

**Done when:** a contributor unfamiliar with Rova's core can follow
`CONTRIBUTING.md` alone and ship a working plugin.

---

## Phase 6 — Local AI

**Goal:** Optional, on-device AI features for Lumen.

- [ ] Integrate `Candle` as a separate subprocess
- [ ] SAM integration for "smart select" / masking
- [ ] On-demand model download flow (with size disclosure to user)
- [ ] Stable Diffusion integration for generative fill
- [ ] Verify: zero network calls during inference (Flatpak sandbox audit)

**Done when:** a user can click an object, get a clean mask via SAM, and
optionally generate fill content via SD — all without any network access
after the initial model download.

---

## Phase 7 — Packaging & Distribution

**Goal:** Public, installable Rova.

- [ ] Finalize Flatpak manifest: Krita + Scribus on shared `org.kde.Platform`
- [ ] First-launch "what's included and why" screen (size transparency)
- [ ] Credits/attribution screen (Krita, Scribus, resvg, usvg, lyon, Candle,
      etc.)
- [ ] Submit to Flathub
- [ ] Cross-platform builds (Windows/macOS) via Tauri's native bundlers

**Done when:** Rova is installable from Flathub by someone who has never
heard of the project.

---

## Notes on Sequencing

- Forge (Phase 2) comes before Lumen/Folio deliberately — it has zero
  external subprocess dependencies, so it's the fastest path to "something
  real works."
- Plugin SDK (Phase 5) comes after the three modes have *some* MVP — plugins
  need real lifecycle events (`onLayerSelect`, etc.) to hook into, which only
  exist once layers/modes are functional.
- AI (Phase 6) is intentionally late and optional — it's the least load-bearing
  part of the core pitch and shouldn't block anything else.
