// Shared parts for template designs: categories, size sets and layout
// helpers. Used by the template library and by the assistant (MCP) tools.

import { ICONS, iconSvg } from '../editor/icons';
import type { Dataset } from '../editor/template';
import { box, cols, fitPt, inset, rows, text, type Box, type Part } from './layout';

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
  return lines.flatMap((l, i) =>
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
}

/** Content on the left and a square code on the right. */
export function withCode(b: Box, code: (sq: Box) => Part[], body: (rest: Box) => Part[], side: 'left' | 'right' = 'right'): Part[] {
  const s = Math.min(b.h, b.w * 0.45);
  const gap = Math.max(1, b.w * 0.03);
  const codeBox = side === 'right' ? box(b.x + b.w - s, b.y + (b.h - s) / 2, s, s) : box(b.x, b.y + (b.h - s) / 2, s, s);
  const rest = side === 'right' ? box(b.x, b.y, b.w - s - gap, b.h) : box(b.x + s + gap, b.y, b.w - s - gap, b.h);
  return [...code(codeBox), ...body(rest)];
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
