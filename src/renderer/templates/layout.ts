// Building blocks for the template library. Every function takes a box in
// millimetres (screen orientation) and returns Fabric objects in canvas units.
// Objects get an explicit top-left origin, so the layout does not depend on
// the default origin of the Fabric version.

import { Ellipse, FabricImage, Line, Rect, Textbox, type FabricObject } from 'fabric';
import { LabelBarcode, LabelTable } from '../editor/objects';
import { formatDate, formatSerial, type SerialSettings } from '../editor/placeholders';
import { mmToUnits as u, ptToUnits } from '../editor/units';
import type { OynData } from '../editor/render';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ORIGIN = { originX: 'left', originY: 'top' } as const;
const BLACK = '#000000';
const WHITE = '#ffffff';

export const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

export function inset(b: Box, m: number, my = m): Box {
  return { x: b.x + m, y: b.y + my, w: Math.max(0.5, b.w - 2 * m), h: Math.max(0.5, b.h - 2 * my) };
}

/** Splits a box into columns. Ratios are relative widths. */
export function cols(b: Box, ratios: number[], gap = 1): Box[] {
  const total = ratios.reduce((a, r) => a + r, 0);
  const free = b.w - gap * (ratios.length - 1);
  let x = b.x;
  return ratios.map((r) => {
    const w = (free * r) / total;
    const out = { x, y: b.y, w, h: b.h };
    x += w + gap;
    return out;
  });
}

/** Splits a box into rows. Ratios are relative heights. */
export function rows(b: Box, ratios: number[], gap = 0.5): Box[] {
  const total = ratios.reduce((a, r) => a + r, 0);
  const free = b.h - gap * (ratios.length - 1);
  let y = b.y;
  return ratios.map((r) => {
    const h = (free * r) / total;
    const out = { x: b.x, y, w: b.w, h };
    y += h + gap;
    return out;
  });
}

/** Square of the largest size that fits in the box, placed by alignment. */
export function square(b: Box, align: 'start' | 'center' | 'end' = 'center'): Box {
  const s = Math.min(b.w, b.h);
  const dx = b.w - s;
  const dy = b.h - s;
  const f = align === 'start' ? 0 : align === 'end' ? 1 : 0.5;
  return { x: b.x + dx * f, y: b.y + dy * 0.5, w: s, h: s };
}

// ---------- text ----------

let measureCtx: CanvasRenderingContext2D | undefined;
function measure(text: string, font: string): number {
  measureCtx ??= document.createElement('canvas').getContext('2d')!;
  measureCtx.font = font;
  let widest = 0;
  for (const line of text.split('\n')) widest = Math.max(widest, measureCtx.measureText(line).width);
  return widest;
}

export interface TextOptions {
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  /** Largest font size in points. */
  maxPt?: number;
  /** Smallest font size in points. Longer text wraps at this size. */
  minPt?: number;
  font?: string;
  /** White text on a black background that fills the box. */
  invert?: boolean;
  spacing?: number;
  data?: OynData;
  lineHeight?: number;
  /** Text to size the font for, when the label text is a {{field}} that a longer value replaces. */
  fitText?: string;
}

const LINE_HEIGHT = 1.12;

/** Font size in points that fits the text in the box. */
export function fitPt(text: string, b: Box, o: TextOptions = {}): number {
  const lines = Math.max(1, text.split('\n').length);
  const lh = o.lineHeight ?? LINE_HEIGHT;
  const byHeight = (b.h / (lines * lh * 1.06)) * (72 / 25.4);
  const font = o.font ?? 'Arial';
  const probeUnits = 100;
  const longest = Math.max(...text.split('\n').map((l) => l.length));
  // Letter spacing is in thousandths of the font size, added after each character.
  const spacingAtProbe = ((o.spacing ?? 0) / 1000) * probeUnits * longest;
  const widthAtProbe = measure(text || ' ', `${o.italic ? 'italic ' : ''}${o.bold ? 'bold ' : ''}${probeUnits}px "${font}"`) + spacingAtProbe;
  const avail = u(b.w) * 0.97;
  const byWidth = widthAtProbe > 0 ? ((probeUnits * avail) / widthAtProbe) * (72 / (25.4 * 10)) : byHeight;
  const pt = Math.min(byHeight, byWidth, o.maxPt ?? 72);
  return Math.max(o.minPt ?? 4.5, Math.floor(pt * 4) / 4);
}

