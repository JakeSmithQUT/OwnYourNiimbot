// Reads the width and height of an embedded image from its header, without
// decoding the image. A small file can describe a very large image, so label
// files are checked with this before the app decodes their images.

export interface ImageSize {
  width: number;
  height: number;
}

/** Base64 characters to decode for the header. JPEG files can have metadata before the size. */
const HEADER_CHARS = 1_400_000;

function headerBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(',');
  let b64 = dataUrl.slice(comma + 1, comma + 1 + HEADER_CHARS).replace(/[^A-Za-z0-9+/]/g, '');
  b64 = b64.slice(0, b64.length - (b64.length % 4));
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const u16be = (b: Uint8Array, i: number) => (b[i] << 8) | b[i + 1];
const u16le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u32be = (b: Uint8Array, i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const i32le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24);
const text = (b: Uint8Array, i: number, n: number) => String.fromCharCode(...b.subarray(i, i + n));

function jpegSize(b: Uint8Array): ImageSize | null {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i++;
      continue;
    }
    // Start-of-frame markers hold the size. C4, C8 and CC are other segments.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: u16be(b, i + 5), width: u16be(b, i + 7) };
    }
    if (marker === 0xd9 || marker === 0xda) return null;
    i += 2 + u16be(b, i + 2);
  }
  return null;
}

/**
 * The size of a PNG, JPEG, GIF, BMP or WebP data URL, or null if the header
 * is not valid or not found. SVG has no pixel size and also gives null.
 */
export function imageSize(dataUrl: string): ImageSize | null {
  let b: Uint8Array;
  try {
    b = headerBytes(dataUrl);
  } catch {
    return null;
  }
  if (b.length >= 24 && b[0] === 0x89 && text(b, 1, 3) === 'PNG' && text(b, 12, 4) === 'IHDR') return { width: u32be(b, 16), height: u32be(b, 20) };
  if (b.length >= 10 && text(b, 0, 4) === 'GIF8') return { width: u16le(b, 6), height: u16le(b, 8) };
  if (b.length >= 26 && text(b, 0, 2) === 'BM') return { width: Math.abs(i32le(b, 18)), height: Math.abs(i32le(b, 22)) };
  if (b.length >= 30 && text(b, 0, 4) === 'RIFF' && text(b, 8, 4) === 'WEBP') {
    const chunk = text(b, 12, 4);
    if (chunk === 'VP8 ') return { width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
    if (chunk === 'VP8L') return { width: 1 + (((b[22] & 0x3f) << 8) | b[21]), height: 1 + (((b[24] & 0x0f) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6)) };
    if (chunk === 'VP8X') return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
    return null;
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) return jpegSize(b);
  return null;
}
