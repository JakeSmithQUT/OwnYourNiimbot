// A compact way to describe a template: a list of rows from top to bottom,
// with an optional frame, background shape, bands and a side panel. One
// description gives a layout for every label size, and a design can give a
// different description for narrow, small, tall and round labels.

import type { SerialSettings } from '../editor/placeholders';
import type { Dataset } from '../editor/template';
import type { FabricObject } from 'fabric';
import { formatDate, formatSerial } from '../editor/placeholders';
import { art, barcode, box, chord, circle, circleArea, cols, datamatrix, date, extentX, extentY, fitPt, hline, icon, inset, onBaseline, pack, packMoves, qr, rect, rows, serial, shift, square, table, text, type Box, type Circle, type Part, type TextOptions } from './layout';
import { centreX, ic, narrow, pad, ROUND, white, type Category, type Size, type TemplateDesign } from './kit';
import * as orn from './ornaments';
import * as mo from './motifs';

// ---------- names ----------

const BANDS = {
  rule: mo.rule,
  double: mo.doubleRule,
  diamond: orn.diamondRule,
  wave: orn.wave,
  dots: orn.dots,
  sprig: orn.sprig,
  zigzag: mo.zigzag,
  checks: mo.checks,
  stripes: orn.stripes,
  bunting: mo.bunting,
  stars: mo.starsRow,
  hearts: mo.heartsRow,
  chevrons: mo.chevrons,
  scallops: mo.scallops,
  comb: mo.comb,
  film: mo.film,
  rays: mo.rays,
} satisfies Record<string, (w: number, h: number) => string>;
export type BandName = keyof typeof BANDS;

const PICTURES = {
  heart: orn.heart,
  star: orn.star,
  pine: mo.pine,
  snowflake: mo.snowflake,
  pumpkin: mo.pumpkin,
  ghost: mo.ghost,
  egg: mo.egg,
  balloon: mo.balloon,
  crown: mo.crown,
  bow: mo.bow,
  flower: mo.flower,
  paw: mo.paw,
  bone: mo.bone,
  sun: mo.sun,
  moon: mo.crescent,
  bolt: mo.bolt,
  drop: mo.drop,
  peaks: mo.peaks,
  bell: mo.bell,
  present: mo.present,
  cloud: mo.cloud,
} satisfies Record<string, (w: number, h: number) => string>;
export type PictureName = keyof typeof PICTURES;

export type FrameName = 'line' | 'bold' | 'double' | 'dots' | 'corners' | 'ticket' | 'stamp' | 'deco' | 'brackets' | 'tag' | 'dash';
export type ShapeName = 'seal' | 'sealOutline' | 'disc' | 'ring' | 'burst' | 'hex' | 'hexOutline' | 'oval' | 'shield' | 'shieldOutline' | 'block' | 'laurel';

const SOLID: ShapeName[] = ['seal', 'disc', 'burst', 'hex', 'shield', 'block'];

// ---------- description ----------

interface Style {
  font?: string;
  bold?: boolean;
  italic?: boolean;
  spacing?: number;
  align?: 'left' | 'center' | 'right';
  /** White text on a black bar. */
  invert?: boolean;
  maxPt?: number;
  /** Sample text for sizing, when the text holds {{fields}}. */
  fit?: string;
}

type Value = string | { date: string; offset?: number } | { serial: Partial<SerialSettings> };

export type Row = { weight?: number } & (
  | ({ t: string } & Style)
  | ({ date: string; offset?: number } & Style)
  | ({ serial: Partial<SerialSettings> } & Style)
  /** A caption and a value. An empty value gives a line to write on. */
  | ({ kv: [string, Value] } & Style)
  | { band: BandName; span?: number }
  | { pic: PictureName }
  | { icon: string }
  | { code: 'qr' | 'datamatrix' | 'code128' | 'ean13' | 'code39'; value: string }
  | { table: string[][]; colRatios?: number[]; align?: 'left' | 'center' | 'right'; bold?: boolean }
  /** Boxes to tick, each with a caption. */
  | ({ ticks: string[] } & Style)
  | { cols: Row[]; ratios?: number[]; gap?: number }
  | { space: true }
);

export interface Side {
  icon?: string;
  pic?: PictureName;
  code?: 'qr' | 'datamatrix';
  value?: string;
  /** Large white text on a black block, for example a bay number. */
  block?: string;
  at?: 'left' | 'right';
  /** Width of the panel as a part of the label width. The default is a square. */
  width?: number;
  font?: string;
}

