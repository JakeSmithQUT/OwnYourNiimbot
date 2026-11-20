// Layouts that many templates share: a symbol with lines of text, a heading
// with captions and values, a code with details, and signs.

import { MEDIUM, NARROW, SMALL, type Size } from './kit';
import type { FrameName, Row, Shapes, Spec } from './compose';

/** The fonts that ship with the app. */
export const F = {
  sans: 'Montserrat',
  inter: 'Inter',
  condensed: 'Oswald',
  bebas: 'Bebas Neue',
  heavy: 'Archivo Black',
  serif: 'Playfair Display',
  fat: 'Abril Fatface',
  classic: 'Cinzel',
  slab: 'Roboto Slab',
  retro: 'Pacifico',
  formal: 'Great Vibes',
  script: 'Dancing Script',
  hand: 'Caveat',
  marker: 'Permanent Marker',
  amatic: 'Amatic SC',
  round: 'Fredoka',
  righteous: 'Righteous',
  mono: 'JetBrains Mono',
  space: 'Space Mono',
};

/** Medium and small rectangles. */
export const CARD: Size[] = [...MEDIUM, ...SMALL];
/** Every common rectangle, from the narrow rolls to 70 × 40 mm. */
export const ANY: Size[] = [...MEDIUM, ...SMALL, ...NARROW];
/** Sizes for signs. */
export const SIGN: Size[] = [...MEDIUM, ...SMALL, [50, 50], [40, 12], [50, 15], [75, 12], [30, 15]];

const oneLine = (t: string) => t.replace(/\n/g, ' ');

/** Splits a long sign word at the space nearest to the middle, for the shortest labels. */
function twoLines(t: string, longest = 10): string {
  const flat = oneLine(t);
  if (t.includes('\n')) return t;
  if (flat.length <= longest || !flat.includes(' ')) return flat;
  const spaces = [...flat.matchAll(/ /g)].map((m) => m.index);
  const at = spaces.reduce((best, i) => (Math.abs(i - flat.length / 2) < Math.abs(best - flat.length / 2) ? i : best), spaces[0]);
  return `${flat.slice(0, at)}\n${flat.slice(at + 1)}`;
}

/** A symbol on the left, a main line and smaller lines. */
export function iconLines(iconName: string, main: string, ...rest: string[]): Shapes {
  return {
    base: { side: { icon: iconName }, rows: [{ t: main, bold: true, weight: rest.length ? 1.4 : 1 }, ...rest.map((t) => ({ t }))] },
    small: { side: { icon: iconName }, rows: [{ t: main, bold: true, weight: 1.3 }, ...rest.slice(0, 2).map((t) => ({ t }))] },
    narrow: { side: { icon: iconName }, rows: rest.length ? [{ t: main, bold: true, weight: 1.3 }, { t: rest[0] }] : [{ t: main, bold: true }], gap: 0.2 },
    short: { side: { icon: iconName, width: 0.24 }, rows: [{ t: main, bold: true }] },
  };
}

/** Main line and smaller lines, without a symbol. */
export function lines(main: string, ...rest: string[]): Shapes {
  return {
    base: { rows: [{ t: main, bold: true, weight: rest.length ? 1.5 : 1 }, ...rest.map((t) => ({ t }))] },
    small: { rows: [{ t: main, bold: true, weight: 1.4 }, ...rest.slice(0, 2).map((t) => ({ t }))] },
    narrow: { rows: rest.length ? [{ t: main, bold: true, weight: 1.3 }, { t: rest[0] }] : [{ t: main, bold: true }], gap: 0.2 },
    short: { rows: [{ t: main, bold: true }] },
  };
}

type Pair = Extract<Row, { kv: unknown }>['kv'];

/** A black heading bar, then captions with values. An empty value gives a line to write on. */
export function card(head: string, pairs: Pair[], frame?: FrameName): Shapes {
  const heading: Row = { t: head, invert: true, bold: true, align: 'center', spacing: 40, weight: 1.15 };
  const kv = (list: Pair[]): Row[] => list.map((p) => ({ kv: p }));
  return {
    base: { frame, align: 'left', rows: [heading, ...kv(pairs)] },
    small: { align: 'left', rows: [heading, ...kv(pairs.slice(0, 2))], gap: 0.3 },
    narrow: { align: 'left', side: { block: head, width: 0.3 }, rows: kv(pairs.slice(0, 2)), gap: 0.2 },
  };
}

/** A QR code or a Data Matrix code with a main line and smaller lines. */
export function coded(kind: 'qr' | 'datamatrix', value: string, main: string, ...rest: string[]): Shapes {
  const side = { code: kind, value, at: 'left' as const };
  return {
    base: { side, rows: [{ t: main, bold: true, weight: 1.5 }, ...rest.map((t) => ({ t }))] },
    small: { side, rows: [{ t: main, bold: true, weight: 1.4 }, ...rest.slice(0, 2).map((t) => ({ t }))] },
    narrow: { side: { ...side, code: 'datamatrix' }, rows: [{ t: main, bold: true, weight: 1.3 }, ...rest.slice(0, 1).map((t) => ({ t }))], gap: 0.2 },
    short: { side: { ...side, code: 'datamatrix' }, rows: [{ t: main, bold: true }] },
  };
}

export type SignStyle = 'plain' | 'warn' | 'ban' | 'info';

/**
 * A sign: a symbol, a word in heavy capitals and an optional line under it.
 * warn gives striped bands, ban gives a heavy frame and info gives white on black.
 */
export function sign(iconName: string, word: string, sub = '', style: SignStyle = 'plain'): Shapes {
  const look: Partial<Spec> = style === 'warn' ? { bands: 'stripes' } : style === 'ban' ? { frame: 'bold' } : style === 'info' ? { shape: 'block' } : {};
  const main = twoLines(word, 10);
  const big = main.includes('\n') ? 2.4 : 1.6;
  const body: Row[] = sub ? [{ t: main, bold: true, weight: big }, { t: sub }] : [{ t: main, bold: true }];
  return {
    base: { ...look, side: { icon: iconName }, rows: body },
    small: { ...(style === 'ban' ? {} : look), side: { icon: iconName }, rows: body },
    narrow: style === 'warn' ? { bands: 'stripes', rows: [{ t: oneLine(word), bold: true }] } : { ...(style === 'info' ? look : {}), side: { icon: iconName }, rows: [{ t: oneLine(word), bold: true }] },
    short: { ...(style === 'info' || style === 'warn' ? look : {}), rows: [{ t: twoLines(word), bold: true }] },
  };
}
