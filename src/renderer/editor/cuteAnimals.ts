// The "Cute animals" symbol group. Each animal is drawn in the 24 × 24 grid of
// the icon set, with lines only, so that it prints cleanly on a 1-bit thermal
// head. Most animals come with four expressions: plain, happy, sleepy and with
// a heart. Several are Australian animals, because the app is made in Australia.

import { createLucideIcon, type IconNode, type LucideIcon } from 'lucide-react';

export type Shape = [tag: string, attrs: Record<string, string | number>];

/** Makes a symbol from shapes, in the same form as the symbols of the icon set. */
export const customIcon = (id: string, shapes: Shape[]): LucideIcon =>
  createLucideIcon(id, shapes.map(([tag, attrs], i) => [tag, { ...attrs, key: `${id}${i}` }]) as IconNode);

// ---------- drawing helpers ----------

type P = [number, number];
const r2 = (v: number) => Number(v.toFixed(2));
const flip = ([x, y]: P): P => [24 - x, y];
const THIN = 1.5;

const path = (d: string, strokeWidth?: number): Shape => ['path', strokeWidth ? { d, strokeWidth } : { d }];
const circle = (cx: number, cy: number, r: number, strokeWidth?: number): Shape => ['circle', strokeWidth ? { cx, cy, r, strokeWidth } : { cx, cy, r }];
const ellipse = (cx: number, cy: number, rx: number, ry: number, strokeWidth?: number): Shape => ['ellipse', strokeWidth ? { cx, cy, rx, ry, strokeWidth } : { cx, cy, rx, ry }];
const dot = (x: number, y: number, strokeWidth = 2.4): Shape => path(`M${r2(x)} ${r2(y)}h.01`, strokeWidth);