export interface Spec {
  rows: Row[];
  frame?: FrameName;
  shape?: ShapeName;
  /** Bands at the top and the bottom. On narrow labels, one band on the left. */
  bands?: BandName | 'solid';
  side?: Side;
  /** A small picture in two opposite corners. */
  corners?: PictureName;
  align?: 'left' | 'center';
  font?: string;
  gap?: number;
  /** More space round the content, in millimetres. */
  margin?: number;
}

export interface Shapes {
  base: Spec;
  /** Labels up to 16 mm high. */
  narrow?: Spec;
  /** Labels up to 16 mm high and up to 30 mm wide. */
  short?: Spec;
  /** Labels up to 22 mm high. */
  small?: Spec;
  tall?: Spec;
  round?: Spec;
}

// ---------- drawing ----------

interface Ctx {
  white: boolean;
  align: 'left' | 'center' | 'right';
  font?: string;
  shared: Map<string, number>;
  /** Widths of the caption and the value in rows with a caption. */
  kv: number[];
  /** Largest font size for the text rows that are not the main row. */
  minor: number;
  mainWeight: number;
  /** Alignment of the main text row. A symbol on its own row follows it. */
  mainAlign: 'left' | 'center' | 'right';
}

const DEFAULT_SERIAL: SerialSettings = { start: 1, step: 1, digits: 3, prefix: '', suffix: '' };
const fullSerial = (s: Partial<SerialSettings>): SerialSettings => ({ ...DEFAULT_SERIAL, ...s });

const weightOf = (r: Row): number => {
  if (r.weight !== undefined) return r.weight;
  if ('band' in r) return 0.4;
  if ('pic' in r) return 1.3;
  if ('icon' in r) return 1.5;
  if ('code' in r) return 2.2;
  if ('table' in r) return 2.4;
  if ('space' in r) return 0.3;
  return 1;
};

function textOptions(r: Style, c: Ctx): TextOptions {
  return { font: r.font ?? c.font, bold: r.bold, italic: r.italic, spacing: r.spacing, align: r.align ?? c.align, invert: r.invert, maxPt: r.maxPt, fitText: r.fit };
}

