/**
 * The size of an image that fits inside a box and keeps its aspect ratio.
 * An image without a usable size, for example an SVG file without one, fills
 * the box.
 */
export function fitInside(boxW: number, boxH: number, imageW: number, imageH: number): { width: number; height: number } {
  if (!Number.isFinite(imageW) || !Number.isFinite(imageH) || imageW <= 0 || imageH <= 0) return { width: boxW, height: boxH };
  const scale = Math.min(boxW / imageW, boxH / imageH);
  return { width: imageW * scale, height: imageH * scale };
}
