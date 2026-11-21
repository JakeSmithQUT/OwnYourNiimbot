// The "Cute animals" symbol group. Each animal is drawn for this app in the
// 24 × 24 grid of the icon set: one outline for the head and the ears, solid
// eyes and nose, and one feature that identifies the animal. There are no grey
// tones, so the symbols print cleanly on a 1-bit thermal head.
//
// An animal with a face comes with four expressions: plain, happy, sleepy and
// in love. Several are Australian animals, because the app is made in Australia.

import { createLucideIcon, type IconNode, type LucideIcon } from 'lucide-react';

export type Shape = [tag: string, attrs: Record<string, string | number>];

/** Makes a symbol from shapes, in the same form as the symbols of the icon set. */
export const customIcon = (id: string, shapes: Shape[]): LucideIcon =>
  createLucideIcon(id, shapes.map(([tag, attrs], i) => [tag, { ...attrs, key: `${id}${i}` }]) as IconNode);

// ---------- drawing helpers ----------

type P = [number, number];
interface Oval {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

const f = (v: number) => Number(v.toFixed(2));
const pt = ([x, y]: P) => `${f(x)} ${f(y)}`;
const flip = ([x, y]: P): P => [24 - x, y];
const rad = (deg: number) => (deg * Math.PI) / 180;
/** Point on an oval. 180 is the left side and 270 is the top. */
const on = (o: Oval, deg: number): P => [o.cx + o.rx * Math.cos(rad(deg)), o.cy + o.ry * Math.sin(rad(deg))];
const round = (cx: number, cy: number, r: number): Oval => ({ cx, cy, rx: r, ry: r });

const THIN = 1.5;
const SOLID = { fill: 'currentColor', stroke: 'none' };

const path = (d: string, strokeWidth?: number): Shape => ['path', strokeWidth ? { d, strokeWidth } : { d }];
const solid = (d: string): Shape => ['path', { d, ...SOLID }];
const oval = (o: Oval, strokeWidth?: number): Shape => ['ellipse', strokeWidth ? { ...o, strokeWidth } : { ...o }];
const blob = (cx: number, cy: number, rx: number, ry = rx): Shape => ['ellipse', { cx, cy, rx, ry, ...SOLID }];
const line = (pts: P[], strokeWidth?: number): Shape => path(pts.map((p, i) => `${i ? 'L' : 'M'}${pt(p)}`).join(''), strokeWidth);
/** Curves through the points: start, then pairs of control point and end point. */
function curveD(pts: P[]): string {
  let d = `M${pt(pts[0])}`;
  for (let i = 1; i + 1 < pts.length; i += 2) d += `Q${pt(pts[i])} ${pt(pts[i + 1])}`;
  return d;
}
const curve = (pts: P[], strokeWidth?: number): Shape => path(curveD(pts), strokeWidth);
const shape = (pts: P[]): Shape => solid(`${curveD(pts)}Z`);
/** The shape and its mirror image on the other side of the face. */
const both = <A extends unknown[]>(make: (pts: P[], ...rest: A) => Shape, pts: P[], ...rest: A): Shape[] => [make(pts, ...rest), make(pts.map(flip), ...rest)];

/** The angles at which a circle is outside an oval: where it leaves the oval and where it enters it again. */
function outside(c: Oval, o: Oval): [number, number] | undefined {
  const isOut = (deg: number) => {
    const [x, y] = on(c, deg);
    return ((x - o.cx) / o.rx) ** 2 + ((y - o.cy) / o.ry) ** 2 > 1;
  };
  let start: number | undefined;
  for (let a = 0; a < 360; a += 0.5) if (isOut(a) && !isOut(a - 0.5)) start = a;
  if (start === undefined) return undefined;
  let end = start;
  while (end < start + 360 && isOut(end + 0.5)) end += 0.5;
  return [start, end];
}

/** The part of a round shape that is outside an oval, so that the two outlines do not cross. */
function bump(c: Oval, o: Oval, filled = false): Shape {
  const span = outside(c, o);
  if (!span) return oval(c);
  const [a, b] = span;
  const arc = `M${pt(on(c, a))}A${c.rx} ${c.ry} 0 ${b - a > 180 ? 1 : 0} 1 ${pt(on(c, b))}`;
  return filled ? solid(`${arc}A${o.rx} ${o.ry} 0 0 0 ${pt(on(c, a))}Z`) : path(arc);
}
const bumps = (c: Oval, o: Oval, filled = false): Shape[] => [bump(c, o, filled), bump({ ...c, cx: 24 - c.cx }, o, filled)];

interface Ear {
  /** Where the ear starts and ends on the head. 180 is the left side and 270 is the top. */
  from: number;
  to: number;
  tip: P;
  /** Control points that make the outer and the inner side of the ear curved. */
  out?: P;
  inn?: P;
  /** A round top: its radius and the point where it ends. */
  cap?: { r: number; end: P };
}

/** A head and two ears as one outline. The right ear is the mirror image of the left ear. */
function head(o: Oval, ear: Ear): Shape {
  const top = ear.cap?.end ?? ear.tip;
  const left =
    (ear.out ? `Q${pt(ear.out)} ${pt(ear.tip)}` : `L${pt(ear.tip)}`) +
    (ear.cap ? `A${ear.cap.r} ${ear.cap.r} 0 0 1 ${pt(ear.cap.end)}` : '') +
    (ear.inn ? `Q${pt(ear.inn)} ${pt(on(o, ear.to))}` : `L${pt(on(o, ear.to))}`);
  const right =
    (ear.inn ? `Q${pt(flip(ear.inn))} ${pt(flip(top))}` : `L${pt(flip(top))}`) +
    (ear.cap ? `A${ear.cap.r} ${ear.cap.r} 0 0 1 ${pt(flip(ear.tip))}` : '') +
    (ear.out ? `Q${pt(flip(ear.out))} ${pt(on(o, 540 - ear.from))}` : `L${pt(on(o, 540 - ear.from))}`);
  const arc = (large: number, to: P) => `A${o.rx} ${o.ry} 0 ${large} 1 ${pt(to)}`;
  return path(`M${pt(on(o, ear.from))}${left}${arc(0, on(o, 540 - ear.to))}${right}${arc(2 * ear.from - 180 > 180 ? 1 : 0, on(o, ear.from))}Z`);
}

/** A ring of round bumps, for a mane. */
function scallop(cx: number, cy: number, R: number, count: number): Shape {
  const at = (i: number) => on(round(cx, cy, R), (i / count) * 360 - 90);
  const rr = f(R * Math.sin(Math.PI / count) * 1.1);
  let d = `M${pt(at(0))}`;
  for (let i = 1; i <= count; i++) d += `A${rr} ${rr} 0 0 1 ${pt(at(i))}`;
  return path(d);
}

/** A mouth like a soft letter W, under a nose. */
const wMouth = (y: number, w = 1.4, x = 12): Shape => path(`M${f(x - w)} ${y}q${f(w / 2)} 1.1 ${w} 0q${f(w / 2)} 1.1 ${w} 0`, THIN);
const smile = (y: number, w: number, depth: number): Shape => curve([[12 - w, y], [12, y + depth], [12 + w, y]], THIN);
/** A small solid nose with a round top and a point at the bottom. */
const nose = (y: number, w = 1.1): Shape => solid(`M${f(12 - w)} ${y}Q12 ${f(y - 0.5)} ${f(12 + w)} ${y}Q${f(12 + w * 0.5)} ${f(y + w * 0.95)} 12 ${f(y + w * 1.05)}Q${f(12 - w * 0.5)} ${f(y + w * 0.95)} ${f(12 - w)} ${y}Z`);

// ---------- expressions ----------

interface Face {
  /** Head, ears and nose: all parts but the eyes and the mouth. */
  base: Shape[];
  /** Middle of the left eye. The right eye is its mirror image. */
  eye: P;
  /** Radius of the eye. */
  size?: number;
  mouth?: Shape[];
  /** Mouth for the happy face. The default is the plain mouth. */
  happy?: Shape[];
}

const eyes = (face: Face, draw: (p: P, r: number) => Shape): Shape[] => [draw(face.eye, face.size ?? 1.05), draw(flip(face.eye), face.size ?? 1.05)];
const openEye = ([x, y]: P, r: number): Shape => blob(x, y, r);
/** An eye like a small arch, for a smile. */
const gladEye = ([x, y]: P, r: number): Shape => path(`M${f(x - r * 1.25)} ${f(y + r * 0.55)}q${f(r * 1.25)} ${f(-r * 2)} ${f(r * 2.5)} 0`, 1.6);
/** A closed eye. */
const shutEye = ([x, y]: P, r: number): Shape => path(`M${f(x - r * 1.25)} ${f(y - r * 0.2)}q${f(r * 1.25)} ${f(r * 1.6)} ${f(r * 2.5)} 0`, 1.6);
/** A solid heart in place of the eye. */
function heartEye([x, y]: P, r: number): Shape {
  const s = r * 2.9;
  const lobe = f(s * 0.27);
  return solid(`M${f(x)} ${f(y + s * 0.45)}L${f(x - s * 0.5)} ${f(y - s * 0.05)}A${lobe} ${lobe} 0 0 1 ${f(x)} ${f(y - s * 0.25)}A${lobe} ${lobe} 0 0 1 ${f(x + s * 0.5)} ${f(y - s * 0.05)}Z`);
}
const ZED = path('M17.8 1.5h4.2l-4.2 4.6h4.2', 1.8);
/** Makes the animal a little smaller and moves it down and left, so that the top right corner is free for the letter Z. */
const small = (shapes: Shape[]): Shape[] => shapes.map(([tag, attrs]) => [tag, { ...attrs, transform: `translate(0 4.6) scale(0.8)${attrs.transform ? ` ${attrs.transform}` : ''}` }]);

function expressions(id: string, name: string, face: Face): [string, LucideIcon][] {
  const mouth = face.mouth ?? [];
  return [
    [`cute ${name}`, customIcon(`oyn-${id}`, [...face.base, ...eyes(face, openEye), ...mouth])],
    [`happy ${name}`, customIcon(`oyn-${id}-happy`, [...face.base, ...eyes(face, gladEye), ...(face.happy ?? mouth)])],
    [`sleepy ${name}`, customIcon(`oyn-${id}-sleepy`, [...small([...face.base, ...eyes(face, shutEye), ...mouth]), ZED])],
    [`${name} in love`, customIcon(`oyn-${id}-love`, [...face.base, ...eyes(face, heartEye), ...(face.happy ?? mouth)])],
  ];
}

// ---------- faces ----------

const CAT: Oval = { cx: 12, cy: 14, rx: 8.8, ry: 7 };
const DOG: Oval = { cx: 12, cy: 12.6, rx: 6.6, ry: 7.4 };
const BUNNY: Oval = { cx: 12, cy: 15.6, rx: 6.8, ry: 5.9 };
const BEAR = round(12, 13.6, 7.4);
const MOUSE = round(12, 14.8, 6.4);
const PIG: Oval = { cx: 12, cy: 13.4, rx: 8.4, ry: 7.4 };
const FROG: Oval = { cx: 12, cy: 14.6, rx: 8.8, ry: 6.2 };
const MONKEY = round(12, 12.6, 6.8);
const COW = round(12, 11.4, 6.4);
const COW_MUZZLE: Oval = { cx: 12, cy: 16.6, rx: 5, ry: 3.4 };
const DEER: Oval = { cx: 12, cy: 14.8, rx: 5.4, ry: 6.4 };
const KOALA = round(12, 13.8, 6.8);
const WOMBAT: Oval = { cx: 12, cy: 14, rx: 8.4, ry: 6.8 };
const QUOKKA = round(12, 13.6, 7);
const POSSUM: Oval = { cx: 12, cy: 14.4, rx: 7.6, ry: 6.4 };
const DINGO: Oval = { cx: 12, cy: 14.4, rx: 7.6, ry: 6.8 };
const ROO: Oval = { cx: 12, cy: 15.2, rx: 5, ry: 6.4 };
const PLATYPUS = round(12, 9.6, 5.8);
const BILL: Oval = { cx: 12, cy: 17, rx: 6.8, ry: 3.6 };
const COCKATOO = round(12, 14.4, 6.6);

const FACES: [id: string, name: string, face: Face][] = [
  ['cat', 'cat', {
    base: [head(CAT, { from: 202, to: 247, tip: [3.8, 3.4] }), nose(15.6, 0.9)],
    eye: [8.2, 13.6], size: 1.15, mouth: [wMouth(16.5, 1.3)],
  }],
  ['dog', 'dog', {
    base: [
      oval(DOG), ...both(shape, [on(DOG, 232), [1.4, 5.2], [1.6, 11.4], [1.8, 16.2], on(DOG, 168)]), blob(12, 14.6, 1.6, 1.15),
      line([[12, 15.7], [12, 16.6]], THIN),
    ],
    eye: [9.3, 11.4], mouth: [wMouth(16.6, 1.5)], happy: [wMouth(16.6, 1.5), solid('M10.9 17.6h2.2v1a1.1 1.1 0 0 1-2.2 0z')],
  }],
  ['bunny', 'bunny', {
    base: [head(BUNNY, { from: 226, to: 262, tip: [6.4, 3.6], cap: { r: 1.9, end: [10.2, 3.6] } }), nose(17, 0.75)],
    eye: [9.2, 15.2], mouth: [wMouth(17.75, 1.1)],
  }],
  ['bear', 'bear', {
    base: [oval(BEAR), ...bumps(round(5.6, 7.4, 2.8), BEAR), oval({ cx: 12, cy: 16.2, rx: 3.3, ry: 2.6 }, THIN), blob(12, 15.3, 1.15, 0.8)],
    eye: [8.6, 12.4], mouth: [wMouth(16.4, 1)],
  }],
  ['panda', 'panda', {
    base: [
      oval(BEAR), ...bumps(round(5.6, 7.4, 2.8), BEAR, true),
      ['ellipse', { cx: 8.5, cy: 12.8, rx: 2.2, ry: 2.8, strokeWidth: THIN, transform: 'rotate(22 8.5 12.8)' }],
      ['ellipse', { cx: 15.5, cy: 12.8, rx: 2.2, ry: 2.8, strokeWidth: THIN, transform: 'rotate(-22 15.5 12.8)' }], nose(16.2, 0.9),
    ],
    eye: [8.6, 12.9], size: 0.95, mouth: [wMouth(17.1, 1.2)],
  }],
  ['fox', 'fox', {
    base: [
      path('M3.4 3 9.4 7.6Q12 6.8 14.6 7.6L20.6 3 21 9.6Q22.6 12.4 21.4 14.2 17.4 18.6 12 21.4 6.6 18.6 2.6 14.2 1.4 12.4 3 9.6Z'),
      blob(12, 19.3, 1.25, 1), ...both(curve, [[2.9, 14.4], [7.4, 14.6], [10.6, 18.6]], THIN),
    ],
    eye: [8.4, 11.9],
  }],
  ['mouse', 'mouse', {
    base: [oval(MOUSE), ...bumps(round(5.2, 7.6, 3.9), MOUSE), blob(4.9, 7.3, 1.5), blob(19.1, 7.3, 1.5), nose(16.6, 0.8)],
    eye: [9.4, 14.2], mouth: [wMouth(17.4, 1.1)],
  }],
  ['pig', 'pig', {
    base: [head(PIG, { from: 214, to: 244, tip: [4.6, 4.2], out: [3.2, 7], inn: [7.6, 4.6] }), oval({ cx: 12, cy: 15.6, rx: 3.5, ry: 2.5 }, 1.7), blob(10.8, 15.6, 0.6, 0.95), blob(13.2, 15.6, 0.6, 0.95)],
    eye: [7.9, 11.6],
  }],
  ['frog', 'frog', {
    base: [oval(FROG), ...bumps(round(7, 7.6, 3.5), FROG), blob(11.1, 12.8, 0.45), blob(12.9, 12.8, 0.45)],
    eye: [7, 7.6], size: 1, mouth: [smile(14.8, 5.6, 4.6)],
  }],
  ['monkey', 'monkey', {
    base: [
      oval(MONKEY), ...bumps(round(4.4, 12.8, 2.6), MONKEY),
      path('M12 9.4C10.4 7.2 7.2 8.2 7.4 11.4 7.5 13 8.5 13.6 8.4 15.2 8.3 17.6 10 18.8 12 18.8S15.7 17.6 15.6 15.2C15.5 13.6 16.5 13 16.6 11.4 16.8 8.2 13.6 7.2 12 9.4Z', THIN),
      blob(11.3, 14.2, 0.4), blob(12.7, 14.2, 0.4),
    ],
    eye: [9.7, 11.6], size: 0.95, mouth: [smile(15.7, 1.9, 1.7)],
  }],
  ['lion', 'lion', {
    base: [scallop(12, 12.4, 9.4, 11), oval(round(12, 12.4, 6)), nose(13.6, 1)],
    eye: [9.6, 11.4], size: 0.95, mouth: [wMouth(14.6, 1.3)],
  }],
  ['tiger', 'tiger', {
    base: [
      oval(BEAR), ...bumps(round(5.8, 7.2, 2.6), BEAR), solid('M11.2 6.3h1.6l-.8 3.4z'), ...both(shape, [[8.6, 7], [9.9, 7.6], [10.1, 9.8]]),
      ...both(shape, [[4.7, 13], [7.6, 13.2], [4.7, 14.4]]), ...both(shape, [[5.4, 16.6], [8, 16.2], [6.2, 17.9]]), nose(15.6, 0.95),
    ],
    eye: [8.8, 12.6], mouth: [wMouth(16.55, 1.3)],
  }],
  ['cow', 'cow', {
    base: [
      bump(COW, COW_MUZZLE), oval(COW_MUZZLE), blob(10.3, 16.6, 0.7, 1), blob(13.7, 16.6, 0.7, 1), ...both(curve, [[8.4, 6], [5.4, 5.8], [5, 2.6]]),
      ...both(shape, [on(COW, 196), [3.2, 6.2], [1.2, 8.6], [2.4, 11.6], on(COW, 172)]),
    ],
    eye: [9.4, 11],
  }],
  ['sheep', 'sheep', {
    base: [
      path('M5.8 12.2A3 3 0 0 1 5.4 7 3.5 3.5 0 0 1 9.6 3.9 3.6 3.6 0 0 1 14.4 3.9 3.5 3.5 0 0 1 18.6 7 3 3 0 0 1 18.2 12.2'), path('M7.6 11.4V15A4.4 4.4 0 0 0 16.4 15V11.4'),
      ...both(shape, [[7.5, 11.5], [4.4, 10.6], [2.6, 12.8], [5, 14.6], [7.5, 13.5]]), solid('M11.1 16.6h1.8l-.9 1.1z'), line([[12, 17.6], [12, 18.4]], THIN),
    ],
    eye: [10, 14.2], size: 0.9,
  }],
  ['chick', 'chick', {
    base: [
      oval(round(12, 13.6, 7.4)), line([[12, 6.2], [12, 3.4]], 1.8), curve([[10.4, 6.4], [9.8, 4.6], [8.6, 3.8]], 1.8), curve([[13.6, 6.4], [14.2, 4.6], [15.4, 3.8]], 1.8),
      solid('M10.4 14.4 12 13.3 13.6 14.4 12 16.2Z'),
    ],
    eye: [8.9, 12.2], size: 1.15,
  }],
  ['penguin', 'penguin', {
    base: [
      path('M12 2.4C7.6 2.4 5.6 6.4 5.6 11.6V16A5 5 0 0 0 10.6 21H13.4A5 5 0 0 0 18.4 16V11.6C18.4 6.4 16.4 2.4 12 2.4Z'),
      path('M12 9.4C10.4 7 7.9 8.4 7.9 11.4V15.6A2.8 2.8 0 0 0 10.7 18.4H13.3A2.8 2.8 0 0 0 16.1 15.6V11.4C16.1 8.4 13.6 7 12 9.4Z', THIN),
      ...both(shape, [[5.6, 10.6], [2.4, 13.6], [2.6, 17.4], [4.6, 16.4], [5.6, 14.4]]), solid('M10.8 12.6h2.4L12 14.4z'),
    ],
    eye: [10, 10.9], size: 0.85,
  }],
  ['owl', 'owl', {
    base: [
      path('M5.2 3.4 8.6 5.8Q12 4.4 15.4 5.8L18.8 3.4V14A6.8 6.8 0 0 1 5.2 14Z'), oval({ cx: 8.8, cy: 10.6, rx: 2.9, ry: 2.9 }, THIN), oval({ cx: 15.2, cy: 10.6, rx: 2.9, ry: 2.9 }, THIN),
      solid('M11 12.8h2l-1 1.9z'), line([[9.4, 16.6], [10.3, 17.5], [11.2, 16.6]], THIN), line([[12.8, 16.6], [13.7, 17.5], [14.6, 16.6]], THIN),
    ],
    eye: [8.8, 10.6], size: 1.1,
  }],
  ['elephant', 'elephant', {
    base: [
      path('M10.1 16.5A5.6 5.6 0 1 1 13.9 16.5'), path('M10.1 13.4V19A1.9 1.9 0 0 0 13.9 19V13.4'), line([[10.1, 16.2], [13.9, 16.2]], THIN), line([[10.1, 18.2], [13.9, 18.2]], THIN),
      ...both(curve, [on(round(12, 11.2, 5.6), 222), [2.4, 2.6], [1.4, 9.8], [1.2, 16.4], on(round(12, 11.2, 5.6), 150)]),
    ],
    eye: [9.5, 10.6], size: 0.95,
  }],
  ['deer', 'deer', {
    base: [
      oval(DEER), ...both(curve, [[9.4, 9], [7.4, 6.4], [7.8, 2.4]], 1.8), ...both(curve, [[8, 6], [5.8, 5.8], [4.6, 3.6]], 1.8),
      ...both(shape, [on(DEER, 212), [4.2, 9.2], [2, 10.4], [3.2, 13.6], on(DEER, 186)]), blob(12, 18.8, 1.4, 1),
    ],
    eye: [9.7, 14.2],
  }],
  ['octopus', 'octopus', {
    base: [
      path('M4.8 13.6V10.6A7.2 7.2 0 0 1 19.2 10.6V13.6'), ...both(curve, [[4.8, 13.6], [5, 17.2], [2.4, 18.4]]), ...both(curve, [[8.8, 15], [9.2, 18.6], [6.6, 20.6]]),
      line([[12, 15.4], [12, 21]]), path('M4.8 13.6Q6.8 15.6 8.8 15 10.4 16 12 15.4 13.6 16 15.2 15 17.2 15.6 19.2 13.6', THIN),
    ],
    eye: [9.4, 10.2], mouth: [smile(12, 1.4, 1.2)],
  }],
  // ---------- Australian animals ----------
  ['koala', 'koala', {
    base: [oval(KOALA), ...bumps(round(4.6, 8.4, 3.9), KOALA), ...both(curve, [[3.4, 8.2], [4.4, 6.6], [6, 6.9]], THIN), blob(12, 14.8, 1.6, 2.3)],
    eye: [8.3, 12.8], size: 0.95, mouth: [smile(18.2, 1.1, 0.7)],
  }],
  ['wombat', 'wombat', {
    base: [oval(WOMBAT), ...bumps(round(6, 7.8, 2.1), WOMBAT), ['rect', { x: 9.9, y: 13.2, width: 4.2, height: 2.9, rx: 1.3, ...SOLID }], line([[12, 16], [12, 17]], THIN)],
    eye: [7.7, 12.4], size: 0.9, mouth: [wMouth(17, 1.3)],
  }],
  ['quokka', 'quokka', {
    base: [oval(QUOKKA), ...bumps(round(6.4, 6.8, 2.5), QUOKKA), blob(12, 13.9, 1.3, 0.9)],
    eye: [8.8, 11.6], mouth: [smile(14.6, 4.6, 4.8)],
  }],
  ['possum', 'possum', {
    base: [
      head(POSSUM, { from: 206, to: 250, tip: [5.2, 3.2], out: [2.4, 6.8], inn: [9.8, 4] }), nose(16.9, 0.8),
      ...both(line, [[4.9, 16], [1.8, 15.4]], THIN), ...both(line, [[5.4, 17.8], [2.6, 18.6]], THIN),
    ],
    eye: [8.8, 13.6], size: 1.45, mouth: [wMouth(17.7, 1.1)],
  }],
  ['devil', 'tasmanian devil', {
    base: [oval(QUOKKA), ...bumps(round(5.8, 7.4, 2.7), QUOKKA), blob(12, 13.6, 1.4, 0.95), ...both(line, [[6.6, 9.6], [9.8, 10.6]], THIN)],
    eye: [8.8, 12], size: 0.95,
    mouth: [path('M8.4 15.4Q12 16.6 15.6 15.4 15.4 19.6 12 19.6 8.6 19.6 8.4 15.4Z', THIN), ...both(shape, [[9.4, 15.8], [10.1, 17.6], [10.9, 16.1]])],
  }],
  ['dingo', 'dingo', {
    base: [head(DINGO, { from: 208, to: 249, tip: [5, 2.4] }), blob(12, 16.2, 1.6, 1.15), line([[12, 17.3], [12, 18]], THIN)],
    eye: [8.7, 13.4], mouth: [wMouth(18, 1.4)],
  }],
  ['kangaroo', 'kangaroo', {
    base: [head(ROO, { from: 218, to: 258, tip: [6.6, 1.8], out: [3.8, 7.6], inn: [10.6, 4] }), blob(12, 19.4, 1.5, 1.05)],
    eye: [9.9, 14.4],
  }],
  ['platypus', 'platypus', {
    base: [bump(PLATYPUS, BILL), oval(BILL), blob(10.5, 15.9, 0.5), blob(13.5, 15.9, 0.5)],
    eye: [9.7, 9.4],
  }],
  ['cockatoo', 'cockatoo', {
    base: [
      oval(COCKATOO), curve([[10.2, 8], [9.2, 4.6], [12.2, 1.6]]), curve([[12.6, 7.8], [13, 4.6], [16.4, 2.8]]), curve([[15, 8.6], [16.2, 6], [19.6, 5.8]]),
      solid('M10.3 13.8Q12 12.4 13.7 13.8 13.8 16.6 12 18 10.2 16.6 10.3 13.8Z'),
    ],
    eye: [8.6, 12.6],
  }],
];

// ---------- animals with one drawing ----------

const JOEY: Oval = { cx: 12, cy: 8.8, rx: 3.9, ry: 3.8 };
const BEE: Oval = { cx: 12, cy: 14.8, rx: 5.2, ry: 5.8 };
/** A stripe across the body of the bee. */
function stripe(y: number): Shape {
  const half = BEE.rx * Math.sqrt(1 - ((y - BEE.cy) / BEE.ry) ** 2) - 1;
  return line([[12 - half, y], [12 + half, y]], 2.2);
}
const LADYBIRD = round(12, 14.6, 6.4);

const SINGLES: [string, LucideIcon][] = [
  ['joey in pouch', customIcon('oyn-joey', [
    head(JOEY, { from: 226, to: 258, tip: [7.6, 0.8], out: [5.6, 4.2], inn: [10.4, 2.4] }), blob(10.5, 8.6, 0.8), blob(13.5, 8.6, 0.8), blob(12, 10.6, 0.75, 0.55),
    path('M3.4 12.6H20.6Q20.4 21.4 12 21.4 3.6 21.4 3.4 12.6Z'), blob(8.4, 12.6, 1.4, 1.1), blob(15.6, 12.6, 1.4, 1.1),
  ])],
  ['emu', customIcon('oyn-emu', [
    oval({ cx: 9.4, cy: 13.4, rx: 6.2, ry: 4.4 }), curve([[14.6, 11.2], [18, 9.4], [16.8, 5.4]], 2.4), blob(17, 4, 1.9), solid('M18.4 3.2 22 4.6 18.5 5.4Z'),
    line([[7.4, 17.6], [7.4, 21.4], [9.2, 21.4]]), line([[12, 17.4], [12, 21.4], [13.8, 21.4]]), curve([[5.4, 12.4], [7, 14.2], [8.8, 12.6]], THIN),
  ])],
  ['echidna', customIcon('oyn-echidna', [
    path('M2.6 18.4Q2.4 10 10.6 10 16.4 10 18.4 14.4L22.4 17Q20.8 18.4 18.6 18.4Z'), blob(16.6, 14.8, 0.85), blob(22.2, 17, 0.7),
    ...[[4.4, 12.2, 2.6, 9.4], [6.6, 10.6, 5.4, 7.4], [9.2, 10, 8.8, 6.6], [12, 10.2, 12.6, 6.8], [14.6, 11, 16, 8], [16.6, 12.4, 18.6, 10]].map(([x1, y1, x2, y2]) => line([[x1, y1], [x2, y2]], 1.7)),
    ...[[6.4, 14.6, 5.4, 12.6], [9.4, 14, 8.9, 11.9], [12.4, 14.2, 12.8, 12.2]].map(([x1, y1, x2, y2]) => line([[x1, y1], [x2, y2]], THIN)), blob(7.4, 19, 1.3, 0.9), blob(14.4, 19, 1.3, 0.9),
  ])],
  ['kookaburra', customIcon('oyn-kookaburra', [
    oval(round(8.8, 7.6, 4.6)), solid('M12.9 5.4 22.4 7.2 13.2 9.6Z'), blob(9.8, 6.9, 0.95), line([[4.4, 8.4], [8.4, 8.2]], 1.8),
    path('M5 10.6Q2.6 15.4 6.8 18.6H11.4Q16.6 17.6 14.6 11.6L12.6 10.4'), curve([[7.6, 12.4], [9.6, 16.4], [13.2, 15.2]], THIN),
    solid('M11.6 18 14.4 16.4 19 21.4 16.6 22.4Z'), line([[1.8, 19.8], [12.6, 19.8]]),
  ])],
  ['bee', customIcon('oyn-bee', [
    oval(BEE), stripe(14.9), stripe(17.9), ...both(curve, [on(BEE, 228), [5.4, 3.4], [1.8, 5.6], [0.2, 9.4], on(BEE, 192)]), blob(10.2, 11.7, 0.8), blob(13.8, 11.7, 0.8),
    ...both(curve, [[10.9, 9.1], [10.6, 6.6], [9.2, 5.8]], THIN),
    solid('M11.1 20.5h1.8L12 22.6z'),
  ])],
  ['ladybird', customIcon('oyn-ladybird', [
    oval(LADYBIRD), bump({ cx: 12, cy: 8.2, rx: 3.4, ry: 3.4 }, LADYBIRD, true),
    line([[12, 7], [12, 20.6]], THIN), blob(8.8, 13.4, 1.25), blob(15.2, 13.4, 1.25), blob(9.2, 17.4, 1.1), blob(14.8, 17.4, 1.1),
    ...both(curve, [[10.6, 5.4], [10.2, 3.2], [8.4, 2.2]], THIN),
  ])],
  ['butterfly', customIcon('oyn-butterfly', [
    blob(12, 12.6, 0.95, 5.2), ...both(curve, [[11.2, 9.4], [8.6, 2.6], [3.4, 4.6], [0.6, 10.6], [6.4, 12.8], [9.4, 13.4], [11.2, 12]]),
    ...both(curve, [[11.2, 13], [6.6, 13.6], [6, 17], [6.4, 20.6], [9.6, 20], [11, 18.6], [11.2, 16]]), blob(6.6, 8.6, 1.2), blob(17.4, 8.6, 1.2),
    ...both(curve, [[11.6, 7.6], [11.2, 5], [9.4, 4.2]], THIN),
  ])],
  ['whale', customIcon('oyn-whale', [
    path('M2.4 13C3 9.6 6.4 7.4 10.6 7.4 15.4 7.4 18.8 10 19.6 13.8 19.6 12.2 20.2 11 21.4 10.2'), path('M2.4 13C2.4 17 6 19.8 10.8 19.8H13.4C17.2 19.8 19.7 17.6 19.6 13.8'),
    solid('M21.4 10.6Q18.6 10 18.2 6.8 20.6 7 21.4 9 22 7.2 23.6 7 23.6 9.8 21.4 10.6Z'), blob(7, 13, 0.95), curve([[3.6, 15.6], [6.4, 17.4], [9.4, 16.2]], THIN),
    curve([[10.4, 5.2], [10.2, 2.8], [8, 2.6]], THIN), curve([[10.4, 5.2], [10.6, 2.8], [12.8, 2.6]], THIN),
  ])],
  ['hedgehog', customIcon('oyn-hedgehog', [
    path('M3.4 18.4 2.4 15.4 4.6 15.6 3.8 12.4 6.4 13.4 6.2 10.2 8.8 12 9.6 8.8 11.6 11.4 13.2 8.6 14.4 11.8Q17.4 12.6 18.8 15.2L22.4 17.4Q21 18.4 19 18.4Z'),
    blob(17, 15.2, 0.85), blob(22.2, 17.4, 0.75), blob(7.4, 19.1, 1.3, 0.9), blob(14.6, 19.1, 1.3, 0.9),
    line([[7.4, 15.8], [8.2, 14.2]], THIN), line([[10.6, 15.4], [11.2, 13.8]], THIN), line([[13.6, 15.8], [14, 14.4]], THIN),
  ])],
  ['duckling', customIcon('oyn-duckling', [
    oval(round(8.4, 8, 4.2)), solid('M4.8 7.6H1.4Q1.8 10.4 5.2 10.2Z'), blob(7.6, 7.2, 0.95),
    path('M10.6 11.6Q13 13.4 15.8 13 19 12.4 21.2 9.8 22 15.4 19 18.6 17.2 20.4 14 20.4H10.6Q4.2 20 4.6 14.4 4.8 12.6 6.2 11.6'), curve([[11.4, 15.6], [14, 17.6], [17, 15.2]], THIN),
  ])],
];

export const CUTE_ANIMALS: [string, LucideIcon][] = [...FACES.flatMap(([id, name, face]) => expressions(id, name, face)), ...SINGLES];
