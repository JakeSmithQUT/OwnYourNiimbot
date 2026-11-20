import { encodePacket, Req, u16 } from './protocol';

/** A 1-bit image ready for the printer. Each row is packed MSB first, 1 = black dot. */
export interface MonoImage {
  cols: number;
  rows: number;
  bytesPerRow: number;
  data: Uint8Array;
}

export interface RasterOptions {
  /** Luminance (0 to 255) at or below which a pixel prints black. */
  threshold?: number;
  invert?: boolean;
}

/** Converts RGBA pixels to a packed 1-bit image. Transparent pixels count as white. */
export function rgbaToMono(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number, opts: RasterOptions = {}): MonoImage {
  const threshold = opts.threshold ?? 127;
  const bytesPerRow = Math.ceil(width / 8);
  const data = new Uint8Array(bytesPerRow * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = rgba[i + 3] / 255;
      const lum = (0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]) * a + 255 * (1 - a);
      let black = lum <= threshold;
      if (opts.invert) black = !black;
      if (black) data[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return { cols: width, rows: height, bytesPerRow, data };
}

export function getPixel(img: MonoImage, x: number, y: number): boolean {
  return (img.data[y * img.bytesPerRow + (x >> 3)] & (0x80 >> (x & 7))) !== 0;
}

/** Rotates a mono image clockwise by 90, 180 or 270 degrees. */
export function rotateMono(img: MonoImage, degrees: number): MonoImage {
  const d = ((degrees % 360) + 360) % 360;
  if (d === 0) return img;
  const swap = d === 90 || d === 270;
  const cols = swap ? img.rows : img.cols;
  const rows = swap ? img.cols : img.rows;
  const bytesPerRow = Math.ceil(cols / 8);
  const data = new Uint8Array(bytesPerRow * rows);
  for (let y = 0; y < img.rows; y++) {
    for (let x = 0; x < img.cols; x++) {
      if (!getPixel(img, x, y)) continue;
      let nx: number;
      let ny: number;
      if (d === 90) {
        nx = img.rows - 1 - y;
        ny = x;
      } else if (d === 180) {
        nx = img.cols - 1 - x;
        ny = img.rows - 1 - y;
      } else {
        nx = y;
        ny = img.cols - 1 - x;
      }
      data[ny * bytesPerRow + (nx >> 3)] |= 0x80 >> (nx & 7);
    }
  }
  return { cols, rows, bytesPerRow, data };
}

/**
 * Fits the image width to the print head. A wider image is cropped, a
 * narrower image is kept as it is. Alignment decides which side is cropped.
 */
export function fitToPrinthead(img: MonoImage, headDots: number, align: 'left' | 'center' | 'right' = 'center'): MonoImage {
  if (img.cols <= headDots) return img;
  const cols = headDots;
  const start = align === 'left' ? 0 : align === 'right' ? img.cols - cols : Math.floor((img.cols - cols) / 2);
  const bytesPerRow = Math.ceil(cols / 8);
  const data = new Uint8Array(bytesPerRow * img.rows);
  for (let y = 0; y < img.rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (getPixel(img, x + start, y)) data[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return { cols, rows: img.rows, bytesPerRow, data };
}

/**
 * Black dot counts for a bitmap row packet. The head is split in three equal
 * parts and each part gets one byte. If a part has more than 255 dots, the
 * total is sent as a 16-bit value in the last two bytes.
 */
export function rowDotCounts(row: Uint8Array, headDots: number): [number, number, number] {
  const partSize = Math.max(1, Math.ceil(headDots / 3));
  const parts = [0, 0, 0];
  let total = 0;
  for (let byte = 0; byte < row.length; byte++) {
    const v = row[byte];
    if (!v) continue;
    for (let bit = 0; bit < 8; bit++) {
      if (v & (0x80 >> bit)) {
        total++;
        parts[Math.min(2, Math.floor((byte * 8 + bit) / partSize))]++;
      }
    }
  }
  if (parts.every((p) => p <= 0xff)) return [parts[0], parts[1], parts[2]];
  return [0, (total >> 8) & 0xff, total & 0xff];
}

function rowsEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function isEmpty(row: Uint8Array): boolean {
  for (let i = 0; i < row.length; i++) if (row[i]) return false;
  return true;
}

/**
 * Converts an image into row packets. Identical rows next to each other are
 * sent once with a repeat count. Blank rows use the shorter empty-row packet.
 */
export function imageToRowPackets(img: MonoImage, headDots: number): Uint8Array[] {
  const packets: Uint8Array[] = [];
  let y = 0;
  while (y < img.rows) {
    const row = img.data.subarray(y * img.bytesPerRow, (y + 1) * img.bytesPerRow);
    let repeat = 1;
    while (y + repeat < img.rows && repeat < 0xff) {
      const next = img.data.subarray((y + repeat) * img.bytesPerRow, (y + repeat + 1) * img.bytesPerRow);
      if (!rowsEqual(row, next)) break;
      repeat++;
    }
    if (isEmpty(row)) {
      packets.push(encodePacket(Req.PrintEmptyRow, [...u16(y), repeat]));
    } else {
      const counts = rowDotCounts(row, headDots);
      packets.push(encodePacket(Req.PrintBitmapRow, [...u16(y), ...counts, repeat, ...row]));
    }
    y += repeat;
  }
  return packets;
}
