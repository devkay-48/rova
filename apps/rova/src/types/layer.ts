export type LayerType = "raster" | "vector";

export interface LayerTransform {
  translate: { x: number; y: number };
  scale: number;
  rotation: number;
}

export interface Layer {
  id: string;
  type: LayerType;
  src: string;
  transform: LayerTransform;
  opacity: number;
  visible: boolean;
}

export const defaultTransform = (): LayerTransform => ({
  translate: { x: 0, y: 0 },
  scale: 1,
  rotation: 0,
});
