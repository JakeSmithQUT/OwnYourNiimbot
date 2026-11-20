import { StaticCanvas, Textbox, type FabricObject } from 'fabric';
import './objects';
import { LabelBarcode, LabelTable } from './objects';
import { formatDate, formatSerial, hasPlaceholders, substitute, type RecordContext, type SerialSettings } from './placeholders';
import { UNITS_PER_MM } from './units';
import { fitToPrinthead, rgbaToMono, rotateMono, type MonoImage } from '../../printer/encoder';
import { pixelsPerMm, printheadDots, type PrinterModel } from '../../printer/models';
import type { LabelTemplate } from './template';

export interface OynData {
  kind?: 'text' | 'datetime' | 'serial' | 'image' | 'shape' | 'icon';
  format?: string;
  offsetDays?: number;
  serial?: SerialSettings;
  locked?: boolean;
  [key: string]: unknown;
}

export function oyn(obj: FabricObject): OynData {
  return ((obj as unknown as { oyn?: OynData }).oyn ??= {});
}

/** Fills placeholders, dates and serial numbers for one label. */
export function applyRecord(objects: FabricObject[], ctx: RecordContext): void {
  const now = ctx.now ?? new Date();
  for (const obj of objects) {
    const data = oyn(obj);
    if (obj instanceof Textbox) {
      if (data.kind === 'datetime') {
        const d = new Date(now.getTime() + (data.offsetDays ?? 0) * 86400000);
        obj.set('text', formatDate(d, data.format ?? 'DD/MM/YYYY'));
      } else if (data.kind === 'serial' && data.serial) {
        obj.set('text', formatSerial(data.serial, ctx.index));
      } else if (hasPlaceholders(obj.text ?? '')) {
        obj.set('text', substitute(obj.text ?? '', ctx));
      }
    } else if (obj instanceof LabelBarcode) {
      if (hasPlaceholders(obj.value)) obj.set('value', substitute(obj.value, ctx));
    } else if (obj instanceof LabelTable) {
      obj.cells = obj.cells.map((row) => row.map((cell) => (hasPlaceholders(cell) ? substitute(cell, ctx) : cell)));
    }
  }
}

/** Renders a template at the given resolution (dots per millimetre). */
export async function renderLabel(t: Pick<LabelTemplate, 'canvas' | 'widthMm' | 'heightMm'>, dotsPerMm: number, ctx?: RecordContext): Promise<HTMLCanvasElement> {
  const el = document.createElement('canvas');
  const sc = new StaticCanvas(el, {
    width: t.widthMm * UNITS_PER_MM,
    height: t.heightMm * UNITS_PER_MM,
    enableRetinaScaling: false,
    renderOnAddRemove: false,
  });
  await sc.loadFromJSON(t.canvas);
  sc.backgroundColor = '#ffffff';
  if (ctx) applyRecord(sc.getObjects(), ctx);
  const out = sc.toCanvasElement(dotsPerMm / UNITS_PER_MM);
  await sc.dispose();
  return out;
}

export interface PrintImageOptions {
  threshold?: number;
  flip180?: boolean;
}

export interface PrintImage {
  mono: MonoImage;
  /** 1-bit image in label orientation, for preview. */
  preview: MonoImage;
}

export async function buildPrintImage(
  t: Pick<LabelTemplate, 'canvas' | 'widthMm' | 'heightMm'>,
  model: PrinterModel,
  ctx: RecordContext,
  opts: PrintImageOptions = {},
): Promise<PrintImage> {
  const canvas = await renderLabel(t, pixelsPerMm(model.dpi), ctx);
  const c2d = canvas.getContext('2d')!;
  const data = c2d.getImageData(0, 0, canvas.width, canvas.height);
  const preview = rgbaToMono(data.data, canvas.width, canvas.height, { threshold: opts.threshold ?? 127 });
  let rotation = model.printDirection === 90 || model.printDirection === 270 ? model.printDirection : 0;
  if (opts.flip180) rotation += 180;
  const rotated = rotateMono(preview, rotation);
  const mono = fitToPrinthead(rotated, printheadDots(model), model.align);
  return { mono, preview };
}

export function monoToCanvas(img: MonoImage): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.cols;
  canvas.height = img.rows;
  const ctx = canvas.getContext('2d')!;
  const out = ctx.createImageData(img.cols, img.rows);
  for (let y = 0; y < img.rows; y++) {
    for (let x = 0; x < img.cols; x++) {
      const black = (img.data[y * img.bytesPerRow + (x >> 3)] & (0x80 >> (x & 7))) !== 0;
      const i = (y * img.cols + x) * 4;
      const v = black ? 20 : 255;
      out.data[i] = out.data[i + 1] = out.data[i + 2] = v;
      out.data[i + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}
