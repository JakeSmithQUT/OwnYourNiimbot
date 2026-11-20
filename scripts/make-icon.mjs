// Draws the application icon and writes build/icon.png (1024 x 1024).
// electron-builder makes the Windows .ico and macOS .icns files from it.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const SIZE = 1024;
const SS = 3; // samples per axis for anti-aliasing

function roundedRect(x, y, x0, y0, x1, y1, r) {
  const cx = Math.max(x0 + r, Math.min(x, x1 - r));
  const cy = Math.max(y0 + r, Math.min(y, y1 - r));
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r && x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

const BARS = [0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1];

function sample(x, y) {
  // Background tile with a diagonal gradient.
  if (!roundedRect(x, y, 40, 40, 984, 984, 210)) return null;
  const t = (x + y) / (2 * SIZE);
  let rgb = [37 + (124 - 37) * t, 99 + (58 - 99) * t, 235 + (237 - 235) * t];

  // White label with a punched hole on the left.
  const inLabel = roundedRect(x, y, 170, 300, 854, 724, 70);
  const inHole = (x - 265) ** 2 + (y - 512) ** 2 <= 42 ** 2;
  if (inLabel && !inHole) {
    rgb = [255, 255, 255];
    // Barcode on the label.
    if (x >= 380 && x < 380 + BARS.length * 18 && y >= 380 && y <= 600) {
      const i = Math.floor((x - 380) / 18);
      if (BARS[i]) rgb = [22, 24, 29];
    }
    // Text line under the barcode.
    if (roundedRect(x, y, 380, 630, 760, 662, 16)) rgb = [22, 24, 29];
  }
  return rgb;
}

const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;
  for (let x = 0; x < SIZE; x++) {
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const c = sample(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
        if (c) {
          r += c[0];
          g += c[1];
          b += c[2];
          a++;
        }
      }
    }
    const o = y * (SIZE * 4 + 1) + 1 + x * 4;
    if (a) {
      raw[o] = Math.round(r / a);
      raw[o + 1] = Math.round(g / a);
      raw[o + 2] = Math.round(b / a);
    }
    raw[o + 3] = Math.round((a / (SS * SS)) * 255);
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;
ihdr[9] = 6;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync('build', { recursive: true });
writeFileSync('build/icon.png', png);
console.log(`Wrote build/icon.png (${png.length} bytes)`);
