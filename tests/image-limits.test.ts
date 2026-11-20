import { describe, expect, it } from 'vitest';
import { imageSize } from '../src/renderer/editor/imageSize';
import { validateTemplate } from '../src/renderer/editor/validate';
import { safeFileName } from '../src/main/files';

const b64 = (bytes: number[]) => btoa(String.fromCharCode(...bytes));
const u32 = (v: number) => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
/** A PNG header that claims a size. The image data is not needed for the check. */
const pngClaiming = (w: number, h: number) =>
  `data:image/png;base64,${b64([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, ...u32(w), ...u32(h), 8, 6, 0, 0, 0, 0, 0, 0, 0])}`;
const ONE_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const label = (objects: unknown[]) => ({ name: 'T', widthMm: 50, heightMm: 30, labelType: 1, canvas: { version: '7', objects } });

describe('image size from the header', () => {
  it('reads PNG, GIF, BMP, WebP and JPEG sizes', () => {
    expect(imageSize(ONE_PIXEL)).toEqual({ width: 1, height: 1 });
    expect(imageSize(pngClaiming(16000, 9000))).toEqual({ width: 16000, height: 9000 });
    expect(imageSize(`data:image/gif;base64,${b64([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x40, 0x01, 0xf0, 0x00, 0, 0])}`)).toEqual({ width: 320, height: 240 });
    const bmp = [0x42, 0x4d, ...Array(16).fill(0), 0x80, 0x02, 0, 0, 0xe0, 0x01, 0, 0, 0, 0];
    expect(imageSize(`data:image/bmp;base64,${b64(bmp)}`)).toEqual({ width: 640, height: 480 });
    const vp8x = [...'RIFF'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WEBPVP8X'].map((c) => c.charCodeAt(0)), [10, 0, 0, 0, 0, 0, 0, 0], [0x1f, 0x03, 0x00, 0xdf, 0x01, 0x00]);
    expect(imageSize(`data:image/webp;base64,${b64(vp8x)}`)).toEqual({ width: 800, height: 480 });
    // JPEG: an APP0 segment, then a start-of-frame segment with height 1080 and width 1920.
    const jpeg = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0, 0, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x04, 0x38, 0x07, 0x80, 0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(imageSize(`data:image/jpeg;base64,${b64(jpeg)}`)).toEqual({ width: 1920, height: 1080 });
    expect(imageSize('data:image/png;base64,iVBORw0KGgo=')).toBeNull();
  });

  it('refuses label images that decode to too many pixels', () => {
    expect(() => validateTemplate(label([{ type: 'Image', src: ONE_PIXEL, width: 1, height: 1 }]))).not.toThrow();
    expect(() => validateTemplate(label([{ type: 'Image', src: pngClaiming(16000, 16000), width: 10, height: 10 }]))).toThrow(/too large/);
    expect(() => validateTemplate(label([{ type: 'Image', src: 'data:image/png;base64,iVBORw0KGgo=', width: 10, height: 10 }]))).toThrow(/not a valid image/);
    // Each image is under the limit, but together they are more than the label limit.
    const many = Array.from({ length: 3 }, () => ({ type: 'Image', src: pngClaiming(6000, 6000), width: 10, height: 10 }));
    expect(() => validateTemplate(label(many))).toThrow(/together/);
    // The original photo can be larger than a print image.
    expect(() => validateTemplate(label([{ type: 'Image', src: ONE_PIXEL, width: 1, height: 1, oyn: { kind: 'image', original: pngClaiming(8000, 6000) } }]))).not.toThrow();
  });
});

describe('save dialog file name', () => {
  it('removes folders and characters that Windows does not allow', () => {
    const startup = ['..', '..', 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'x.oynlabel.json'].join(String.fromCharCode(92));
    expect(safeFileName(startup, 'label.json')).not.toMatch(/[\\/]/);
    expect(safeFileName(startup, 'label.json')).toMatch(/x\.oynlabel\.json$/);
    expect(safeFileName('../../etc/x.png', 'label.png')).toBe('_.._etc_x.png');
    expect(safeFileName('Server: web01?.png', 'label.png')).toBe('Server_ web01_.png');
    expect(safeFileName('   ', 'label.json')).toBe('label.json');
    expect(safeFileName(undefined, 'label.json')).toBe('label.json');
  });
});
