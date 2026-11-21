// Shared parts for template designs: categories, size sets and layout
// helpers. Used by the template library and by the assistant (MCP) tools.

import { ICONS, iconSvg } from '../editor/icons';
import type { Dataset } from '../editor/template';
import { LabelBarcode } from '../editor/objects';
import type { FabricObject } from 'fabric';
import { box, cols, extentX, fitPt, icon, inset, onBaseline, pack, rows, shift, square, text, type Box, type Part, type TextOptions } from './layout';

export type Category =
  | 'IT and servers'
  | 'Network and cables'
  | 'Office'
  | 'Home and kitchen'
  | 'Food and hospitality'
  | 'Retail'
  | 'Small business'
  | 'Gifts and crafts'
  | 'Shipping and storage'
  | 'Electrical and workshop'
  | 'Lab and health'
  | 'School and events'
  | 'Garden and pets'
  | 'Hobbies and collections'
  | 'Travel and vehicles'
  | 'Safety and signs'
  | 'Celebrations and seasons';

export const CATEGORIES: Category[] = [
  'IT and servers',
  'Network and cables',
  'Office',
  'Home and kitchen',
  'Food and hospitality',
  'Retail',
  'Small business',
  'Gifts and crafts',
  'Shipping and storage',
  'Electrical and workshop',
  'Lab and health',
  'School and events',
  'Garden and pets',
  'Hobbies and collections',
  'Travel and vehicles',
  'Safety and signs',
  'Celebrations and seasons',
];

export type Size = [number, number];

export interface TemplateDesign {
  id: string;
  name: string;
  category: Category;
  description: string;
  sizes: Size[];
  /** Round labels keep their content inside the circle. */
  round?: boolean;
  /** Sizes that are round labels, for designs that also come in rectangles. */
  roundSizes?: Size[];
  labelType?: number;
  /** Example rows for templates that use {{fields}}. */
  sampleData?: Dataset;
  /** Fonts that the design uses, shown on the card. */
  fonts?: string[];
  build: (w: number, h: number) => Part[];
}

// ---------- size sets ----------

/** Narrow rolls (12–15 mm) for D11, D110, D101, H1S and B18, shown sideways. */
export const NARROW: Size[] = [[22, 12], [30, 12], [40, 12], [75, 12], [30, 14], [40, 14], [30, 15], [50, 15]];
export const NARROW_SHORT: Size[] = [[22, 12], [30, 12], [30, 14], [30, 15], [40, 12]];
export const SMALL: Size[] = [[40, 20], [50, 20]];
export const MEDIUM: Size[] = [[40, 30], [50, 30], [60, 40], [70, 40]];
export const ROUND: Size[] = [[20, 20], [21, 21], [31, 31], [34, 34], [50, 50]];
export const TALL: Size[] = [[50, 70], [50, 80], [40, 70], [40, 80]];
export const LARGE: Size[] = [[80, 50], [100, 100]];

// ---------- helpers ----------

export const ic = (name: string) => iconSvg((ICONS.find((i) => i.name === name) ?? ICONS[0]).Icon);
export const pad = (w: number, h: number) => Math.max(0.8, Math.min(3, Math.min(w, h) * 0.07));
export const area = (w: number, h: number): Box => inset(box(0, 0, w, h), pad(w, h));
/** Inner square of a round label. */
export const roundArea = (w: number, h: number): Box => inset(box(0, 0, w, h), Math.min(w, h) * 0.17);
export const narrow = (h: number) => h <= 16;

export interface Line {
  t: string;
  /** Sample text for sizing, when t holds {{fields}}. */
  fit?: string;
  weight?: number;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  invert?: boolean;
  maxPt?: number;
  italic?: boolean;
  font?: string;
  spacing?: number;
}

/**
 * Text lines stacked from top to bottom. Weight is the relative height.
 * Lines with the same weight and font share one font size, so that detail lines line up.
 */
export function stack(b: Box, lines: Line[], gap = 0.4): Part[] {
  const parts = rows(b, lines.map((l) => l.weight ?? 1), gap);
  const key = (l: Line) => `${l.weight ?? 1}|${l.font ?? ''}`;
  const shared = new Map<string, number>();
  lines.forEach((l, i) => {
    if (l.invert) return;
    const pt = fitPt(l.fit ?? l.t, parts[i], { bold: l.bold, italic: l.italic, maxPt: l.maxPt, font: l.font, spacing: l.spacing });
    shared.set(key(l), Math.min(shared.get(key(l)) ?? Infinity, pt));
  });
  const drawn = lines.map((l, i) =>
    text(parts[i], l.t, {
      bold: l.bold,
      align: l.align,
      invert: l.invert,
      italic: l.italic,
      font: l.font,
      spacing: l.spacing,
      fitText: l.fit,
      maxPt: l.invert ? l.maxPt : shared.get(key(l)),
    }),
  );
  return pack(drawn, b, gap);
}

