# Rova File Format (`.rova`)

## Overview

A `.rova` file is a **zip archive** extending the OpenRaster (`.ora`)
convention: a flattened preview image plus a structured layer stack. Rova
adds support for vector and text layer types alongside raster, all sharing
one coordinate space.

A `.rova` document is **mode-agnostic** — it can contain any mix of raster,
vector, and text layers regardless of which mode (Forge/Lumen/Folio) it was
created in or is currently open in.

## Directory Structure

```
project.rova  (zip archive)
├── manifest.json
├── mergedimage.png          # flattened preview (OpenRaster convention)
├── thumbnails/
│   └── thumbnail.png
├── layers/
│   ├── 001-background.png        # raster layer (lossless PNG)
│   ├── 002-vector-shapes.svg      # vector layer (raw SVG fragment)
│   └── 003-headline.json          # text layer (runs, font refs, styling)
└── assets/
    ├── fonts/
    └── linked-images/
```

## `manifest.json` Schema

```json
{
  "version": "0.1",
  "document": {
    "width": 1080,
    "height": 1080,
    "unit": "px",
    "dpi": 300
  },
  "activeStudio": "forge",
  "layers": [
    {
      "id": "001",
      "type": "raster",
      "name": "Background",
      "src": "layers/001-background.png",
      "transform": [1, 0, 0, 1, 0, 0],
      "opacity": 1,
      "blendMode": "normal",
      "visible": true
    },
    {
      "id": "002",
      "type": "vector",
      "name": "Logo Shapes",
      "src": "layers/002-vector-shapes.svg",
      "transform": [1, 0, 0, 1, 120, 80],
      "opacity": 1,
      "blendMode": "normal",
      "visible": true
    },
    {
      "id": "003",
      "type": "text",
      "name": "Headline",
      "src": "layers/003-headline.json",
      "transform": [1, 0, 0, 1, 40, 900],
      "opacity": 1,
      "blendMode": "normal",
      "visible": true
    }
  ]
}
```

### Field Reference

| Field | Type | Notes |
|-------|------|-------|
| `version` | string | Format version, for future migration |
| `document.width/height` | number | Canvas size in `unit` |
| `document.unit` | string | `"px"`, `"mm"`, `"in"`, etc. |
| `document.dpi` | number | Used for export/print sizing |
| `activeStudio` | string | `"forge"` \| `"lumen"` \| `"folio"` — which mode the app opens to. Does NOT restrict layer types. |
| `layers[].id` | string | Unique within the document |
| `layers[].type` | string | `"raster"` \| `"vector"` \| `"text"` |
| `layers[].src` | string | Path within the archive to the layer's data |
| `layers[].transform` | number[6] | Affine matrix `[a, b, c, d, e, f]` — shared coordinate space across ALL layer types |
| `layers[].opacity` | number | 0–1 |
| `layers[].blendMode` | string | `"normal"`, `"multiply"`, etc. (OpenRaster blend mode names) |
| `layers[].visible` | boolean | Layer visibility toggle |

## Layer Type Details

### Raster (`type: "raster"`)
- `src` points to a lossless PNG.
- Rendered as a `wgpu` texture, composited via the layer stack.

### Vector (`type: "vector"`)
- `src` points to a raw SVG fragment (not a full `<svg>` document — no
  outer width/height/viewBox; those come from `document` + `transform`).
- Parsed via `usvg`, rendered via `resvg`/`lyon`.

### Text (`type: "text"`)
- `src` points to a JSON file describing text runs, font references
  (resolved against `assets/fonts/`), and styling (size, color, alignment,
  line height).
- Shaped/rendered via `cosmic-text`.

## Open Items

- [ ] Finalize text layer JSON sub-schema (runs, styling properties)
- [ ] Define SVG serialization step for writing `usvg` trees back to
      `layers/*.svg` on save
- [ ] Decide on a migration strategy for `version` bumps
- [ ] Confirm OpenRaster blend mode name compatibility list