const paint = (parts: Part[], c: Ctx, inverted?: boolean): Part[] => (c.white && !inverted ? parts.map(white) : parts);
const ink = (markup: string, c: Ctx) => (c.white ? mo.flip(markup) : markup);
const iconInk = (name: string, c: Ctx) => (c.white ? ic(name).replace(/#000000/g, '#ffffff') : ic(name));

function valueParts(b: Box, v: Value, o: TextOptions, c: Ctx): Part[] {
  if (typeof v === 'string') {
    if (v) return paint(text(b, v, o), c);
    return [hline(b.x, b.y + b.h - 0.3, b.w, { width: 0.3 })];
  }
  if ('date' in v) return paint(date(b, v.date, v.offset ?? 0, o), c);
  return paint(serial(b, fullSerial(v.serial), o), c);
}

const sampleOf = (v: Value): string => (typeof v === 'string' ? v : 'date' in v ? v.date : `${v.serial.prefix ?? ''}${'0'.repeat(v.serial.digits ?? 3)}${v.serial.suffix ?? ''}`);
const shareKey = (r: Row, c: Ctx) => `${'kv' in r ? 'kv' : 'ticks' in r ? 'ticks' : 't'}|${weightOf(r)}|${('font' in r && r.font) || c.font || ''}`;

/** Font size that fits the text of each column of a row of columns. Infinity for a column without text. */
function colFits(b: Box, r: Extract<Row, { cols: Row[] }>, c: Ctx): number[] {
  const cells = cols(b, r.ratios ?? r.cols.map(() => 1), r.gap ?? 1);
  return r.cols.map((child, i) => {
    const sample = rowText(child);
    return sample === undefined ? Infinity : fitPt(sample, cells[i], textOptions(child as Style, c));
  });
}

/** Font size for each label of a row of tick boxes: the largest that fits every cell. */
function tickPt(b: Box, r: Extract<Row, { ticks: string[] }>, c: Ctx): number {
  const o = { ...textOptions(r, c), align: 'left' as const };
  const cells = cols(b, r.ticks.map(() => 1), 1);
  const s = Math.min(b.h * 0.72, cells[0].w * 0.28, 4);
  return Math.min(...r.ticks.map((label, i) => fitPt(label, box(cells[i].x + s + 0.8, b.y, cells[i].w - s - 0.8, b.h), o)));
}

/** Splits rows with a caption by the longest caption and the longest value, so that short captions do not waste space. */
function kvWidths(list: Row[]): number[] {
  let caption = 1;
  let value = 1;
  for (const r of list) {
    if (!('kv' in r)) continue;
    caption = Math.max(caption, r.kv[0].length);
    value = Math.max(value, (r.fit ?? sampleOf(r.kv[1])).length || 8);
  }
  const share = Math.max(0.24, Math.min(0.5, caption / (caption + value * 1.15)));
  return [share, 1 - share];
}

/** Rows of plain text with the same weight and font get one font size, so that detail lines line up. */
/** The text that a row of plain text, a date or a serial number shows, for sizing. Undefined for other rows. */
function rowText(r: Row): string | undefined {
  if ('t' in r) return r.invert ? undefined : (r.fit ?? r.t);
  if ('date' in r) return r.fit ?? formatDate(new Date(Date.now() + (r.offset ?? 0) * 86400000), r.date);
  if ('serial' in r) return r.fit ?? formatSerial(fullSerial(r.serial), 0);
  return undefined;
}

function shareSizes(list: Row[], boxes: Box[], c: Ctx): void {
  list.forEach((r, i) => {
    const b = boxes[i];
    let pt: number | undefined;
    const sample = rowText(r);
    if (sample !== undefined) pt = fitPt(sample, b, textOptions(r as Style, c));
    if ('kv' in r) {
      const [l, v] = cols(b, c.kv, 0.8);
      const o = textOptions(r, c);
      pt = Math.min(fitPt(r.kv[0], l, o), fitPt(r.fit ?? (sampleOf(r.kv[1]) || 'x'), v, { ...o, bold: true }));
    }
    if ('ticks' in r) pt = tickPt(b, r, c);
    if ('cols' in r && r.cols.some((x) => rowText(x) !== undefined)) pt = Math.min(...colFits(b, r, c));
    if (pt !== undefined) c.shared.set(shareKey(r, c), Math.min(c.shared.get(shareKey(r, c)) ?? Infinity, pt));
  });
  // Captions with values, tick boxes and plain lines of the same weight and font get one size.
  // Plain lines join only when no bold line of that weight is a heading.
  const families = new Map<string, Set<string>>();
  for (const r of list) {
    const key = shareKey(r, c);
    if (!c.shared.has(key)) continue;
    const kind = key.slice(0, key.indexOf('|'));
    if (kind === 't' && list.some((x) => shareKey(x, c) === key && 'bold' in x && x.bold)) continue;
    const rest = key.slice(kind.length);
    if (!families.has(rest)) families.set(rest, new Set());
    families.get(rest)!.add(key);
  }
  for (const keys of families.values()) {
    if (keys.size < 2) continue;
    const pt = Math.min(...[...keys].map((k) => c.shared.get(k) ?? Infinity));
    for (const k of keys) c.shared.set(k, pt);
  }
  // A line with less weight is not larger than a line with more weight.
  const sized = list.filter((r) => c.shared.has(shareKey(r, c))).sort((x, y) => weightOf(y) - weightOf(x));
  sized.forEach((r, i) => {
    const above = sized.slice(0, i).filter((x) => weightOf(x) > weightOf(r)).map((x) => c.shared.get(shareKey(x, c)) ?? Infinity);
    if (above.length) c.shared.set(shareKey(r, c), Math.min(c.shared.get(shareKey(r, c)) ?? Infinity, ...above));
  });
  // A detail line, a date or a serial number must not be larger than the main line, even when it is short.
  const plain = list.filter((r) => rowText(r) !== undefined);
  c.mainWeight = Math.max(0, ...plain.map(weightOf));
  const mainRows = plain.filter((r) => weightOf(r) === c.mainWeight);
  const main = mainRows.map((r) => c.shared.get(shareKey(r, c)) ?? Infinity);
  if (main.length && plain.some((r) => weightOf(r) < c.mainWeight)) c.minor = Math.min(...main) * 0.8;
  c.mainAlign = (mainRows[0] as Style | undefined)?.align ?? c.align;
}

function drawRow(b: Box, r: Row, c: Ctx, top: boolean, limit = Infinity): Part[] {
  // Text rows of one weight and font share a size, and detail lines stay smaller than the main line.
  const sized = (o: TextOptions): TextOptions => ({
    ...o,
    maxPt: Math.min(o.maxPt ?? Infinity, limit, top ? (c.shared.get(shareKey(r, c)) ?? Infinity) : Infinity, top && weightOf(r) < c.mainWeight ? c.minor : Infinity),
  });
  if ('t' in r) {
    const o = textOptions(r, c);
    if (r.invert) return text(b, r.t, { ...o, hug: true });
    return paint(text(b, r.t, sized(o)), c, r.invert);
  }
  if ('kv' in r) {
    const [l, v] = cols(b, c.kv, 0.8);
    const o = { ...textOptions(r, c), align: 'left' as const };
    if (top) o.maxPt = Math.min(c.shared.get(shareKey(r, c)) ?? Infinity, weightOf(r) < c.mainWeight ? c.minor : Infinity);
    return [...paint(text(l, r.kv[0], o), c), ...valueParts(v, r.kv[1], { ...o, bold: true }, c)];
  }
  if ('date' in r) return paint(date(b, r.date, r.offset ?? 0, sized(textOptions(r, c))), c);
  if ('serial' in r) return paint(serial(b, fullSerial(r.serial), sized(textOptions(r, c))), c);
  if ('band' in r) {
    const span = r.span ?? (r.band === 'stripes' || r.band === 'checks' || r.band === 'film' || r.band === 'rays' ? 1 : 0.7);
    const w = b.w * span;
    return art(box(b.x + (b.w - w) / 2, b.y, w, b.h), ink(BANDS[r.band](w, b.h), c));
  }
  if ('pic' in r) {
    const s = square(b);
    return art(s, ink(PICTURES[r.pic](s.w, s.h), c));
  }
  if ('icon' in r) return icon(b, iconInk(r.icon, c), c.mainAlign === 'left' ? 'start' : 'center');
  if ('code' in r) {
    if (r.code === 'qr') return qr(b, r.value);
    if (r.code === 'datamatrix') return datamatrix(b, r.value);
    return barcode(b, r.value, r.code);
  }
  if ('table' in r) return table(b, r.table, { colRatios: r.colRatios, align: r.align, bold: r.bold });
  if ('ticks' in r) {
    const o = { ...textOptions(r, c), align: 'left' as const };
    const cells = cols(b, r.ticks.map(() => 1), 1);
    const s = Math.min(b.h * 0.72, cells[0].w * 0.28, 4);
    // Rows of tick boxes share one size.
    const pt = Math.min(tickPt(b, r, c), top ? (c.shared.get(shareKey(r, c)) ?? Infinity) : Infinity, top && weightOf(r) < c.mainWeight ? c.minor : Infinity);
    return r.ticks.flatMap((label, i) => {
      const cell = cells[i];
      return [rect(box(cell.x, cell.y + (cell.h - s) / 2, s, s), { stroke: 0.3 }), ...paint(text(box(cell.x + s + 0.8, cell.y, cell.w - s - 0.8, cell.h), label, { ...o, maxPt: pt }), c)];
    });
  }
  if ('cols' in r) {
    const cells = cols(b, r.ratios ?? r.cols.map(() => 1), r.gap ?? 1);
    // Text side by side shares one size and one baseline, for example the names of switches on one plate.
    const shared = Math.min(
      ...colFits(b, r, c),
      limit,
      top ? (c.shared.get(shareKey(r, c)) ?? Infinity) : Infinity,
      top && weightOf(r) < c.mainWeight ? c.minor : Infinity,
    );
    const drawn = r.cols.map((child, i) => drawRow(cells[i], child, c, false, shared));
    return drawn.every((g) => g.every((p) => !(p instanceof Promise))) ? onBaseline(drawn as FabricObject[][]) : drawn.flat();
  }
  return [];
}

function frameParts(name: FrameName, w: number, h: number): Part[] {
  const full = box(0, 0, w, h);
  switch (name) {
    case 'line':
      return art(full, orn.frame(w, h, { stroke: 0.45, radius: 1.2 }));
    case 'bold':
      return art(full, orn.frame(w, h, { stroke: 1.1, radius: 1.4 }));
    case 'double':
      return art(full, orn.frame(w, h, { stroke: 0.5, radius: 1.4, inner: 1.3, innerStroke: 0.25 }));
    case 'dots':
      return art(full, orn.dotFrame(w, h, 0.55, 1.5));
    case 'corners':
      return art(inset(full, 0.6), orn.corners(w - 1.2, h - 1.2));
    case 'ticket':
      return art(full, orn.ticket(w, h, 0.55, false));
    case 'stamp':
      return art(full, mo.stamp(w, h));
    case 'deco':
      return art(full, mo.deco(w, h));
    case 'brackets':
      return art(full, mo.brackets(w, h));
    case 'tag':
      return art(full, mo.tagShape(w, h));
    case 'dash':
      return art(full, mo.dashFrame(w, h));
  }
}

/** Space that a frame takes on each side, in millimetres: [left, top, right, bottom]. */
function frameSpace(name: FrameName | undefined, w: number, h: number): [number, number, number, number] {
  const all = (m: number): [number, number, number, number] => [m, m, m, m];
  switch (name) {
    case undefined:
      return all(0);
    case 'line':
    case 'dash':
      return all(0.9);
    case 'bold':
      return all(1.5);
    case 'double':
      return all(1.9);
    case 'dots':
      return all(1.5);
    case 'corners':
      return all(1.3);
    case 'ticket':
      return [Math.min(h * 0.14, 3) + 0.6, 0.9, Math.min(h * 0.14, 3) + 0.6, 0.9];
    case 'stamp':
      return all(2.5);
    case 'deco':
      return all(Math.min(2.2, Math.min(w, h) * 0.09) + 1.2);
    case 'brackets':
      return [Math.min(w * 0.08, 3) + 0.4, 0.6, Math.min(w * 0.08, 3) + 0.4, 0.6];
    case 'tag':
      return [mo.tagCut(w, h) + 1.4, 0.9, 0.9, 0.9];
  }
}

function shapeParts(name: ShapeName, w: number, h: number): Part[] {
  const full = box(0, 0, w, h);
  const d = Math.min(w, h);
  const mid = box((w - d) / 2, (h - d) / 2, d, d);
  switch (name) {
    case 'seal':
      return art(mid, orn.seal(d, Math.round(d * 0.9)));
    case 'sealOutline':
      return art(mid, orn.seal(d, Math.round(d * 0.9), false));
    case 'disc':
      return art(mid, mo.disc(d));
    case 'ring':
      return art(mid, mo.ring(d));
    case 'burst':
      return art(full, orn.burst(w, h, Math.max(14, Math.round((w + h) / 4.5))));
    case 'hex':
      return art(full, mo.hexagon(w, h));
    case 'hexOutline':
      return art(full, mo.hexagon(w, h, false));
    case 'oval':
      return art(full, mo.oval(w, h));
    case 'shield':
      return art(full, mo.shield(w, h));
    case 'shieldOutline':
      return art(full, mo.shield(w, h, false));
    case 'block':
      return [rect(inset(full, 0.4), { fill: true, radius: 1.6 })];
    case 'laurel':
      return art(full, mo.laurel(w, h));
  }
}

/**
 * The circle that text must stay inside on a round label or a round shape:
 * the inner edge of the frame or the shape, less some space.
 */
function textCircle(spec: Spec, w: number, h: number, round: boolean): Circle | undefined {
  const d = Math.min(w, h);
  const at = (r: number): Circle => ({ cx: w / 2, cy: h / 2, r: r - Math.max(0.7, d * 0.06) });
  switch (spec.shape) {
    case 'disc':
      return at(d * 0.47);
    case 'ring':
      return at(d * 0.47 - 1.3);
    case 'seal':
      return at(d * 0.43);
    case 'sealOutline':
      return at(d * 0.41);
    case undefined:
      break;
    default:
      return undefined;
  }
  if (!round) return undefined;
  return spec.frame ? at(d * 0.46 - (spec.frame === 'bold' ? 0.9 : 0.4)) : at(d * 0.5);
}

/** The part of the label that is inside a background shape. */
function shapeArea(name: ShapeName, w: number, h: number): Box {
  const d = Math.min(w, h);
  switch (name) {
    case 'seal':
    case 'sealOutline':
      return inset(box((w - d) / 2, (h - d) / 2, d, d), d * 0.21);
    case 'disc':
    case 'ring':
      return inset(box((w - d) / 2, (h - d) / 2, d, d), d * 0.18);
    case 'burst':
      return inset(box(0, 0, w, h), w * 0.2, h * 0.23);
    case 'hex':
    case 'hexOutline':
      return inset(box(0, 0, w, h), w * 0.17, h * 0.12);
    case 'oval':
      return inset(box(0, 0, w, h), w * 0.17, h * 0.2);
    case 'shield':
    case 'shieldOutline':
      return box(w * 0.18, h * 0.17, w * 0.64, h * 0.56);
    case 'block':
      return inset(box(0, 0, w, h), pad(w, h) + 0.6);
    case 'laurel':
      return inset(box(0, 0, w, h), w * 0.24, h * 0.24);
  }
}

function sideParts(b: Box, s: Side, c: Ctx, align: 'start' | 'center' | 'end' = 'center'): Part[] {
  if (s.block !== undefined) return text(b, s.block, { invert: true, bold: true, align: 'center', lineHeight: 1, font: s.font ?? c.font });
  if (s.code === 'qr') return qr(b, s.value ?? '', align);
  if (s.code === 'datamatrix') return datamatrix(b, s.value ?? '', align);
  if (s.pic) {
    const sq = square(b);
    return art(sq, ink(PICTURES[s.pic](sq.w, sq.h), c));
  }
  return icon(b, iconInk(s.icon ?? 'warning', c), align);
}

/** Builds the label parts for one description and one label size. */
export function compose(spec: Spec, w: number, h: number, round = false): Part[] {
  const parts: Part[] = [];
  const full = box(0, 0, w, h);
  const c: Ctx = {
    white: Boolean(spec.shape && SOLID.includes(spec.shape)),
    align: spec.align ?? (spec.side ? 'left' : 'center'),
    font: spec.font,
    shared: new Map(),
    kv: kvWidths(spec.rows),
    minor: Infinity,
    mainWeight: 0,
    mainAlign: spec.align ?? (spec.side ? 'left' : 'center'),
  };

  let a: Box;
  // Text on a round label or a round shape stays inside a circle. Each row is as wide as the circle at its outer edge.
  const ring = textCircle(spec, w, h, round);
  if (spec.shape) {
    parts.push(...shapeParts(spec.shape, w, h));
    a = ring ? circleArea(ring) : shapeArea(spec.shape, w, h);
  } else if (round) {
    if (spec.frame) parts.push(circle(inset(full, w * 0.04), { stroke: spec.frame === 'bold' ? 0.9 : 0.4 }));
    a = ring ? circleArea(ring) : inset(full, Math.min(w, h) * 0.17);
  } else {
    if (spec.frame) parts.push(...frameParts(spec.frame, w, h));
    const [l, t, r, b] = frameSpace(spec.frame, w, h);
    const p = pad(w, h) * (spec.frame ? 0.6 : 1) + (spec.margin ?? 0);
    a = box(l + p, t + p, Math.max(1, w - l - r - 2 * p), Math.max(1, h - t - b - 2 * p));
  }

  if (spec.bands && !spec.shape && !round) {
    const fn = spec.bands === 'solid' ? undefined : BANDS[spec.bands];
    const draw = (b: Box) => (fn ? art(b, fn(b.w, b.h)) : [rect(b, { fill: true })]);
    if (narrow(h)) {
      const bw = Math.min(w * 0.2, 8);
      parts.push(...draw(box(0, 0, bw, h)));
      a = box(Math.max(a.x, bw + 1), a.y, a.x + a.w - Math.max(a.x, bw + 1), a.h);
    } else {
      const bh = Math.max(2, Math.min(h * 0.15, 6));
      parts.push(...draw(box(0, 0, w, bh)), ...draw(box(0, h - bh, w, bh)));
      a = box(a.x, bh + 0.8, a.w, h - 2 * bh - 1.6);
    }
  }

  if (spec.corners && !round && !narrow(h)) {
    // The pictures go inside the frame, and the content moves in so that it does not touch them.
    const s = Math.min(w, h) * 0.15;
    const m = 1 + frameSpace(spec.frame, w, h)[0];
    const fn = PICTURES[spec.corners];
    parts.push(...art(box(m, m, s, s), fn(s, s)), ...art(box(w - s - m, h - s - m, s, s), fn(s, s)));
    a = inset(a, s * 0.55, s * 0.3);
  }

  // The side panel and the rows are placed at the end, so that they can be centred as a group.
  const whole = a;
  let lead: { parts: Part[]; span: [number, number] } | undefined;
  let beside: { parts: Part[]; x: [number, number]; right: boolean } | undefined;
  if (spec.side) {
    const s = spec.side;
    const stacked = h > w * 1.15 || (round && !s.block);
    if (stacked) {
      const [top, rest] = rows(a, [1, 1.5], Math.max(0.8, h * 0.02));
      const sq = s.block !== undefined ? top : square(ring ? chord(top, ring) : top);
      const sp = sideParts(sq, s, c);
      lead = { parts: sp, span: (s.code && extentY(sp)) || [sq.y, sq.y + sq.h] };
      a = rest;
      c.align = spec.align ?? 'center';
    } else {
      const sw = s.width ? a.w * s.width : Math.min(a.h, a.w * (s.code ? 0.42 : 0.28));
      const gap = Math.max(1, a.w * 0.03);
      const right = s.at === 'right';
      const sb = box(right ? a.x + a.w - sw : a.x, a.y, sw, a.h);
      // The panel goes to the outer edge. A code can be smaller than its square, and the text gets the space that the panel does not use.
      const sq = s.block !== undefined ? sb : square(sb, right ? 'end' : 'start');
      const sp = sideParts(sq, s, c, right ? 'end' : 'start');
      const x: [number, number] = (s.code && extentX(sp)) || [sq.x, sq.x + sq.w];
      beside = { parts: sp, x, right };
      a = right ? box(a.x, a.y, x[0] - gap - a.x, a.h) : box(x[1] + gap, a.y, a.x + a.w - x[1] - gap, a.h);
    }
  }

  const gap = spec.gap ?? Math.max(0.3, Math.min(0.8, h * 0.018));
  let boxes = rows(a, spec.rows.map(weightOf), gap);
  if (ring) boxes = circleRows(spec.rows, boxes, ring, c, gap, lead, lead ? whole : a);
  shareSizes(spec.rows, boxes, c);
  const drawn = spec.rows.map((r, i) => drawRow(boxes[i], r, c, true));
  const spans = spec.rows.map((r, i) => rowSpan(r, boxes[i]));
  let body = lead ? pack([lead.parts, ...drawn], whole, gap, [lead.span, ...spans]) : pack(drawn, a, gap, spans);

  // Short text beside a symbol: the symbol and the text are centred on the label as a group.
  if (beside && !beside.right && c.align === 'left' && spec.rows.every(isTextRow)) {
    const tx = extentX(body);
    if (tx) {
      const dx = (whole.x + whole.w - Math.max(beside.x[1], tx[1]) - (beside.x[0] - whole.x)) / 2;
      if (dx > 0.2) {
        beside.parts = shift(beside.parts, dx, 0);
        body = shift(body, dx, 0);
      }
    }
  }
  // A block of left-aligned text, for example captions with values, is centred across the label.
  if (!spec.side && c.align === 'left' && spec.rows.every((r) => (isTextRow(r) || 'ticks' in r) && !('align' in r && r.align && r.align !== 'left'))) {
    body = centreX(body, a);
  }
  parts.push(...(beside?.parts ?? []), ...body);
  return parts;
}

/**
 * Rows inside a circle. Packing moves rows towards the middle, where the circle
 * is wider, so the width of each row depends on where it ends up. The first
 * try gives each row the width of the circle at the outer edge of its box,
 * which always fits. Each next try gives each row the width of the circle
 * where the last try put it. The widest try in which every row fits is used.
 */
function circleRows(list: Row[], boxes: Box[], ring: Circle, c: Ctx, gap: number, lead: { parts: Part[]; span: [number, number] } | undefined, area: Box): Box[] {
  const at = (b: Box, y?: [number, number]): Box => ({ ...chord(y ? box(b.x, y[0], b.w, y[1] - y[0]) : b, ring), y: b.y, h: b.h });
  // Lays out the rows in these boxes and packs them: where each row ends up, and how wide its text is.
  const place = (bx: Box[]) => {
    const t: Ctx = { ...c, shared: new Map(), minor: Infinity, mainWeight: 0 };
    shareSizes(list, bx, t);
    const drawn = list.map((r, i) => drawRow(bx[i], r, t, true));
    const known = list.map((r, i) => rowSpan(r, bx[i]));
    const groups = lead ? [lead.parts, ...drawn] : drawn;
    const spans = lead ? [lead.span, ...known] : known;
    const moves = packMoves(groups, area, gap, spans);
    return list.map((_, i) => {
      const j = lead ? i + 1 : i;
      const e = spans[j] ?? extentY(groups[j]);
      const x = extentX(drawn[i]);
      const dy = moves?.[j] ?? 0;
      return { y: e ? ([e[0] + dy, e[1] + dy] as [number, number]) : undefined, w: x ? x[1] - x[0] : 0 };
    });
  };
  let best = boxes.map((b) => at(b));
  let bestWidth = 0;
  let current = best;
  for (let k = 0; k < 5; k++) {
    const placed = place(current);
    const room = placed.map((p, i) => at(boxes[i], p.y));
    const width = current.reduce((s, b) => s + b.w, 0);
    if (placed.every((p, i) => p.w <= room[i].w + 0.05) && width > bestWidth) {
      best = current;
      bestWidth = width;
    }
    if (room.every((b, i) => Math.abs(b.w - current[i].w) < 0.1)) break;
    current = room;
  }
  return best;
}

const isTextRow = (r: Row): boolean => ('t' in r && !r.invert) || 'kv' in r || 'date' in r || 'serial' in r;

/** Top and bottom of a row that is a picture or that fills its box. Undefined for rows that are measured from their parts. */
function rowSpan(r: Row, b: Box): [number, number] | undefined {
  if ('icon' in r || 'pic' in r) {
    const s = square(b);
    return [s.y, s.y + s.h];
  }
  if ('cols' in r) return r.cols.every(isTextRow) ? undefined : [b.y, b.y + b.h];
  // A plain rule is one line in the middle of its box.
  if ('band' in r && r.band === 'rule') return [b.y + b.h * 0.3, b.y + b.h * 0.7];
  if ('band' in r || 'table' in r || 'space' in r) return [b.y, b.y + b.h];
  if ('code' in r && r.code !== 'qr' && r.code !== 'datamatrix') return [b.y, b.y + b.h];
  return undefined;
}

// ---------- designs ----------

const fontsOf = (list: Row[]): string[] => list.flatMap((r) => ('cols' in r ? fontsOf(r.cols) : 'font' in r && r.font ? [r.font] : []));
const specFonts = (s: Spec): string[] => [...(s.font ? [s.font] : []), ...(s.side?.font ? [s.side.font] : []), ...fontsOf(s.rows)];
const isRoundRoll = ([w, h]: Size) => ROUND.some(([a, b]) => a === w && b === h);

export interface Extra {
  /** Every size is a round label. */
  round?: boolean;
  labelType?: number;
  sampleData?: Dataset;
}

/** Makes a template design from a description, or from one description for each label shape. */
export function design(id: string, name: string, category: Category, description: string, sizes: Size[], layout: Spec | Shapes, extra: Extra = {}): TemplateDesign {
  const shapes: Shapes = 'rows' in layout ? { base: layout } : layout;
  const roundSizes = extra.round ? sizes : shapes.round ? sizes.filter(isRoundRoll) : [];
  const isRound = (w: number, h: number) => roundSizes.some(([a, b]) => a === w && b === h);
  const fonts = [...new Set([shapes.base, shapes.narrow, shapes.short, shapes.small, shapes.tall, shapes.round].flatMap((s) => (s ? specFonts(s) : [])))];
  return {
    id,
    name,
    category,
    description,
    sizes,
    round: extra.round,
    roundSizes: extra.round ? undefined : roundSizes.length ? roundSizes : undefined,
    labelType: extra.labelType,
    sampleData: extra.sampleData,
    fonts: fonts.length ? fonts : undefined,
    build: (w, h) => {
      if (isRound(w, h)) return compose(shapes.round ?? shapes.base, w, h, true);
      if (narrow(h) && w <= 30 && shapes.short) return compose(shapes.short, w, h);
      if (narrow(h)) return compose(shapes.narrow ?? shapes.small ?? shapes.base, w, h);
      if (h <= 22) return compose(shapes.small ?? shapes.base, w, h);
      if (h > w * 1.15) return compose(shapes.tall ?? shapes.base, w, h);
      return compose(shapes.base, w, h);
    },
  };
}