export function text(b: Box, value: string, o: TextOptions = {}): FabricObject[] {
  const pt = fitPt(o.fitText ?? value, o.invert ? inset(b, 0.6, 0.2) : b, o);
  const fontSize = ptToUnits(pt);
  const lh = o.lineHeight ?? LINE_HEIGHT;
  const lines = Math.max(1, value.split('\n').length);
  const textH = fontSize * lh * lines;
  const inner = o.invert ? inset(b, 0.6, 0) : b;
  let top = u(inner.y);
  if (o.valign !== 'top') {
    const free = u(inner.h) - textH;
    top += o.valign === 'bottom' ? free : free / 2;
  }
  const t = new Textbox(value, {
    ...ORIGIN,
    left: u(inner.x),
    top,
    width: u(inner.w),
    fontSize,
    fontFamily: o.font ?? 'Arial',
    fontWeight: o.bold ? 'bold' : 'normal',
    fontStyle: o.italic ? 'italic' : 'normal',
    textAlign: o.align ?? 'left',
    lineHeight: lh,
    charSpacing: o.spacing ?? 0,
    fill: o.invert ? WHITE : BLACK,
  });
  (t as unknown as { oyn: OynData }).oyn = o.data ?? { kind: 'text' };
  if (!o.invert) return [t];
  return [rect(b, { fill: true, radius: Math.min(1, b.h / 4) }), t];
}

/** A small caption and a value under it, for example "IP" and "10.0.0.1". */
export function field(b: Box, caption: string, value: string, o: TextOptions & { side?: boolean } = {}): FabricObject[] {
  if (o.side) {
    const [c, v] = cols(b, [1, 3.2], 0.8);
    return [...text(c, caption, { maxPt: 7, valign: 'middle' }), ...text(v, value, { ...o, valign: 'middle' })];
  }
  const [c, v] = rows(b, [1, 2.2], 0);
  return [...text(c, caption.toUpperCase(), { maxPt: 6, spacing: 40, valign: 'bottom' }), ...text(v, value, { ...o, valign: 'top' })];
}

export function date(b: Box, format: string, offsetDays: number, o: TextOptions = {}): FabricObject[] {
  const sample = formatDate(new Date(Date.now() + offsetDays * 86400000), format);
  return text(b, sample, { ...o, data: { kind: 'datetime', format, offsetDays } });
}

export function serial(b: Box, s: SerialSettings, o: TextOptions = {}): FabricObject[] {
  return text(b, formatSerial(s, 0), { ...o, data: { kind: 'serial', serial: s } });
}

// ---------- codes ----------

export function qr(b: Box, value: string, align: 'start' | 'center' | 'end' = 'center', eclevel = 'M'): FabricObject[] {
  const s = square(b, align);
  return [new LabelBarcode({ ...ORIGIN, format: 'qrcode', value, left: u(s.x), top: u(s.y), width: u(s.w), height: u(s.h), showText: false, eclevel })];
}

export function datamatrix(b: Box, value: string, align: 'start' | 'center' | 'end' = 'center'): FabricObject[] {
  const s = square(b, align);
  return [new LabelBarcode({ ...ORIGIN, format: 'datamatrix', value, left: u(s.x), top: u(s.y), width: u(s.w), height: u(s.h), showText: false })];
}

export function barcode(b: Box, value: string, format = 'code128', showText = true, textPt?: number): FabricObject[] {
  const tp = textPt ?? Math.max(4.5, Math.min(8, (b.h * 0.22 * 72) / 25.4));
  return [
    new LabelBarcode({
      ...ORIGIN,
      format,
      value,
      left: u(b.x),
      top: u(b.y),
      width: u(b.w),
      height: u(b.h),
      showText,
      textSize: ptToUnits(tp),
    }),
  ];
}

// ---------- shapes ----------

