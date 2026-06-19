import { createStore } from "solid-js/store";
import { Layer, LayerTransform, defaultTransform } from "../types/layer";

export interface CanvasState {
  layers: Layer[];
  // Viewport pan/zoom — applies to the whole canvas, not per-layer
  viewport: LayerTransform;
}

const [canvasState, setCanvasState] = createStore<CanvasState>({
  layers: [],
  viewport: defaultTransform(),
});

// --- Layer ops ---

export function addLayer(layer: Layer) {
  setCanvasState("layers", (prev) => [...prev, layer]);
}

export function removeLayer(id: string) {
  setCanvasState("layers", (prev) => prev.filter((l) => l.id !== id));
}

export function updateLayer(id: string, patch: Partial<Layer>) {
  setCanvasState("layers", (l) => l.id === id, patch as any);
}

export function setLayerTransform(id: string, transform: LayerTransform) {
  setCanvasState("layers", (l) => l.id === id, "transform", transform);
}

// --- Viewport ops ---

export function panViewport(dx: number, dy: number) {
  setCanvasState("viewport", "translate", (t) => ({
    x: t.x + dx,
    y: t.y + dy,
  }));
}

export function zoomViewport(delta: number, originX: number, originY: number) {
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 32;

  setCanvasState("viewport", (vp) => {
    const newScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, vp.scale * (1 + delta))
    );
    const ratio = newScale / vp.scale;

    // Zoom toward cursor: adjust translate so the point under the cursor
    // stays fixed as scale changes
    return {
      ...vp,
      scale: newScale,
      translate: {
        x: originX + (vp.translate.x - originX) * ratio,
        y: originY + (vp.translate.y - originY) * ratio,
      },
    };
  });
}

export function resetViewport() {
  setCanvasState("viewport", defaultTransform());
}

export { canvasState };