/** Straight lines through the points. */
const line = (pts: P[], strokeWidth?: number): Shape => path(pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`).join(''), strokeWidth);
/** Curves through the points: start, then pairs of control point and end point. */
function curve(pts: P[], strokeWidth?: number): Shape {
  let d = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
  for (let i = 1; i + 1 < pts.length; i += 2) d += `Q${r2(pts[i][0])} ${r2(pts[i][1])} ${r2(pts[i + 1][0])} ${r2(pts[i + 1][1])}`;
  return path(d, strokeWidth);
}
/** The shape and its mirror image on the other side of the face. */
const pair = (make: (pts: P[], strokeWidth?: number) => Shape, pts: P[], strokeWidth?: number): Shape[] => [make(pts, strokeWidth), make(pts.map(flip), strokeWidth)];

/**
 * The part of a round ear that is outside a round head, so that the two
 * outlines do not cross. Ear and head are circles.
 */
function bump(cx: number, cy: number, r: number, hx: number, hy: number, hr: number): Shape {
  const d = Math.hypot(cx - hx, cy - hy);
  const a = (d * d + r * r - hr * hr) / (2 * d);
  const h = Math.sqrt(Math.max(0, r * r - a * a));
  const ux = (hx - cx) / d;
  const uy = (hy - cy) / d;
  const mx = cx + a * ux;
  const my = cy + a * uy;
  return path(`M${r2(mx - h * uy)} ${r2(my + h * ux)}A${r} ${r} 0 ${a > 0 ? 1 : 0} 1 ${r2(mx + h * uy)} ${r2(my - h * ux)}`);
}
const bumps = (cx: number, cy: number, r: number, hx: number, hy: number, hr: number): Shape[] => [bump(cx, cy, r, hx, hy, hr), bump(24 - cx, cy, r, hx, hy, hr)];

/** A ring of round bumps, for a mane. */
function scallop(cx: number, cy: number, R: number, count: number): Shape {
  const at = (i: number): P => [cx + R * Math.cos((i / count) * Math.PI * 2), cy + R * Math.sin((i / count) * Math.PI * 2)];
  const rr = r2(R * Math.sin(Math.PI / count) * 1.08);
  let d = `M${r2(at(0)[0])} ${r2(at(0)[1])}`;
  for (let i = 1; i <= count; i++) d += `A${rr} ${rr} 0 0 1 ${r2(at(i)[0])} ${r2(at(i)[1])}`;
  return path(d);
}

/** A mouth like a soft letter W. */
const wMouth = (y: number, w = 1.5): Shape => path(`M${r2(12 - w)} ${y}q${r2(w / 2)} 1 ${w} 0q${r2(w / 2)} 1 ${w} 0`, THIN);
const whiskers = (y: number, x: number): Shape[] => [
  ...pair(line, [[x - 2.6, y - 0.4], [x, y]], THIN),
  ...pair(line, [[x - 2.4, y + 2.2], [x + 0.2, y + 1.6]], THIN),
];

// ---------- expressions ----------

interface Face {
  /** Head, ears and nose. */
  base: Shape[];
  /** Height of the eyes and their distance from the middle. */
  ey: number;
  ex: number;
  mouth?: Shape[];
  /** Mouth for the happy face. The default is the plain mouth. */
  happy?: Shape[];
}

const openEyes = (f: Face): Shape[] => [dot(12 - f.ex, f.ey), dot(12 + f.ex, f.ey)];
/** Eyes like two small arches, for a smile. */
const gladEyes = (f: Face): Shape[] => [12 - f.ex, 12 + f.ex].map((x) => path(`M${r2(x - 1.15)} ${r2(f.ey + 0.6)}q1.15 -1.9 2.3 0`, 1.6));
/** Closed eyes: two short lines. */
const shutEyes = (f: Face): Shape[] => [12 - f.ex, 12 + f.ex].map((x) => path(`M${r2(x - 1.1)} ${r2(f.ey + 0.2)}h2.2`, 1.6));
const HEART = path('M20.4 5.6c-1.7-1.2-2.4-2.1-2.4-3a1.2 1.2 0 0 1 2.4-.3 1.2 1.2 0 0 1 2.4.3c0 .9-.7 1.8-2.4 3z', THIN);
const ZED = path('M18.6 1.7h3.2l-3.2 3.6h3.2', THIN);

/** Makes the animal a little smaller and moves it down and left, so that the top right corner is free for the heart or the letter Z. */
const small = (shapes: Shape[]): Shape[] => shapes.map(([tag, attrs]) => [tag, { ...attrs, transform: 'translate(0 3.4) scale(0.86)' }]);

function expressions(id: string, name: string, f: Face): [string, LucideIcon][] {
  const mouth = f.mouth ?? [];
  const glad = f.happy ?? mouth;
  return [
    [`cute ${name}`, customIcon(`oyn-${id}`, [...f.base, ...openEyes(f), ...mouth])],
    [`happy ${name}`, customIcon(`oyn-${id}-happy`, [...f.base, ...gladEyes(f), ...glad])],
    [`sleepy ${name}`, customIcon(`oyn-${id}-sleepy`, [...small([...f.base, ...shutEyes(f), ...mouth]), ZED])],
    [`${name} with heart`, customIcon(`oyn-${id}-heart`, [...small([...f.base, ...openEyes(f), ...glad]), HEART])],
  ];
}

// ---------- faces ----------

const FACES: [id: string, name: string, face: Face][] = [
  ['cat', 'cat', {
    base: [circle(12, 13.5, 6.5), ...pair(line, [[6.2, 10], [5.6, 4.4], [10, 7.1]]), ...whiskers(13.4, 4.4), dot(12, 14.6, 1.8)],
    ey: 12.5, ex: 2.7, mouth: [wMouth(15.4)],
  }],
  ['dog', 'dog', {
    base: [circle(12, 13, 6.3), ...pair(curve, [[7.6, 8.2], [3.2, 6.6], [3.4, 11.6], [3.5, 14.6], [5.9, 14.4]]), dot(12, 14, 2.8)],
    ey: 11.6, ex: 2.8, mouth: [wMouth(15.6, 1.5)], happy: [wMouth(15.6, 1.5), path('M11.1 16.6v1a.9.9 0 0 0 1.8 0v-1', THIN)],
  }],
  ['bunny', 'bunny', {
    base: [circle(12, 15, 6), path('M7.2 11.2V4.6a1.7 1.7 0 0 1 3.4 0v4.5'), path('M13.4 9.1V4.6a1.7 1.7 0 0 1 3.4 0v6.6'), dot(12, 16.1, 1.8)],
    ey: 14.2, ex: 2.5, mouth: [wMouth(16.9)],
  }],
  ['bear', 'bear', {
    base: [circle(12, 13.5, 6.5), ...bumps(6.6, 7.6, 2.4, 12, 13.5, 6.5), dot(12, 14.4, 2.8)],
    ey: 12.2, ex: 2.9, mouth: [wMouth(16, 1.5)],
  }],
  ['panda', 'panda', {
    base: [circle(12, 13.5, 6.5), ...bumps(6.6, 7.6, 2.4, 12, 13.5, 6.5), ellipse(9, 12.3, 1.8, 2.2, THIN), ellipse(15, 12.3, 1.8, 2.2, THIN), dot(12, 15.3, 1.8)],
    ey: 12.3, ex: 3, mouth: [wMouth(16.1, 1.3)],
  }],
  ['fox', 'fox', {
    base: [path('M4.6 4.2 9.2 7.2h5.6l4.6-3 .4 6.6c0 3.8-3.6 7-7.8 9.6-4.2-2.6-7.8-5.8-7.8-9.6z'), dot(12, 17.8, 2.2), ...pair(line, [[4.6, 12.6], [8.6, 14.8]], THIN)],
    ey: 11.4, ex: 3.1,
  }],
  ['mouse', 'mouse', {
    base: [circle(12, 14.5, 5.8), ...bumps(6.2, 8.2, 3.3, 12, 14.5, 5.8), dot(12, 16.3, 1.8), ...whiskers(15.6, 5.2)],
    ey: 13.8, ex: 2.4, mouth: [wMouth(17, 1.3)],
  }],
  ['pig', 'pig', {
    base: [circle(12, 13.5, 6.5), ...pair(line, [[6.4, 10.2], [5.4, 5.4], [9.6, 7.4]]), ellipse(12, 15.1, 2.7, 1.9, THIN), dot(11, 15.1, 1.5), dot(13, 15.1, 1.5)],
    ey: 11.7, ex: 3, happy: [curve([[10.6, 18], [12, 19], [13.4, 18]], THIN)],
  }],
  ['frog', 'frog', {
    base: [circle(12, 14.6, 6.6), ...bumps(8, 8.6, 2.7, 12, 14.6, 6.6), dot(11.2, 13.4, 1.4), dot(12.8, 13.4, 1.4)],
    ey: 8.5, ex: 4, mouth: [curve([[7.8, 15.8], [12, 19], [16.2, 15.8]], THIN)],
  }],
  ['monkey', 'monkey', {
    base: [circle(12, 12.6, 6.3), ...bumps(4.9, 12.6, 2.2, 12, 12.6, 6.3), ellipse(12, 15.4, 3.7, 2.7, THIN), dot(11.3, 14.4, 1.2), dot(12.7, 14.4, 1.2)],
    ey: 10.6, ex: 2.5, mouth: [curve([[10.2, 15.8], [12, 17.2], [13.8, 15.8]], THIN)],
  }],
  ['lion', 'lion', {
    base: [scallop(12, 12.4, 8.6, 9), circle(12, 12.4, 5.7), dot(12, 13.2, 2)],
    ey: 11.2, ex: 2.3, mouth: [wMouth(14.4, 1.3)],
  }],
  ['tiger', 'tiger', {
    base: [
      circle(12, 13.5, 6.5), ...bumps(6.8, 7.6, 2.2, 12, 13.5, 6.5), line([[12, 7.3], [12, 9.4]], THIN), ...pair(line, [[9.8, 7.7], [10.3, 9.4]], THIN),
      ...pair(line, [[5.9, 15.4], [7.7, 15]], THIN), dot(12, 14.6, 1.8),
    ],
    ey: 12.5, ex: 2.7, mouth: [wMouth(15.4)],
  }],
  ['cow', 'cow', {
    base: [
      circle(12, 12.6, 6), ...pair(curve, [[8.2, 7.9], [5.6, 7], [5.6, 3.8]]), ...pair(curve, [[6.3, 10.4], [3.8, 8.4], [2.6, 10.4], [3.6, 13], [6.1, 13]]),
      ellipse(12, 15.3, 3.1, 2.1, THIN), dot(10.9, 15.3, 1.5), dot(13.1, 15.3, 1.5),
    ],
    ey: 11.1, ex: 2.6,
  }],
  ['sheep', 'sheep', {
    base: [
      path('M6.2 11.2a2.5 2.5 0 0 1 .9-4.6 3.1 3.1 0 0 1 4.9-1.7 3.1 3.1 0 0 1 4.9 1.7 2.5 2.5 0 0 1 .9 4.6'), path('M7.6 11v3.2a4.4 4.4 0 0 0 8.8 0V11'),
      ...pair(curve, [[7.4, 11.5], [5, 10.9], [4, 12.7], [6, 13.7], [7.5, 13.1]]), line([[11.3, 15.4], [12, 16.1], [12.7, 15.4]], THIN), line([[12, 16.1], [12, 16.9]], THIN),
    ],
    ey: 13.1, ex: 2,
  }],
  ['chick', 'chick', {
    base: [circle(12, 13.6, 6.6), line([[12, 7], [12, 4.8]], THIN), line([[10.5, 7.2], [9.6, 5.4]], THIN), line([[13.5, 7.2], [14.4, 5.4]], THIN), path('M10.9 13.6h2.2L12 15.2z', THIN)],
    ey: 12, ex: 2.7,
  }],
  ['penguin', 'penguin', {
    base: [
      path('M12 3.5c-4 0-6 3.6-6 8.5v4.5a4.5 4.5 0 0 0 4.5 4.5h3a4.5 4.5 0 0 0 4.5-4.5V12c0-4.9-2-8.5-6-8.5z'),
      path('M8.2 12.4a2.6 2.6 0 0 1 3.8-2.3 2.6 2.6 0 0 1 3.8 2.3v3.7a2.6 2.6 0 0 1-2.6 2.6h-2.4a2.6 2.6 0 0 1-2.6-2.6z', THIN),
      path('M11.1 14h1.8l-.9 1.2z', THIN), ...pair(line, [[6, 12.6], [3.8, 15.6]]),
    ],
    ey: 12.3, ex: 1.9,
  }],
  ['owl', 'owl', {
    base: [
      path('M6 5l2.5 1.6a6.6 6.6 0 0 1 7 0L18 5v9.5a6 6 0 0 1-12 0z'), circle(9.2, 11.2, 2.4, THIN), circle(14.8, 11.2, 2.4, THIN),
      path('M11.2 13.6h1.6l-.8 1.3z', THIN), path('M10 17.2q1 .9 2 0q1 .9 2 0', THIN),
    ],
    ey: 11.2, ex: 2.8,
  }],
  ['elephant', 'elephant', {
    base: [path('M10.5 17.3A5.5 5.5 0 1 1 13.5 17.3'), path('M10.5 14v5.2a1.5 1.5 0 0 0 3 0V14'), ...pair(curve, [[7.2, 8.4], [3, 5.6], [2.2, 10.6], [2.4, 15], [6.9, 14.6]])],
    ey: 11.3, ex: 2.6,
  }],
  ['deer', 'deer', {
    base: [
      circle(12, 14, 5.6), ...pair(line, [[9.2, 9], [7.6, 5.2]], THIN), ...pair(line, [[8.4, 7.1], [5.8, 6.4]], THIN),
      ...pair(curve, [[6.9, 11.5], [4.6, 9], [3.2, 10.2], [3.8, 13.2], [6.5, 13.7]]), ellipse(12, 16.7, 1.1, 0.8),
    ],
    ey: 13.3, ex: 2.5,
  }],
  ['octopus', 'octopus', {
    base: [
      path('M5.5 13V10a6.5 6.5 0 0 1 13 0v3'), path('M5.5 13c0 3-2.5 3-2.5 5.5'), path('M9.5 14c0 3-1.5 3.5-1.5 6'), path('M14.5 14c0 3 1.5 3.5 1.5 6'), path('M18.5 13c0 3 2.5 3 2.5 5.5'),
      path('M5.5 13c1.4 1 2.8 1.2 4 1h5c1.2.2 2.6 0 4-1'),
    ],
    ey: 9.6, ex: 2.4, mouth: [curve([[10.8, 11.5], [12, 12.4], [13.2, 11.5]], THIN)],
  }],
  // ---------- Australian animals ----------
  ['koala', 'koala', {
    base: [circle(12, 13.2, 6.2), ...bumps(5.4, 8.4, 3.2, 12, 13.2, 6.2), ellipse(12, 13.9, 1.25, 1.9)],
    ey: 12, ex: 3.2, mouth: [curve([[11, 17.1], [12, 17.9], [13, 17.1]], THIN)],
  }],
  ['wombat', 'wombat', {
    base: [circle(12, 13.6, 6.8), ...bumps(7, 7.6, 1.7, 12, 13.6, 6.8), ['rect', { x: 10.2, y: 13.6, width: 3.6, height: 2.2, rx: 1.1 }]],
    ey: 12, ex: 3.1, mouth: [curve([[10.6, 17.3], [12, 18.3], [13.4, 17.3]], THIN)],
  }],
  ['quokka', 'quokka', {
    base: [circle(12, 13.2, 6.3), ...bumps(6.9, 7.2, 2.1, 12, 13.2, 6.3), ellipse(12, 13.5, 1.1, 0.75)],
    ey: 11.5, ex: 2.9, mouth: [curve([[8.6, 14.8], [12, 19.4], [15.4, 14.8]], THIN)],
  }],
  ['possum', 'possum', {
    base: [circle(12, 13.6, 6.2), ...pair(curve, [[6.6, 10.4], [4.4, 6.4], [6.2, 3.8], [9.4, 5], [10.2, 7.7]]), dot(12, 15.5, 1.8), ...whiskers(14.4, 4.8)],
    ey: 12.5, ex: 2.9, mouth: [wMouth(16.3, 1.3)],
  }],
  ['devil', 'tasmanian devil', {
    base: [circle(12, 13.2, 6.4), ...bumps(6.6, 7.4, 2.3, 12, 13.2, 6.4), dot(12, 13.2, 1.8)],
    ey: 11.2, ex: 2.9, mouth: [path('M8.8 14.8h6.4c0 2.5-1.3 3.8-3.2 3.8s-3.2-1.3-3.2-3.8z', THIN), ...pair(line, [[10.3, 14.8], [10.3, 15.9]], THIN)],
  }],
  ['dingo', 'dingo', {
    base: [circle(12, 13.4, 6.2), ...pair(line, [[6.4, 10.4], [5.4, 3.6], [10.4, 7.4]]), dot(12, 14.6, 2.8)],
    ey: 12.1, ex: 2.7, mouth: [wMouth(16.2, 1.5)],
  }],
  ['kangaroo', 'kangaroo', {
    base: [ellipse(12, 14.2, 4.8, 6.2), ...pair(curve, [[8.6, 9.8], [6, 6.6], [7.2, 2.4], [10.6, 4.4], [10.6, 8.2]]), ellipse(12, 17.5, 1.1, 0.7), line([[12, 18.2], [12, 19]], THIN)],
    ey: 13, ex: 2.2,
  }],
  ['platypus', 'platypus', {
    base: [circle(12, 10.6, 5.4), path('M7.4 14.2c-1.6.6-2.6 1.8-2.6 3.2 0 2 3.2 3.4 7.2 3.4s7.2-1.4 7.2-3.4c0-1.4-1-2.6-2.6-3.2'), dot(10.8, 18.2, 1.5), dot(13.2, 18.2, 1.5)],
    ey: 9.8, ex: 2.3,
  }],
  ['cockatoo', 'cockatoo', {
    base: [
      circle(12, 14, 6), curve([[10.6, 8.2], [10.2, 5], [12.6, 2.2]]), curve([[12.6, 8], [13, 5.6], [16, 3.6]]), curve([[14.6, 8.6], [15.6, 6.8], [18.4, 6.4]]),
      path('M10.8 14.2q1.2-1 2.4 0 0 2.2-1.2 3-1.2-.8-1.2-3z', THIN),
    ],
    ey: 12.6, ex: 2.9,
  }],
];

// ---------- animals with one drawing ----------

const SINGLES: [string, LucideIcon][] = [
  ['joey in pouch', customIcon('oyn-joey', [
    circle(12, 8.6, 3.6), ...pair(curve, [[9.6, 5.8], [8, 3.6], [9, 1.6], [11.2, 2.8], [11.2, 5.1]]), dot(10.6, 8.2, 2), dot(13.4, 8.2, 2), dot(12, 10, 1.6),
    path('M4.5 12.4h15'), path('M4.5 12.4c.6 5.2 3.4 8.6 7.5 8.6s6.9-3.4 7.5-8.6'), ...pair(curve, [[8.2, 12.4], [8, 14], [9.4, 14.2]], THIN),
  ])],
  ['emu', customIcon('oyn-emu', [
    ellipse(9.5, 13.5, 5.5, 3.8), path('M14.2 11.6c1.6-1.6 2.2-3.6 2.2-5.4'), circle(16.6, 4, 2.2), line([[18.7, 4.4], [21.4, 5.2]]),
    line([[8, 17.2], [8, 21.2], [6.4, 21.2]]), line([[11.2, 17.2], [11.2, 21.2], [12.8, 21.2]]), line([[4, 13.5], [2.4, 15.2]], THIN),
  ])],
  ['echidna', customIcon('oyn-echidna', [
    path('M3.5 18c0-5 3.4-8.5 8-8.5 3.6 0 6.2 2 7.4 5l3.3 2.4-3.2 1.1z'), line([[5.6, 11], [4.4, 8.6]], THIN), line([[8.2, 9.6], [7.6, 6.8]], THIN), line([[11.2, 9], [11.2, 6.2]], THIN),
    line([[14.2, 9.6], [15, 7]], THIN), line([[16.8, 11.2], [18.2, 9]], THIN), line([[7.4, 13.6], [6.6, 12]], THIN), line([[10.6, 12.8], [10.4, 11.2]], THIN), line([[13.6, 13.4], [14.2, 11.8]], THIN),
    dot(17.2, 15.2, 1.8), line([[7.5, 18], [7.5, 19.8]]), line([[14, 18], [14, 19.8]]),
  ])],
  ['kookaburra', customIcon('oyn-kookaburra', [
    circle(9, 8.2, 4.2), path('M12.9 6.6h8.6l-8.2 3.6'), dot(9.4, 7.6, 2.2),
    path('M5.8 11c-1.6 3.2-.4 6.8 3.6 7h3c2.6 0 4.2-2.4 3.4-5.4l-2.6-2.4'), line([[15, 16.6], [20.4, 19]]), line([[2.5, 20.6], [14.5, 20.6]]), line([[8.4, 18], [8.4, 20.6]], THIN), line([[11.4, 18], [11.4, 20.6]], THIN),
  ])],
  ['bee', customIcon('oyn-bee', [
    ellipse(12, 14.6, 5, 5.6), ...pair(curve, [[9.2, 9.8], [6.4, 2.6], [3, 5.6], [1.6, 9.4], [7.2, 11.8]]), line([[7.2, 14.6], [16.8, 14.6]], 1.6), line([[7.8, 17.4], [16.2, 17.4]], 1.6),
    dot(10.2, 12, 2), dot(13.8, 12, 2), line([[12, 20.2], [12, 21.8]], THIN),
  ])],
  ['ladybird', customIcon('oyn-ladybird', [
    circle(12, 13.5, 6.6), path('M8.4 8a4 4 0 0 1 7.2 0'), line([[12, 6.9], [12, 20.1]]), dot(9, 11.6, 2.6), dot(15, 11.6, 2.6), dot(8.6, 15.6, 2.6), dot(15.4, 15.6, 2.6),
    ...pair(line, [[10.6, 5], [9.6, 3]], THIN),
  ])],
  ['butterfly', customIcon('oyn-butterfly', [
    line([[12, 7.4], [12, 18.4]]), ...pair(curve, [[12, 9.4], [9.4, 3.6], [4.4, 5.4], [2.6, 11.6], [8, 12.8], [10.4, 13], [12, 11.6]]),
    ...pair(curve, [[12, 12.6], [8, 13.4], [7.2, 16.4], [7.4, 19.4], [10, 19.2], [11.6, 18.6], [12, 16]]), ...pair(line, [[12, 7.4], [10.4, 4.6]], THIN),
  ])],
  ['whale', customIcon('oyn-whale', [
    path('M2.5 12.8c.6-3.2 4-5.4 8.4-5.4 4.6 0 8 2.6 8.8 6.2'), path('M2.5 12.8c0 4 3.6 6.8 8.5 6.8h2.6c3.8 0 6.2-2.2 6.1-6'),
    path('M19.7 13.6c0-1.6.6-2.8 1.8-3.6'), curve([[21.5, 10], [19.4, 9.6], [18.8, 7.6]]), curve([[21.5, 10], [22.2, 8.2], [23.4, 7.8]]),
    dot(7.2, 12.8, 2), curve([[4.2, 15.6], [6, 16.8], [8, 16]], THIN), line([[10.6, 5.4], [10.6, 4]], THIN), curve([[10.6, 4], [10.4, 2.6], [8.8, 2.6]], THIN), curve([[10.6, 4], [10.8, 2.6], [12.4, 2.6]], THIN),
  ])],
  ['hedgehog', customIcon('oyn-hedgehog', [
    path('M4 18 3.2 15.4l2.2.4-.8-2.8 2.4 1L6.8 11l2.5 1.6.5-3.1 2.1 2.3 1.3-2.7 1.3 2.9c2 .5 3.6 1.8 4.6 3.6l2.6 1.6-2.1.9z'), dot(16.6, 14.6, 1.8), dot(21.4, 17, 1.6),
    line([[7.5, 18], [7.5, 19.8]]), line([[14, 18], [14, 19.8]]),
  ])],
  ['duckling', customIcon('oyn-duckling', [
    circle(8.6, 8.4, 3.7), path('M5.2 9.2H2.4l3 1.9'), dot(8, 7.8, 2), path('M10.4 11.7c1.4.9 3 1.3 4.6 1.3 2.4 0 4.4-1 5.8-2.8.6 5.2-2 9.4-7 9.4h-3c-4 0-6.4-2.6-5.8-6.4.2-1 .6-1.4 1.2-1.8'),
    curve([[11.6, 15.6], [14, 17.2], [16.4, 15.2]], THIN),
  ])],
];

export const CUTE_ANIMALS: [string, LucideIcon][] = [...FACES.flatMap(([id, name, face]) => expressions(id, name, face)), ...SINGLES];
