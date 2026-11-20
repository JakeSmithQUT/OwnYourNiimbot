// Builds a label from the layout that an AI assistant sends through MCP.
// The input is already checked by the schema in the main process. The
// result goes through validateTemplate like any other label from outside.

import { Ellipse, Line } from 'fabric';
import { barcode, box, datamatrix, date, icon, qr, rect, serial, table, text, type Part, type TextOptions } from '../templates/layout';
import { area, stack, withCode, type Line as KitLine } from '../templates/kit';
import { ICONS, iconSvg } from '../editor/icons';
import { emptyTemplate, type LabelTemplate } from '../editor/template';
import { validateTemplate } from '../editor/validate';
import { mmToUnits as u } from '../editor/units';
import { loadBundledFonts } from '../editor/bundledFonts';
import type { OynData } from '../editor/render';

type Align = 'left' | 'center' | 'right';

interface TextStyle {
  font?: string;
  bold?: boolean;
  italic?: boolean;
  align?: Align;
  size_pt?: number;
  invert?: boolean;
}

interface Pos {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SpecElement =
  | ({ type: 'text'; text: string } & Pos & TextStyle)
  | ({ type: 'barcode'; value: string; format?: string; show_text?: boolean } & Pos)
  | { type: 'qrcode' | 'datamatrix'; value: string; x: number; y: number; size: number }
  | ({ type: 'rect'; fill?: boolean; stroke_mm?: number; radius_mm?: number } & Pos)
  | ({ type: 'ellipse'; fill?: boolean; stroke_mm?: number } & Pos)
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number; width_mm?: number; dashed?: boolean }
  | { type: 'icon'; name: string; x: number; y: number; size: number }
  | ({ type: 'date'; format?: string; offset_days?: number } & Pos & TextStyle)
  | ({ type: 'serial'; prefix?: string; suffix?: string; start?: number; step?: number; digits?: number } & Pos & TextStyle)
  | ({ type: 'table'; cells: string[][]; size_pt?: number; bold?: boolean; align?: Align } & Pos);

export interface LabelSpec {
  name?: string;
  label_type?: number;
  lines?: { text: string; weight?: number; bold?: boolean; italic?: boolean; font?: string; align?: Align; invert?: boolean }[];
  code?: { type: string; value: string; side?: 'left' | 'right' };
  elements?: SpecElement[];
}

function textOpts(s: TextStyle): TextOptions {
  return {
    font: s.font,
    bold: s.bold,
    italic: s.italic,
    align: s.align,
    invert: s.invert,
    maxPt: s.size_pt,
    minPt: s.size_pt,
  };
}

function shape<T extends { set: (k: Record<string, unknown>) => unknown }>(o: T): T {
  (o as unknown as { oyn: OynData }).oyn = { kind: 'shape' };
  return o;
}

function codeParts(type: string, value: string, b: ReturnType<typeof box>): Part[] {
  if (type === 'qrcode') return qr(b, value);
  if (type === 'datamatrix') return datamatrix(b, value);
  return barcode(b, value, type, true);
}

