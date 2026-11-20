import { describe, expect, it } from 'vitest';
import { outsideArea, printArea } from '../src/printer/printArea';
import { fitToPrinthead, getPixel, rotateMono, type MonoImage } from '../src/printer/encoder';
import { findModelByName, pixelsPerMm, printheadDots, type PrinterModel } from '../src/printer/models';

/** A label image that is black inside the computed print area and white outside it. */
function labelImage(widthMm: number, heightMm: number, model: PrinterModel, flip: boolean): { img: MonoImage; cols: number; rows: number } {
  const dpm = pixelsPerMm(model.dpi);
  const cols = Math.round(widthMm * dpm);
  const rows = Math.round(heightMm * dpm);
  const a = printArea(widthMm, heightMm, model, flip);
  const bytesPerRow = Math.ceil(cols / 8);
  const data = new Uint8Array(bytesPerRow * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const inside = x >= Math.round(a.x * dpm) && x < Math.round((a.x + a.width) * dpm) && y >= Math.round(a.y * dpm) && y < Math.round((a.y + a.height) * dpm);
      if (inside) data[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return { img: { cols, rows, bytesPerRow, data }, cols, rows };
}

/** Runs the real print pipeline and checks that every printed dot is black, so the area is exactly what prints. */
function printsWholeArea(widthMm: number, heightMm: number, model: PrinterModel, flip = false): boolean {
  const { img } = labelImage(widthMm, heightMm, model, flip);
  let rotation = model.printDirection === 90 || model.printDirection === 270 ? model.printDirection : 0;
  if (flip) rotation += 180;
  const printed = fitToPrinthead(rotateMono(img, rotation), printheadDots(model), model.align);
  for (let y = 0; y < printed.rows; y++) for (let x = 0; x < printed.cols; x++) if (!getPixel(printed, x, y)) return false;
  return true;
}

describe('print area', () => {
  const h1s = findModelByName('H1S')!;
  const b1 = findModelByName('B1')!;

  it('gives the middle 12 mm of a 15 mm label on the H1S', () => {
    const a = printArea(51.1, 15, h1s);
    expect(a).toMatchObject({ x: 0, y: 1.5, width: 51.1, height: 12, clipped: true, headMm: 12, sideways: true });
  });

  it('gives the whole label when the label fits the head', () => {
    expect(printArea(30, 12, h1s).clipped).toBe(false);
    expect(printArea(40, 30, b1)).toMatchObject({ x: 0, y: 0, width: 40, height: 30, clipped: false });
  });

  it('gives the middle 48 mm of a 50 mm label on the B1', () => {
    expect(printArea(50, 30, b1)).toMatchObject({ x: 1, y: 0, width: 48, height: 30, clipped: true, sideways: false });
  });

  it('matches the real print pipeline for every alignment, direction and the 180° option', () => {
    const variants: PrinterModel[] = [];
    for (const base of [h1s, b1]) {
      for (const align of ['left', 'center', 'right'] as const) {
        for (const printDirection of [0, 90, 180, 270]) variants.push({ ...base, align, printDirection });
      }
    }
    // A wide and a tall label for each variant. Both are wider than the H1S head in one direction and wider than the B1 head in the other.
    for (const m of variants) {
      for (const flip of [false, true]) {
        for (const [w, h] of [[51.1, 15], [15, 51.1], [60, 52]]) {
          expect(printsWholeArea(w, h, m, flip), `${m.name} ${m.align} ${m.printDirection} flip=${flip} ${w}x${h}`).toBe(true);
        }
      }
    }
  });

  it('finds rectangles that go outside the area', () => {
    const a = printArea(51.1, 15, h1s);
    expect(outsideArea({ x: 5, y: 2, width: 20, height: 10 }, a)).toBe(false);
    expect(outsideArea({ x: 5, y: 0.5, width: 20, height: 5 }, a)).toBe(true);
    expect(outsideArea({ x: 5, y: 10, width: 20, height: 4.5 }, a)).toBe(true);
    expect(outsideArea({ x: 5, y: 0, width: 20, height: 15 }, printArea(30, 12, h1s))).toBe(false);
  });
});
