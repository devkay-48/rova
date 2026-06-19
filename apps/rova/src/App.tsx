import { Component, onMount } from "solid-js";
import Canvas from "./components/Canvas";
import { addLayer, resetViewport } from "./store/canvas";
import { defaultTransform } from "./types/layer";

// Drop-in test assets — swap these for real paths once you have them.
// Any publicly hosted PNG/SVG works during dev; Tauri asset:// URLs work in prod.
const DEMO_RASTER_SRC = "https://picsum.photos/seed/rova/800/600";
const DEMO_SVG_SRC =
  "data:image/svg+xml," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
  <rect x="20" y="20" width="260" height="160" rx="12"
        fill="none" stroke="#C4622D" stroke-width="3"/>
  <text x="150" y="115" font-family="sans-serif" font-size="28"
        fill="#C4622D" text-anchor="middle">SVG layer</text>
</svg>
`);

const App: Component = () => {
  onMount(() => {
    // Seed two demo layers so Week 2 is immediately visible on launch
    addLayer({
      id: "layer-raster-demo",
      type: "raster",
      src: DEMO_RASTER_SRC,
      transform: defaultTransform(),
      opacity: 1,
      visible: true,
    });

    addLayer({
      id: "layer-svg-demo",
      type: "vector",
      src: DEMO_SVG_SRC,
      transform: {
        translate: { x: 50, y: 80 }, // offset so it sits visibly over the raster
        scale: 1,
        rotation: 0,
      },
      opacity: 0.9,
      visible: true,
    });
  });

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        width: "100vw",
        height: "100vh",
        background: "#111",
        color: "#e8e0d5",
        "font-family": "sans-serif",
      }}
    >
      {/* Minimal toolbar — just enough for Week 2 testing */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          padding: "8px 16px",
          background: "#1e1e1e",
          "border-bottom": "1px solid #2a2a2a",
          "align-items": "center",
          "font-size": "13px",
        }}
      >
        <span style={{ "font-weight": "600", "letter-spacing": "0.05em" }}>
          ROVA
        </span>
        <span style={{ color: "#555", "margin-left": "8px" }}>
          Scroll to pan · Ctrl+Scroll to zoom · Middle-click drag to pan
        </span>
        <button
          style={{
            "margin-left": "auto",
            padding: "4px 12px",
            background: "#2a2a2a",
            border: "1px solid #3a3a3a",
            color: "#e8e0d5",
            "border-radius": "4px",
            cursor: "pointer",
            "font-size": "12px",
          }}
          onClick={resetViewport}
        >
          Reset view
        </button>
      </div>

      {/* Canvas fills the rest */}
      <div style={{ flex: "1", position: "relative" }}>
        <Canvas />
      </div>
    </div>
  );
};

export default App;