/** Content on the left and a square code on the right. */
export function withCode(b: Box, code: (sq: Box) => Part[], body: (rest: Box) => Part[], side: 'left' | 'right' = 'right'): Part[] {
  const s = Math.min(b.h, b.w * 0.45);
  const gap = Math.max(1, b.w * 0.03);
  const codeBox = side === 'right' ? box(b.x + b.w - s, b.y + (b.h - s) / 2, s, s) : box(b.x, b.y + (b.h - s) / 2, s, s);
  const parts = code(codeBox);
  // A 2D code gets a whole number of printer dots for each module, so it can be
  // smaller than its box. It goes to the outer edge, and the text gets the rest.
  const codes = parts.filter((p): p is LabelBarcode => p instanceof LabelBarcode);
  const used = codes.length ? Math.max(...codes.map((p) => (p.width * p.scaleX) / 10)) : s;
  const w = Math.min(s, used);
  if (w < s) for (const p of codes) p.set({ left: (side === 'right' ? b.x + b.w - (p.width * p.scaleX) / 10 : b.x) * 10 });
  const rest = side === 'right' ? box(b.x, b.y, b.w - w - gap, b.h) : box(b.x + w + gap, b.y, b.w - w - gap, b.h);
  const text = body(rest);
  if (side === 'left') {
    // Short text beside a code on the left: the code and the text are centred as a group.
    const x = extentX(text);
    const dx = x ? (b.x + b.w - Math.max(x[1], b.x + w)) / 2 : 0;
    if (dx > 0.2) return shift([...parts, ...text], dx, 0);
  }
  return [...parts, ...text];
}

/** Captions with values in rows. Captions share one font size and values share another, so that the rows line up. */
export function pairs(b: Box, list: [string, (v: Box, maxPt: number) => Part[], string?][], o: { gap?: number; ratio?: number; caption?: TextOptions; valueText?: (i: number) => string } = {}): Part[][] {
  const boxes = rows(b, list.map(() => 1), o.gap ?? 0.4);
  const split = boxes.map((r) => cols(r, [1, o.ratio ?? 1.5], 0.6));
  const capPt = Math.min(...list.map(([label], i) => fitPt(label, split[i][0], o.caption)));
  const valPt = Math.min(...list.map(([, , sample], i) => (sample ? fitPt(sample, split[i][1], { bold: true }) : Infinity)));
  return list.map(([label, value], i) => {
    const caption = text(split[i][0], label, { ...o.caption, maxPt: capPt });
    const v = value(split[i][1], valPt);
    return v.every((p) => !(p instanceof Promise)) ? onBaseline([caption, v as FabricObject[]]) : [...caption, ...v];
  });
}

/** Centres parts across the box by the space that they use, for a short block of text on a wide label. */
export function centreX(parts: Part[], b: Box): Part[] {
  const x = extentX(parts);
  return x ? shift(parts, b.x + (b.w - (x[1] - x[0])) / 2 - x[0], 0) : parts;
}

/**
 * A symbol at the left edge and content beside it. The symbol takes 1 part of
 * the width and the content `share` parts. When the content is short, the
 * symbol and the content are centred on the label as a group.
 */
export function withIcon(b: Box, svg: string, share: number, body: (rest: Box) => Part[], gap = 1): Part[] {
  const [col] = cols(b, [1, share], gap);
  const sq = square(col, 'start');
  const rest = box(sq.x + sq.w + gap, b.y, b.x + b.w - (sq.x + sq.w + gap), b.h);
  const parts = body(rest);
  const x = extentX(parts);
  const dx = x ? (b.x + b.w - Math.max(x[1], sq.x + sq.w)) / 2 : 0;
  const all = [...icon(sq, svg), ...parts];
  return dx > 0.2 ? shift(all, dx, 0) : all;
}

/** Repeats a design function across equal columns, for cable wraps and fold-over flags. */
export function repeatCols(b: Box, n: number, fn: (cell: Box) => Part[], gap = 1): Part[] {
  return cols(b, Array(n).fill(1), gap).flatMap(fn);
}

export function dataset(name: string, columns: string[], rowsData: string[][]): Dataset {
  return { name, columns, rows: rowsData };
}

/** Makes a text part white, for text on a black shape. */
export function white(o: Part): Part {
  if (o instanceof Promise) return o;
  o.set({ fill: '#ffffff' });
  return o;
}
