export type ImageMode = 'threshold' | 'floyd' | 'atkinson' | 'grey';

export interface ImageSettings {
  mode: ImageMode;
  threshold: number;
  brightness: number;
  contrast: number;
  invert: boolean;
}

export const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  mode: 'floyd',
  threshold: 128,
  brightness: 0,
  contrast: 0,
  invert: false,
};

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The image could not be loaded'));
    img.src = src;
  });
}

/**
 * Converts an image to black and white at the given size in dots.
 * The result is a PNG data URL with transparent white areas.
 */
/** Largest side of a processed image, in dots. A 500 mm label at 300 dpi is about 5,900 dots. */
const MAX_IMAGE_PX = 6000;

export async function processImage(src: string, widthPx: number, heightPx: number, s: ImageSettings): Promise<string> {
  const img = await loadImage(src);
  // Keep the aspect ratio when the size is more than the limit.
  const fit = Math.min(1, MAX_IMAGE_PX / Math.max(1, widthPx, heightPx));
  const w = Math.max(1, Math.round((Number.isFinite(widthPx) ? widthPx : 1) * fit));
  const h = Math.max(1, Math.round((Number.isFinite(heightPx) ? heightPx : 1) * fit));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  const grey = new Float32Array(w * h);
  const c = (s.contrast / 100) * 255;
  const factor = (259 * (c + 255)) / (255 * (259 - c));
  for (let i = 0; i < w * h; i++) {
    let v = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    v = factor * (v - 128) + 128 + s.brightness * 2.55;
    if (s.invert) v = 255 - v;
    grey[i] = Math.max(0, Math.min(255, v));
  }

  if (s.mode === 'floyd') floydSteinberg(grey, w, h, s.threshold);
  else if (s.mode === 'atkinson') atkinson(grey, w, h, s.threshold);
  else if (s.mode === 'threshold') for (let i = 0; i < grey.length; i++) grey[i] = grey[i] < s.threshold ? 0 : 255;

  for (let i = 0; i < w * h; i++) {
    const v = grey[i];
    if (s.mode === 'grey') {
      px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v;
      px[i * 4 + 3] = 255;
    } else {
      px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = 0;
      px[i * 4 + 3] = v < 128 ? 255 : 0;
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL('image/png');
}

function floydSteinberg(g: Float32Array, w: number, h: number, t: number): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = g[i];
      const nv = old < t ? 0 : 255;
      g[i] = nv;
      const err = old - nv;
      if (x + 1 < w) g[i + 1] += (err * 7) / 16;
      if (y + 1 < h) {
        if (x > 0) g[i + w - 1] += (err * 3) / 16;
        g[i + w] += (err * 5) / 16;
        if (x + 1 < w) g[i + w + 1] += err / 16;
      }
    }
  }
}

function atkinson(g: Float32Array, w: number, h: number, t: number): void {
  const offsets = [
    [1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2],
  ];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = g[i];
      const nv = old < t ? 0 : 255;
      g[i] = nv;
      const err = (old - nv) / 8;
      for (const [dx, dy] of offsets) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < w && ny < h) g[ny * w + nx] += err;
      }
    }
  }
}
