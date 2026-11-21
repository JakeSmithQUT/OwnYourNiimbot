// Building blocks for the template library. Every function takes a box in
// millimetres (screen orientation) and returns Fabric objects in canvas units.
// Objects get an explicit top-left origin, so the layout does not depend on
// the default origin of the Fabric version.

import { Ellipse, FabricImage, Line, Rect, Textbox, type FabricObject } from 'fabric';
import { LabelBarcode, LabelTable, renderBars } from '../editor/objects';
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
  // Some fonts, for example handwriting, draw past the end of the last letter.
  for (const line of text.split('\n')) {
    const m = measureCtx.measureText(line);
    widest = Math.max(widest, m.width, m.actualBoundingBoxRight);
  }
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
  /** With invert: the black bar is only as high as the text with some space round it, in the middle of the box. */
  hug?: boolean;
  spacing?: number;
  data?: OynData;
  lineHeight?: number;
  /** Text to size the font for, when the label text is a {{field}} that a longer value replaces. */
  fitText?: string;
}

export const LINE_HEIGHT = 1.12;
/** Fabric makes each line 1.13 times the font size high and puts the baseline 0.222 of that height above the bottom of the line. */
const FABRIC_LINE = 1.13;
const FABRIC_BASELINE = 0.222;

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

/** A black bar for white text: the height of the text with some space round it, at most the height of the box. */
function bar(b: Box, value: string, o: TextOptions): Box {
  const pt = fitPt(value, inset(b, 0.6, 0.2), o);
  const lines = Math.max(1, value.split('\n').length);
  const th = ((pt * 25.4) / 72) * (o.lineHeight ?? LINE_HEIGHT) * lines * 1.06;
  const bh = Math.min(b.h, th + 0.4 + Math.max(0.6, th * 0.12));
  return box(b.x, b.y + (b.h - bh) / 2, b.w, bh);
}