export function rect(b: Box, o: { fill?: boolean; stroke?: number; radius?: number; dash?: boolean } = {}): FabricObject {
  const r = new Rect({
    ...ORIGIN,
    left: u(b.x),
    top: u(b.y),
    width: u(b.w),
    height: u(b.h),
    fill: o.fill ? BLACK : 'transparent',
    stroke: o.stroke ? BLACK : undefined,
    strokeWidth: o.stroke ? u(o.stroke) : 0,
    strokeUniform: true,
    rx: o.radius ? u(o.radius) : 0,
    ry: o.radius ? u(o.radius) : 0,
    strokeDashArray: o.dash ? [u(1), u(0.7)] : undefined,
  });
  (r as unknown as { oyn: OynData }).oyn = { kind: 'shape' };
  return r;
}

export function circle(b: Box, o: { fill?: boolean; stroke?: number } = {}): FabricObject {
  const s = square(b);
  const e = new Ellipse({
    ...ORIGIN,
    left: u(s.x),
    top: u(s.y),
    rx: u(s.w / 2),
    ry: u(s.h / 2),
    fill: o.fill ? BLACK : 'transparent',
    stroke: o.stroke ? BLACK : undefined,
    strokeWidth: o.stroke ? u(o.stroke) : 0,
    strokeUniform: true,
  });
  (e as unknown as { oyn: OynData }).oyn = { kind: 'shape' };
  return e;
}

export function hline(x: number, y: number, w: number, o: { width?: number; dash?: boolean } = {}): FabricObject {
  const l = new Line([0, 0, u(w), 0], {
    ...ORIGIN,
    left: u(x),
    top: u(y),
    stroke: BLACK,
    strokeWidth: u(o.width ?? 0.3),
    strokeDashArray: o.dash ? [u(1), u(0.7)] : undefined,
  });
  (l as unknown as { oyn: OynData }).oyn = { kind: 'shape' };
  return l;
}

export function vline(x: number, y: number, h: number, o: { width?: number; dash?: boolean } = {}): FabricObject {
  const l = new Line([0, 0, 0, u(h)], {
    ...ORIGIN,
    left: u(x),
    top: u(y),
    stroke: BLACK,
    strokeWidth: u(o.width ?? 0.3),
    strokeDashArray: o.dash ? [u(1), u(0.7)] : undefined,
  });
  (l as unknown as { oyn: OynData }).oyn = { kind: 'shape' };
  return l;
}

export function table(b: Box, cells: string[][], o: { colRatios?: number[]; rowRatios?: number[]; pt?: number; bold?: boolean; align?: 'left' | 'center' | 'right'; line?: number } = {}): FabricObject[] {
  const rowsN = cells.length;
  const colsN = Math.max(...cells.map((r) => r.length));
  const rowH = b.h / rowsN;
  const pt = o.pt ?? Math.max(4.5, Math.min(10, (rowH * 0.55 * 72) / 25.4));
  return [
    new LabelTable({
      ...ORIGIN,
      left: u(b.x),
      top: u(b.y),
      width: u(b.w),
      height: u(b.h),
      rows: rowsN,
      cols: colsN,
      cells: cells.map((r) => Array.from({ length: colsN }, (_, i) => r[i] ?? '')),
      colRatios: o.colRatios,
      rowRatios: o.rowRatios,
      fontSize: ptToUnits(pt),
      fontWeight: o.bold ? 'bold' : 'normal',
      textAlign: o.align ?? 'left',
      lineWidth: u(o.line ?? 0.25),
      cellPadding: u(0.6),
    }),
  ];
}

// ---------- icons ----------

/** Template parts. Icons load an image, so they arrive as promises. */
export type Part = FabricObject | Promise<FabricObject>;

/** Places an SVG icon (as an image) in the largest square that fits the box. */
export function icon(b: Box, svg: string, align: 'start' | 'center' | 'end' = 'center'): Part[] {
  const s = square(b, align);
  const src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  return [
    FabricImage.fromURL(src).then((img) => {
      img.set({ ...ORIGIN, left: u(s.x), top: u(s.y), scaleX: u(s.w) / (img.width || 96), scaleY: u(s.h) / (img.height || 96) });
      (img as unknown as { oyn: OynData }).oyn = { kind: 'icon' };
      return img as FabricObject;
    }),
  ];
}
