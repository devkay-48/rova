import {
  Component,
  createEffect,
  onMount,
  onCleanup,
  For,
} from "solid-js";
import { canvasState, panViewport, zoomViewport } from "../store/canvas";
import { Layer } from "../types/layer";

// ─── Raster rendering ────────────────────────────────────────────────────────

function drawRasterLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  vpTx: number,
  vpTy: number,
  vpScale: number
) {
  const img = new Image();
  img.src = layer.src;

  const render = () => {
    ctx.save();
    ctx.globalAlpha = layer.opacity;

    // Apply viewport transform first, then per-layer transform on top
    const tx = vpTx + layer.transform.translate.x * vpScale;
    const ty = vpTy + layer.transform.translate.y * vpScale;
    const sc = vpScale * layer.transform.scale;

    ctx.translate(tx, ty);
    ctx.rotate(layer.transform.rotation);
    ctx.scale(sc, sc);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  };

  if (img.complete) {
    render();
  } else {
    img.onload = render;
  }
}

function redrawRaster(
  canvas: HTMLCanvasElement,
  layers: Layer[],
  vpTx: number,
  vpTy: number,
  vpScale: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const layer of layers) {
    if (!layer.visible || layer.type !== "raster") continue;
    drawRasterLayer(ctx, layer, vpTx, vpTy, vpScale);
  }
}

// ─── SVG overlay transform ────────────────────────────────────────────────────

function svgLayerTransform(layer: Layer, vpTx: number, vpTy: number, vpScale: number) {
  const tx = vpTx + layer.transform.translate.x * vpScale;
  const ty = vpTy + layer.transform.translate.y * vpScale;
  const sc = vpScale * layer.transform.scale;
  return `translate(${tx}px, ${ty}px) scale(${sc}) rotate(${layer.transform.rotation}rad)`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Canvas: Component = () => {
  let canvasEl!: HTMLCanvasElement;
  let containerEl!: HTMLDivElement;

  // Pan state
  let isPanning = false;
  let lastX = 0;
  let lastY = 0;

  // ── Raster: redraw whenever layers or viewport changes ──
  createEffect(() => {
    const vp = canvasState.viewport;
    const layers = canvasState.layers;

    if (!canvasEl) return;

    redrawRaster(
      canvasEl,
      layers,
      vp.translate.x,
      vp.translate.y,
      vp.scale
    );
  });

  // ── Resize canvas to match container ──
  onMount(() => {
    const ro = new ResizeObserver(() => {
      canvasEl.width = containerEl.clientWidth;
      canvasEl.height = containerEl.clientHeight;
      // Trigger redraw after resize
      const vp = canvasState.viewport;
      redrawRaster(
        canvasEl,
        canvasState.layers,
        vp.translate.x,
        vp.translate.y,
        vp.scale
      );
    });
    ro.observe(containerEl);
    onCleanup(() => ro.disconnect());
  });

  // ── Input handlers ──

  function onPointerDown(e: PointerEvent) {
    // Middle mouse or Space+drag for pan (Space handled at app level later)
    if (e.button === 1 || e.button === 0) {
      isPanning = true;
      lastX = e.clientX;
      lastY = e.clientY;
      containerEl.setPointerCapture(e.pointerId);
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!isPanning) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    panViewport(dx, dy);
  }

  function onPointerUp(e: PointerEvent) {
    isPanning = false;
    containerEl.releasePointerCapture(e.pointerId);
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Pinch-to-zoom or ctrl+scroll → zoom
      const rect = containerEl.getBoundingClientRect();
      const originX = e.clientX - rect.left;
      const originY = e.clientY - rect.top;
      // deltaY is pixels; normalise to a small ratio
      const delta = -e.deltaY * 0.001;
      zoomViewport(delta, originX, originY);
    } else {
      // Plain scroll → pan
      panViewport(-e.deltaX, -e.deltaY);
    }
  }

  // ── SVG layers ──
  const svgLayers = () =>
    canvasState.layers.filter((l) => l.visible && l.type === "vector");

  return (
    <div
      ref={containerEl}
      class="rova-canvas-container"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        cursor: isPanning ? "grabbing" : "default",
        "background-color": "#1a1a1a",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
    >
      {/* Raster layer: drawn via Canvas 2D API */}
      <canvas
        ref={canvasEl}
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          "pointer-events": "none",
        }}
      />

      {/* SVG layers: DOM overlay, transform-synced with viewport */}
      <For each={svgLayers()}>
        {(layer) => (
          <img
            src={layer.src}
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              opacity: layer.opacity,
              transform: svgLayerTransform(
                layer,
                canvasState.viewport.translate.x,
                canvasState.viewport.translate.y,
                canvasState.viewport.scale
              ),
              "transform-origin": "0 0",
              "pointer-events": "none",
              // Prevent browser from auto-sizing the img
              width: "auto",
              height: "auto",
              "max-width": "none",
            }}
            draggable={false}
          />
        )}
      </For>
    </div>
  );
};

export default Canvas;