export function text(box_: Box, value: string, o: TextOptions = {}): FabricObject[] {
  const b = o.invert && o.hug ? bar(box_, o.fitText ?? value, o) : box_;
  const pt = fitPt(o.fitText ?? value, o.invert ? inset(b, 0.6, 0.2) : b, o);
  const fontSize = ptToUnits(pt);
  const lh = o.lineHeight ?? LINE_HEIGHT;
  const lines = Math.max(1, value.split('\n').length);
  const textH = fontSize * lh * lines;
  const inner = o.invert ? inset(b, 0.6, 0) : b;
  const font = o.font ?? 'Arial';
  let top = u(inner.y);
  if (o.valign === 'bottom') top += u(inner.h) - textH;
  else if (o.valign !== 'top') {
    // The letters are centred, from the top of the tallest letter on the first line
    // to the last baseline. Descenders hang below, as in most signs.
    measureCtx ??= document.createElement('canvas').getContext('2d')!;
    measureCtx.font = `${o.italic ? 'italic ' : ''}${o.bold ? 'bold ' : ''}${fontSize}px "${font}"`;
    const list = value.split('\n');
    const ascent = measureCtx.measureText(list[0]).actualBoundingBoxAscent;
    const descent = measureCtx.measureText(list[list.length - 1]).actualBoundingBoxDescent;
    const base = fontSize * FABRIC_LINE * (1 - FABRIC_BASELINE);
    const last = base + (lines - 1) * fontSize * FABRIC_LINE * lh;
    if (ascent > 0) {
      top += u(inner.h) / 2 - (base - ascent + last) / 2;
      // Descenders and tall letters stay inside the box.
      top -= Math.max(0, top + last + descent - u(inner.y + inner.h));
      top += Math.max(0, u(inner.y) - (top + base - ascent));
    } else top += (u(inner.h) - textH) / 2;
  }
  const t = new Textbox(value, {
    ...ORIGIN,
    left: u(inner.x),
    top,
    width: u(inner.w),
    fontSize,
    fontFamily: font,
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

/**
 * Texts side by side on one line, each at its own size, moved to one baseline:
 * the baseline of the largest text. A group with a black bar does not move.
 */
export function onBaseline(groups: FabricObject[][]): FabricObject[] {
  const texts = groups.map((g) => (g.some((o) => o instanceof Rect) ? undefined : g.find((o): o is Textbox => o instanceof Textbox)));
  const baseline = (t: Textbox) => t.top + t.fontSize * FABRIC_LINE * (1 - FABRIC_BASELINE);
  const main = texts.reduce<Textbox | undefined>((m, t) => (t && (!m || t.fontSize > m.fontSize) ? t : m), undefined);
  if (main) for (const t of texts) if (t && t !== main && t.textLines.length === 1) t.set({ top: t.top + baseline(main) - baseline(t) });
  return groups.flat();
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

/** Dots per millimetre of most NIIMBOT printers (203 dpi). */
const PRINT_DOTS = 8;

/**
 * The square for a 2D code in the box: the largest size that gives each
 * module a whole number of printer dots. A code that has more space is drawn
 * smaller, so a box of this size puts the code exactly where the layout
 * wants it. A serial number {{index:N}} counts as N digits.
 */
function codeSquare(b: Box, format: string, value: string, align: 'start' | 'center' | 'end', eclevel = 'M'): Box {
  const s = square(b, align);
  const sample = value.replace(/\{\{index(?::(\d+))?\}\}/g, (_, n: string | undefined) => '0'.repeat(Number(n ?? 1)));
  const { canvas, unit = 1 } = renderBars(format, sample, eclevel);
  if (!canvas) return s;
  const modules = canvas.width / unit;
  const dots = Math.floor((s.w * PRINT_DOTS) / modules + 1e-6);
  if (dots < 1) return s;
  const size = (dots * modules) / PRINT_DOTS;
  const f = align === 'start' ? 0 : align === 'end' ? 1 : 0.5;
  return { x: s.x + (s.w - size) * f, y: s.y + (s.h - size) / 2, w: size, h: size };
}

export function qr(b: Box, value: string, align: 'start' | 'center' | 'end' = 'center', eclevel = 'M'): FabricObject[] {
  const s = codeSquare(b, 'qrcode', value, align, eclevel);
  return [new LabelBarcode({ ...ORIGIN, format: 'qrcode', value, left: u(s.x), top: u(s.y), width: u(s.w), height: u(s.h), showText: false, eclevel })];
}

export function datamatrix(b: Box, value: string, align: 'start' | 'center' | 'end' = 'center'): FabricObject[] {
  const s = codeSquare(b, 'datamatrix', value, align);
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
  // The text fits the height of a row and the width of its column, inside the cell padding.
  const ratios = o.colRatios ?? Array.from({ length: colsN }, () => 1);
  const total = ratios.reduce((s, r) => s + r, 0);
  const byWidth = Math.min(
    ...cells.flatMap((row) => row.map((cell, i) => (cell ? fitPt(cell, box(0, 0, (b.w * (ratios[i] ?? 1)) / total - 1.5, rowH), { bold: o.bold }) : Infinity))),
  );
  const pt = o.pt ?? Math.max(4.5, Math.min(10, (rowH * 0.55 * 72) / 25.4, byWidth));
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

const inkCache = new Map<string, [number, number, number, number] | undefined>();

/** The part of an image that has ink, in image pixels: left, top, right and bottom. */
function inkBounds(src: string, el: CanvasImageSource, w: number, h: number): [number, number, number, number] | undefined {
  if (inkCache.has(src)) return inkCache.get(src);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  let found: [number, number, number, number] | undefined;
  if (g) {
    g.drawImage(el, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] < 64) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    if (x1 >= 0) found = [x0, y0, x1 + 1, y1 + 1];
  }
  if (inkCache.size > 300) inkCache.clear();
  inkCache.set(src, found);
  return found;
}

/**
 * Places an SVG icon (as an image) in the largest square that fits the box.
 * Symbols leave space round their lines, and not always the same space on
 * each side, so the lines themselves are placed: at the side of the square
 * that the alignment gives, and in the middle from top to bottom.
 */
export function icon(b: Box, svg: string, align: 'start' | 'center' | 'end' = 'center'): Part[] {
  const s = square(b, align);
  const src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  return [
    FabricImage.fromURL(src).then((img) => {
      const iw = img.width || 96;
      const ih = img.height || 96;
      const k = u(s.w) / iw;
      const [x0, y0, x1, y1] = inkBounds(src, img.getElement(), iw, ih) ?? [0, 0, iw, ih];
      const f = align === 'start' ? 0 : align === 'end' ? 1 : 0.5;
      const left = u(s.x) + (u(s.w) - (x1 - x0) * k) * f - x0 * k;
      const top = u(s.y) + (u(s.h) - (y1 - y0) * k) / 2 - y0 * k;
      img.set({ ...ORIGIN, left, top, scaleX: k, scaleY: k });
      (img as unknown as { oyn: OynData }).oyn = { kind: 'icon' };
      return img as FabricObject;
    }),
  ];
}

// ---------- packing ----------

const move = (p: Part, dx: number, dy: number): Part => {
  const apply = (o: FabricObject) => {
    o.set({ left: o.left + u(dx), top: o.top + u(dy) });
    return o;
  };
  return p instanceof Promise ? p.then(apply) : apply(p);
};

/** Moves parts by dx and dy millimetres. Pictures move when they load. */
export const shift = (parts: Part[], dx: number, dy: number): Part[] => (dx || dy ? parts.map((p) => move(p, dx, dy)) : parts);

const loaded = (parts: Part[]) => parts.filter((p): p is FabricObject => !(p instanceof Promise));
const stroke = (o: FabricObject) => (o.stroke ? o.strokeWidth : 0);

/** Top and bottom of the parts that are not pictures, in millimetres. */
export function extentY(parts: Part[]): [number, number] | undefined {
  const list = loaded(parts);
  if (!list.length) return undefined;
  return [Math.min(...list.map((o) => o.top - stroke(o) / 2)) / 10, Math.max(...list.map((o) => o.top + o.height * o.scaleY + stroke(o) / 2)) / 10];
}

/** Left and right of the ink of the parts that are not pictures, in millimetres. For text, the width of the longest line. */
export function extentX(parts: Part[]): [number, number] | undefined {
  const list = loaded(parts);
  if (!list.length) return undefined;
  const span = (o: FabricObject): [number, number] => {
    const w = o.width * o.scaleX;
    if (o instanceof Textbox) {
      const tw = Math.min(w, o.calcTextWidth());
      const at = o.textAlign === 'center' ? (w - tw) / 2 : o.textAlign === 'right' ? w - tw : 0;
      return [o.left + at, o.left + at + tw];
    }
    return [o.left - stroke(o) / 2, o.left + w + stroke(o) / 2];
  };
  const spans = list.map(span);
  return [Math.min(...spans.map((s) => s[0])) / 10, Math.max(...spans.map((s) => s[1])) / 10];
}

/**
 * Keeps rows together. A row whose content is lower than its box (for example
 * text that the width makes small) gives the free space back, the rows get an
 * even gap, and the group is centred in the area. Rows that fill their boxes
 * do not move. `known` gives the top and bottom of rows that are pictures.
 */
export function pack(groups: Part[][], a: Box, gap: number, known: ([number, number] | undefined)[] = []): Part[] {
  const ext = groups.map((g, i) => known[i] ?? extentY(g));
  if (groups.length < 2 || ext.some((e) => !e)) return groups.flat();
  const spans = ext as [number, number][];
  const heights = spans.map(([y0, y1]) => y1 - y0);
  const used = heights.reduce((s, v) => s + v, 0);
  const spare = a.h - used - gap * (groups.length - 1);
  if (spare < 0.1) return groups.flat();
  // A little of the free space goes between the rows, and the rest above and below the group.
  const g = gap + Math.min(spare / (groups.length + 1), Math.min(...heights) * 0.25);
  let y = a.y + (a.h - used - g * (groups.length - 1)) / 2;
  const moves = spans.map(([y0], i) => {
    const dy = y - y0;
    y += heights[i] + g;
    return dy;
  });
  // The letters are centred, not the lines that hold them: a line has room for descenders under its last baseline.
  const letters = groups.map((list, i) => known[i] ?? lettersY(list) ?? spans[i]);
  const top = Math.min(...letters.map(([y0], i) => y0 + moves[i]));
  const bottom = Math.max(...letters.map(([, y1], i) => y1 + moves[i]));
  const centre = a.y + a.h / 2 - (top + bottom) / 2;
  return groups.flatMap((list, i) => shift(list, 0, moves[i] + centre));
}

/** Top of the tallest letter on the first line of a text, below the top of the text box, in canvas units. */
function letterTop(o: Textbox): number {
  measureCtx ??= document.createElement('canvas').getContext('2d')!;
  measureCtx.font = `${o.fontStyle === 'italic' ? 'italic ' : ''}${o.fontWeight === 'bold' ? 'bold ' : ''}${o.fontSize}px "${o.fontFamily}"`;
  const ascent = measureCtx.measureText(String(o.text).split('\n')[0]).actualBoundingBoxAscent;
  return ascent > 0 ? o.fontSize * FABRIC_LINE * (1 - FABRIC_BASELINE) - ascent : 0;
}

/** Top and bottom of the parts that are not pictures, in millimetres. Text goes from the top of its letters to its last baseline. */
function lettersY(parts: Part[]): [number, number] | undefined {
  const list = loaded(parts);
  if (!list.length) return undefined;
  const span = (o: FabricObject): [number, number] => {
    if (o instanceof Textbox) {
      const lines = Math.max(1, o.textLines.length);
      const base = o.fontSize * FABRIC_LINE * (1 - FABRIC_BASELINE) + (lines - 1) * o.fontSize * FABRIC_LINE * o.lineHeight;
      return [o.top + letterTop(o), o.top + base];
    }
    return [o.top - stroke(o) / 2, o.top + o.height * o.scaleY + stroke(o) / 2];
  };
  const spans = list.map(span);
  return [Math.min(...spans.map((s) => s[0])) / 10, Math.max(...spans.map((s) => s[1])) / 10];
}

/** Places an ornament SVG so that it fills the box exactly. */
export function art(b: Box, svg: string): Part[] {
  const src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  return [
    FabricImage.fromURL(src).then((img) => {
      img.set({ ...ORIGIN, left: u(b.x), top: u(b.y), scaleX: u(b.w) / (img.width || 1), scaleY: u(b.h) / (img.height || 1) });
      (img as unknown as { oyn: OynData }).oyn = { kind: 'icon' };
      return img as FabricObject;
    }),
  ];
}