function elementParts(e: SpecElement): Part[] {
  switch (e.type) {
    case 'text':
      return text(box(e.x, e.y, e.width, e.height), e.text, textOpts(e));
    case 'barcode':
      return barcode(box(e.x, e.y, e.width, e.height), e.value, e.format ?? 'code128', e.show_text ?? true);
    case 'qrcode':
      return qr(box(e.x, e.y, e.size, e.size), e.value);
    case 'datamatrix':
      return datamatrix(box(e.x, e.y, e.size, e.size), e.value);
    case 'rect':
      return [rect(box(e.x, e.y, e.width, e.height), { fill: e.fill, stroke: e.fill ? e.stroke_mm : (e.stroke_mm ?? 0.4), radius: e.radius_mm })];
    case 'ellipse': {
      const stroke = e.fill ? (e.stroke_mm ?? 0) : (e.stroke_mm ?? 0.4);
      return [
        shape(
          new Ellipse({
            originX: 'left',
            originY: 'top',
            left: u(e.x),
            top: u(e.y),
            rx: u(e.width / 2),
            ry: u(e.height / 2),
            fill: e.fill ? '#000000' : 'transparent',
            stroke: stroke ? '#000000' : undefined,
            strokeWidth: u(stroke),
            strokeUniform: true,
          }),
        ),
      ];
    }
    case 'line': {
      const x = Math.min(e.x1, e.x2);
      const y = Math.min(e.y1, e.y2);
      return [
        shape(
          new Line([u(e.x1 - x), u(e.y1 - y), u(e.x2 - x), u(e.y2 - y)], {
            originX: 'left',
            originY: 'top',
            left: u(x),
            top: u(y),
            stroke: '#000000',
            strokeWidth: u(e.width_mm ?? 0.4),
            strokeDashArray: e.dashed ? [u(1), u(0.7)] : undefined,
          }),
        ),
      ];
    }
    case 'icon': {
      const found = ICONS.find((i) => i.name.toLowerCase() === e.name.toLowerCase());
      if (!found) throw new Error(`Unknown symbol "${e.name}". Symbols: ${ICONS.map((i) => i.name).join(', ')}.`);
      return icon(box(e.x, e.y, e.size, e.size), iconSvg(found.Icon));
    }
    case 'date':
      return date(box(e.x, e.y, e.width, e.height), e.format ?? 'DD/MM/YYYY', e.offset_days ?? 0, textOpts(e));
    case 'serial':
      return serial(
        box(e.x, e.y, e.width, e.height),
        { prefix: e.prefix ?? '', suffix: e.suffix ?? '', start: e.start ?? 1, step: e.step ?? 1, digits: e.digits ?? 4 },
        textOpts(e),
      );
    case 'table':
      return table(box(e.x, e.y, e.width, e.height), e.cells, { pt: e.size_pt, bold: e.bold, align: e.align });
  }
}

/** Builds and checks a label of the given size from a spec. */
export async function buildFromSpec(spec: LabelSpec, widthMm: number, heightMm: number, defaultType: number): Promise<LabelTemplate> {
  await loadBundledFonts();
  const parts: Part[] = [];
  const a = area(widthMm, heightMm);
  if (spec.lines?.length) {
    const lines: KitLine[] = spec.lines.map((l) => ({ t: l.text, weight: l.weight, bold: l.bold, italic: l.italic, font: l.font, align: l.align ?? 'center', invert: l.invert }));
    if (spec.code) {
      const code = spec.code;
      parts.push(...withCode(a, (sq) => codeParts(code.type, code.value, sq), (rest) => stack(rest, lines), code.side ?? 'right'));
    } else {
      parts.push(...stack(a, lines));
    }
  } else if (spec.code) {
    parts.push(...codeParts(spec.code.type, spec.code.value, a));
  }
  for (const e of spec.elements ?? []) parts.push(...elementParts(e));
  if (!parts.length) throw new Error('The label is empty. Give "lines", "code" or "elements".');

  const objects = await Promise.all(parts);
  const t = emptyTemplate(widthMm, heightMm, spec.label_type ?? defaultType);
  t.name = spec.name?.trim() || 'Label from assistant';
  t.canvas = { version: '7', objects: objects.map((o) => o.toObject(['oyn'])) };
  return validateTemplate(t);
}

/** Replaces text in text boxes, barcodes, QR codes and tables. */
export function replaceText(t: LabelTemplate, pairs: { find: string; replace: string }[]): LabelTemplate {
  const swap = (s: string) => pairs.reduce((acc, p) => acc.split(p.find).join(p.replace), s);
  const copy = JSON.parse(JSON.stringify(t)) as LabelTemplate;
  const walk = (objs: unknown[] | undefined) => {
    for (const raw of objs ?? []) {
      const o = raw as Record<string, unknown>;
      if (typeof o.text === 'string') o.text = swap(o.text);
      if (typeof o.value === 'string') o.value = swap(o.value);
      if (Array.isArray(o.cells)) o.cells = (o.cells as string[][]).map((r) => r.map((c) => swap(c)));
      if (Array.isArray(o.objects)) walk(o.objects);
    }
  };
  walk(copy.canvas.objects);
  return validateTemplate(copy);
}
