// More vector ornaments for the template library: rules and bands, frames,
// background shapes and small pictures. The rules of ornaments.ts apply:
// solid black or white, and lines of at least 0.25 mm.

import { n, svg } from './ornaments';

// ---------- rules and bands ----------

/** Plain thin rule. */
export function rule(w: number, h: number, stroke = 0.35): string {
  return svg(w, h, `<line x1="0" y1="${n(h / 2)}" x2="${n(w)}" y2="${n(h / 2)}" stroke="#000" stroke-width="${stroke}"/>`);
}

/** A thick rule over a thin rule. */
export function doubleRule(w: number, h: number): string {
  const thick = Math.min(0.7, h * 0.35);
  return svg(
    w,
    h,
    `<line x1="0" y1="${n(h * 0.3)}" x2="${n(w)}" y2="${n(h * 0.3)}" stroke="#000" stroke-width="${n(thick)}"/>` +
      `<line x1="0" y1="${n(h * 0.8)}" x2="${n(w)}" y2="${n(h * 0.8)}" stroke="#000" stroke-width="0.25"/>`,
  );
}

/** Zigzag line. */
export function zigzag(w: number, h: number, stroke = 0.45): string {
  const count = Math.max(4, Math.round(w / Math.max(1.6, h * 1.2)));
  const step = w / count;
  const list = Array.from({ length: count + 1 }, (_, i) => `${n(i * step)},${n(i % 2 ? stroke : h - stroke)}`);
  return svg(w, h, `<polyline points="${list.join(' ')}" fill="none" stroke="#000" stroke-width="${stroke}" stroke-linejoin="miter"/>`);
}

/** Chequered band, like a racing flag. */
export function checks(w: number, h: number, rowsN = 2): string {
  const s = h / rowsN;
  const colsN = Math.ceil(w / s);
  const parts: string[] = [];
  for (let j = 0; j < rowsN; j++) for (let i = 0; i < colsN; i++) if ((i + j) % 2 === 0) parts.push(`<rect x="${n(i * s)}" y="${n(j * s)}" width="${n(s)}" height="${n(s)}"/>`);
  return svg(w, h, `<g fill="#000">${parts.join('')}</g>`);
}

/** String of triangular flags. Solid and outline flags alternate. */
export function bunting(w: number, h: number): string {
  const count = Math.max(3, Math.round(w / (h * 0.95)));
  const step = w / count;
  const top = Math.min(0.5, h * 0.12);
  const parts = [`<line x1="0" y1="${n(top)}" x2="${n(w)}" y2="${n(top)}" stroke="#000" stroke-width="0.3"/>`];
  for (let i = 0; i < count; i++) {
    const x = i * step + step * 0.1;
    const tw = step * 0.8;
    const p = `${n(x)},${n(top)} ${n(x + tw)},${n(top)} ${n(x + tw / 2)},${n(h - 0.2)}`;
    parts.push(i % 2 === 0 ? `<polygon points="${p}" fill="#000"/>` : `<polygon points="${p}" fill="#fff" stroke="#000" stroke-width="0.3"/>`);
  }
  return svg(w, h, parts.join(''));
}

function starPoints(cx: number, cy: number, R: number): string {
  const list: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? R : R * 0.45;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    list.push(`${n(cx + r * Math.cos(a))},${n(cy + r * Math.sin(a))}`);
  }
  return list.join(' ');
}

/** Row of solid stars. The middle star is the largest. */
export function starsRow(w: number, h: number, count = 5): string {
  const gap = Math.min(w / count, h * 1.5);
  const start = w / 2 - (gap * (count - 1)) / 2;
  const mid = (count - 1) / 2;
  const parts = Array.from({ length: count }, (_, i) => `<polygon points="${starPoints(start + i * gap, h / 2, (h / 2) * (1 - (Math.abs(i - mid) / (mid || 1)) * 0.35))}"/>`);
  return svg(w, h, `<g fill="#000">${parts.join('')}</g>`);
}

const heartPath = (x: number, y: number, s: number) =>
  `M${n(x + s / 2)} ${n(y + s * 0.95)}C${n(x - s * 0.25)} ${n(y + s * 0.45)} ${n(x + s * 0.15)} ${n(y - s * 0.15)} ${n(x + s / 2)} ${n(y + s * 0.28)}C${n(x + s * 0.85)} ${n(y - s * 0.15)} ${n(x + s * 1.25)} ${n(y + s * 0.45)} ${n(x + s / 2)} ${n(y + s * 0.95)}Z`;

/** Row of solid hearts. */
export function heartsRow(w: number, h: number, count = 3): string {
  const gap = Math.min(w / count, h * 1.6);
  const start = w / 2 - (gap * (count - 1)) / 2 - h / 2;
  const d = Array.from({ length: count }, (_, i) => heartPath(start + i * gap, 0, h)).join('');
  return svg(w, h, `<path d="${d}" fill="#000"/>`);
}

/** Row of chevrons that point right. */
export function chevrons(w: number, h: number, stroke = 0.5): string {
  const step = h * 0.9;
  const count = Math.max(3, Math.floor(w / step));
  const start = (w - count * step) / 2;
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = start + i * step;
    d += `M${n(x + stroke)} ${n(stroke)}L${n(x + step * 0.55)} ${n(h / 2)}L${n(x + stroke)} ${n(h - stroke)}`;
  }
  return svg(w, h, `<path d="${d}" fill="none" stroke="#000" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>`);
}

/** Row of solid half-circles, like the edge of an awning. */
export function scallops(w: number, h: number): string {
  const count = Math.max(3, Math.round(w / (h * 1.6)));
  const r = w / count / 2;
  let d = '';
  for (let i = 0; i < count; i++) d += `M${n(i * 2 * r)} 0A${n(r)} ${n(Math.min(h, r))} 0 0 0 ${n((i + 1) * 2 * r)} 0Z`;
  return svg(w, h, `<path d="${d}" fill="#000"/>`);
}

/** Band of honeycomb cells. */
export function comb(w: number, h: number): string {
  const R = h / 3.5;
  const hw = (Math.sqrt(3) / 2) * R;
  const cell = (cx: number, cy: number) => {
    const list = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      return `${n(cx + R * Math.cos(a))},${n(cy + R * Math.sin(a))}`;
    });
    return `<polygon points="${list.join(' ')}"/>`;
  };
  const parts: string[] = [];
  const count = Math.max(2, Math.floor(w / (2 * hw)));
  const start = (w - count * 2 * hw) / 2 + hw;
  for (let i = 0; i < count; i++) parts.push(cell(start + i * 2 * hw, R + 0.15));
  for (let i = 0; i < count - 1; i++) parts.push(cell(start + hw + i * 2 * hw, R * 2.5 + 0.15));
  return svg(w, h, `<g fill="none" stroke="#000" stroke-width="0.3">${parts.join('')}</g>`);
}

/** Film strip band: solid black with white sprocket holes. */
export function film(w: number, h: number): string {
  const hw = h * 0.45;
  const step = hw * 2;
  const count = Math.max(1, Math.floor(w / step));
  const start = (w - count * step) / 2 + hw / 2;
  const holes = Array.from({ length: count }, (_, i) => `<rect x="${n(start + i * step)}" y="${n(h * 0.25)}" width="${n(hw)}" height="${n(h * 0.5)}" rx="${n(h * 0.1)}"/>`);
  return svg(w, h, `<rect width="${n(w)}" height="${n(h)}" fill="#000"/><g fill="#fff">${holes.join('')}</g>`);
}

/** Rays that fan out from the middle of the bottom edge, like a rising sun. */
export function rays(w: number, h: number, count = 9): string {
  const cx = w / 2;
  const R = Math.hypot(w / 2, h) * 1.05;
  const parts: string[] = [];
  const total = count * 2 - 1;
  for (let i = 0; i < total; i += 2) {
    const a0 = Math.PI + (i / total) * Math.PI;
    const a1 = Math.PI + ((i + 1) / total) * Math.PI;
    parts.push(`<polygon points="${n(cx)},${n(h)} ${n(cx + R * Math.cos(a0))},${n(h + R * Math.sin(a0))} ${n(cx + R * Math.cos(a1))},${n(h + R * Math.sin(a1))}"/>`);
  }
  const s = Math.min(w * 0.16, h * 0.5);
  return svg(w, h, `<g fill="#000">${parts.join('')}</g><circle cx="${n(cx)}" cy="${n(h)}" r="${n(s * 1.25)}" fill="#fff"/><circle cx="${n(cx)}" cy="${n(h)}" r="${n(s)}" fill="#000"/>`);
}

// ---------- frames ----------

/** Perforated edge, like a postage stamp. */
export function stamp(w: number, h: number): string {
  const edge = 1.3;
  const r = 0.62;
  const nx = Math.max(4, Math.round(w / 2.1));
  const ny = Math.max(3, Math.round(h / 2.1));
  const holes: string[] = [];
  for (let i = 0; i < nx; i++) {
    const x = ((i + 0.5) * w) / nx;
    holes.push(`<circle cx="${n(x)}" cy="0" r="${r}"/><circle cx="${n(x)}" cy="${n(h)}" r="${r}"/>`);
  }
  for (let j = 0; j < ny; j++) {
    const y = ((j + 0.5) * h) / ny;
    holes.push(`<circle cx="0" cy="${n(y)}" r="${r}"/><circle cx="${n(w)}" cy="${n(y)}" r="${r}"/>`);
  }
  return svg(
    w,
    h,
    `<rect width="${n(w)}" height="${n(h)}" fill="#000"/><g fill="#fff">${holes.join('')}</g>` +
      `<rect x="${edge}" y="${edge}" width="${n(w - 2 * edge)}" height="${n(h - 2 * edge)}" fill="#fff"/>` +
      `<rect x="${n(edge + 0.7)}" y="${n(edge + 0.7)}" width="${n(w - 2 * edge - 1.4)}" height="${n(h - 2 * edge - 1.4)}" fill="none" stroke="#000" stroke-width="0.25"/>`,
  );
}

/** Two frames with solid squares in the corners. */
export function deco(w: number, h: number): string {
  const q = Math.min(2.2, Math.min(w, h) * 0.09);
  const sq = (x: number, y: number) => `<rect x="${n(x)}" y="${n(y)}" width="${n(q)}" height="${n(q)}" fill="#000"/>`;
  return svg(
    w,
    h,
    `<rect x="${n(q / 2)}" y="${n(q / 2)}" width="${n(w - q)}" height="${n(h - q)}" fill="none" stroke="#000" stroke-width="0.5"/>` +
      `<rect x="${n(q + 0.7)}" y="${n(q + 0.7)}" width="${n(w - 2 * q - 1.4)}" height="${n(h - 2 * q - 1.4)}" fill="none" stroke="#000" stroke-width="0.25"/>` +
      sq(0, 0) + sq(w - q, 0) + sq(0, h - q) + sq(w - q, h - q),
  );
}

/** Square brackets on the left and the right. */
export function brackets(w: number, h: number, stroke = 0.7): string {
  const l = Math.min(w * 0.08, 3);
  const s = stroke / 2;
  return svg(w, h, `<path d="M${n(l)} ${s}H${s}V${n(h - s)}H${n(l)}M${n(w - l)} ${s}H${n(w - s)}V${n(h - s)}H${n(w - l)}" fill="none" stroke="#000" stroke-width="${stroke}"/>`);
}

/** How far the cut corners of the tag shape go in from the left edge. */
export const tagCut = (w: number, h: number) => Math.min(h * 0.3, w * 0.15);

/** Luggage tag outline: two cut corners and a hole on the left. */
export function tagShape(w: number, h: number, stroke = 0.5): string {
  const c = tagCut(w, h);
  const s = stroke / 2;
  return svg(
    w,
    h,
    `<path d="M${n(c)} ${s}H${n(w - s)}V${n(h - s)}H${n(c)}L${s} ${n(h - c)}V${n(c)}Z" fill="none" stroke="#000" stroke-width="${stroke}" stroke-linejoin="round"/>` +
      `<circle cx="${n(c * 0.62 + 0.4)}" cy="${n(h / 2)}" r="${n(Math.max(0.5, Math.min(1.2, h * 0.07)))}" fill="none" stroke="#000" stroke-width="${n(stroke * 0.8)}"/>`,
  );
}

/** Dashed frame, like a coupon to cut out. */
export function dashFrame(w: number, h: number, stroke = 0.4): string {
  return svg(w, h, `<rect x="${n(stroke)}" y="${n(stroke)}" width="${n(w - 2 * stroke)}" height="${n(h - 2 * stroke)}" rx="1" fill="none" stroke="#000" stroke-width="${stroke}" stroke-dasharray="1.5 1"/>`);
}

// ---------- background shapes ----------

/** Oval outline with a thin second line inside it. */
export function oval(w: number, h: number, stroke = 0.5): string {
  const e = (inset: number, sw: number) => `<ellipse cx="${n(w / 2)}" cy="${n(h / 2)}" rx="${n(w / 2 - inset)}" ry="${n(h / 2 - inset)}" fill="none" stroke="#000" stroke-width="${sw}"/>`;
  return svg(w, h, e(stroke / 2 + 0.1, stroke) + e(stroke + 1, 0.25));
}

/** Solid circle. */
export function disc(d: number): string {
  return svg(d, d, `<circle cx="${n(d / 2)}" cy="${n(d / 2)}" r="${n(d * 0.47)}" fill="#000"/>`);
}

/** Circle outline with a thin second line inside it. */
export function ring(d: number, stroke = 0.6): string {
  const c = (r: number, sw: number) => `<circle cx="${n(d / 2)}" cy="${n(d / 2)}" r="${n(r)}" fill="none" stroke="#000" stroke-width="${sw}"/>`;
  return svg(d, d, c(d * 0.47, stroke) + c(d * 0.47 - stroke - 0.7, 0.25));
}

/** Hexagon with points on the left and the right. */
export function hexagon(w: number, h: number, fill = true): string {
  const s = fill ? 0 : 0.5;
  const list = [[s, h / 2], [w * 0.25, s], [w * 0.75, s], [w - s, h / 2], [w * 0.75, h - s], [w * 0.25, h - s]].map(([x, y]) => `${n(x)},${n(y)}`).join(' ');
  return svg(w, h, fill ? `<polygon points="${list}" fill="#000"/>` : `<polygon points="${list}" fill="none" stroke="#000" stroke-width="0.5" stroke-linejoin="round"/>`);
}

/** Shield, solid or outline. */
export function shield(w: number, h: number, fill = true): string {
  const d = `M${n(w * 0.5)} ${n(h * 0.03)}L${n(w * 0.94)} ${n(h * 0.15)}V${n(h * 0.5)}C${n(w * 0.94)} ${n(h * 0.78)} ${n(w * 0.72)} ${n(h * 0.91)} ${n(w * 0.5)} ${n(h * 0.97)}C${n(w * 0.28)} ${n(h * 0.91)} ${n(w * 0.06)} ${n(h * 0.78)} ${n(w * 0.06)} ${n(h * 0.5)}V${n(h * 0.15)}Z`;
  return svg(w, h, fill ? `<path d="${d}" fill="#000"/>` : `<path d="${d}" fill="none" stroke="#000" stroke-width="0.55" stroke-linejoin="round"/>`);
}

/** Open wreath of leaves, for text in the middle. */
export function laurel(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const rx = (w / 2) * 0.84;
  const ry = (h / 2) * 0.84;
  const size = Math.min(w, h);
  const leaves: string[] = [];
  const count = 12;
  const stems: string[] = [];
  for (const side of [1, -1]) {
    const at = (deg: number, k: number) => {
      const a = (deg * Math.PI) / 180;
      return [cx - side * rx * k * Math.cos(a), cy + ry * k * Math.sin(a)];
    };
    // Each branch starts at the bottom and goes up one side. Leaves alternate inside and outside the stem.
    for (let i = 0; i < count; i++) {
      const deg = 68 - (i * 136) / (count - 1);
      const outer = i % 2 === 0;
      const [px, py] = at(deg, outer ? 1.07 : 0.93);
      const tangent = side === 1 ? 270 - deg : deg - 90;
      const rot = tangent + (outer ? -1 : 1) * side * 38;
      leaves.push(`<ellipse cx="${n(px)}" cy="${n(py)}" rx="${n(size * 0.058)}" ry="${n(size * 0.024)}" transform="rotate(${n(rot)} ${n(px)} ${n(py)})"/>`);
    }
    const [x0, y0] = at(72, 1);
    const [x1, y1] = at(-70, 1);
    stems.push(`M${n(x0)} ${n(y0)}A${n(rx)} ${n(ry)} 0 0 ${side === 1 ? 1 : 0} ${n(x1)} ${n(y1)}`);
  }
  return svg(w, h, `<path d="${stems.join('')}" fill="none" stroke="#000" stroke-width="${n(Math.max(0.25, size * 0.008))}"/><g fill="#000">${leaves.join('')}</g>`);
}

// ---------- small pictures ----------

const pts = (w: number, h: number, list: number[][]) => list.map(([x, y]) => `${n(x * w)},${n(y * h)}`).join(' ');

/** Pine tree in three tiers, with a trunk. */
export function pine(w: number, h: number): string {
  const tiers = pts(w, h, [[0.5, 0.03], [0.76, 0.36], [0.63, 0.36], [0.86, 0.62], [0.7, 0.62], [0.95, 0.87], [0.05, 0.87], [0.3, 0.62], [0.14, 0.62], [0.37, 0.36], [0.24, 0.36]]);
  return svg(w, h, `<polygon points="${tiers}" fill="#000"/><rect x="${n(w * 0.43)}" y="${n(h * 0.87)}" width="${n(w * 0.14)}" height="${n(h * 0.11)}" fill="#000"/>`);
}

/** Snowflake with six arms. */
export function snowflake(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.46;
  const sw = Math.max(0.3, Math.min(w, h) * 0.07);
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    const p = (r: number, off = 0) => `${n(cx + r * Math.cos(a + off))} ${n(cy + r * Math.sin(a + off))}`;
    d += `M${n(cx)} ${n(cy)}L${p(R)}M${p(R * 0.92, 0.32)}L${p(R * 0.6)}L${p(R * 0.92, -0.32)}`;
  }
  return svg(w, h, `<path d="${d}" fill="none" stroke="#000" stroke-width="${n(sw)}" stroke-linecap="round" stroke-linejoin="round"/>`);
}

/** Pumpkin with ribs and a stem. */
export function pumpkin(w: number, h: number): string {
  const sw = Math.max(0.25, w * 0.035);
  return svg(
    w,
    h,
    `<rect x="${n(w * 0.45)}" y="${n(h * 0.08)}" width="${n(w * 0.1)}" height="${n(h * 0.2)}" rx="${n(w * 0.03)}" fill="#000"/>` +
      `<ellipse cx="${n(w / 2)}" cy="${n(h * 0.6)}" rx="${n(w * 0.47)}" ry="${n(h * 0.36)}" fill="#000"/>` +
      `<ellipse cx="${n(w / 2)}" cy="${n(h * 0.6)}" rx="${n(w * 0.24)}" ry="${n(h * 0.36)}" fill="none" stroke="#fff" stroke-width="${n(sw)}"/>` +
      `<line x1="${n(w / 2)}" y1="${n(h * 0.26)}" x2="${n(w / 2)}" y2="${n(h * 0.95)}" stroke="#fff" stroke-width="${n(sw)}"/>`,
  );
}

/** Ghost with two eyes. */
export function ghost(w: number, h: number): string {
  const d = `M${n(w * 0.14)} ${n(h * 0.96)}V${n(h * 0.44)}A${n(w * 0.36)} ${n(h * 0.4)} 0 0 1 ${n(w * 0.86)} ${n(h * 0.44)}V${n(h * 0.96)}L${n(w * 0.74)} ${n(h * 0.84)}L${n(w * 0.62)} ${n(h * 0.96)}L${n(w * 0.5)} ${n(h * 0.84)}L${n(w * 0.38)} ${n(h * 0.96)}L${n(w * 0.26)} ${n(h * 0.84)}Z`;
  const eye = (x: number) => `<ellipse cx="${n(w * x)}" cy="${n(h * 0.42)}" rx="${n(w * 0.07)}" ry="${n(h * 0.09)}" fill="#fff"/>`;
  return svg(w, h, `<path d="${d}" fill="#000"/>${eye(0.37)}${eye(0.63)}`);
}

/** Decorated egg. */
export function egg(w: number, h: number): string {
  const d = `M${n(w * 0.5)} ${n(h * 0.03)}C${n(w * 0.8)} ${n(h * 0.03)} ${n(w * 0.9)} ${n(h * 0.5)} ${n(w * 0.9)} ${n(h * 0.64)}A${n(w * 0.4)} ${n(h * 0.33)} 0 0 1 ${n(w * 0.1)} ${n(h * 0.64)}C${n(w * 0.1)} ${n(h * 0.5)} ${n(w * 0.2)} ${n(h * 0.03)} ${n(w * 0.5)} ${n(h * 0.03)}Z`;
  const zig = pts(w, h, [[0.1, 0.56], [0.23, 0.46], [0.37, 0.56], [0.5, 0.46], [0.63, 0.56], [0.77, 0.46], [0.9, 0.56]]);
  const sw = Math.max(0.25, w * 0.05);
  return svg(
    w,
    h,
    `<path d="${d}" fill="#000"/><polyline points="${zig}" fill="none" stroke="#fff" stroke-width="${n(sw)}"/>` +
      `<line x1="${n(w * 0.16)}" y1="${n(h * 0.74)}" x2="${n(w * 0.84)}" y2="${n(h * 0.74)}" stroke="#fff" stroke-width="${n(sw)}"/>` +
      `<circle cx="${n(w * 0.5)}" cy="${n(h * 0.26)}" r="${n(w * 0.06)}" fill="#fff"/>`,
  );
}

/** Balloon on a string. */
export function balloon(w: number, h: number): string {
  const sw = Math.max(0.25, w * 0.035);
  return svg(
    w,
    h,
    `<ellipse cx="${n(w / 2)}" cy="${n(h * 0.36)}" rx="${n(w * 0.34)}" ry="${n(h * 0.34)}" fill="#000"/>` +
      `<polygon points="${pts(w, h, [[0.5, 0.68], [0.43, 0.76], [0.57, 0.76]])}" fill="#000"/>` +
      `<path d="M${n(w * 0.5)} ${n(h * 0.76)}Q${n(w * 0.36)} ${n(h * 0.84)} ${n(w * 0.5)} ${n(h * 0.9)}T${n(w * 0.5)} ${n(h * 0.99)}" fill="none" stroke="#000" stroke-width="${n(sw)}" stroke-linecap="round"/>` +
      `<path d="M${n(w * 0.32)} ${n(h * 0.3)}A${n(w * 0.2)} ${n(h * 0.2)} 0 0 1 ${n(w * 0.44)} ${n(h * 0.14)}" fill="none" stroke="#fff" stroke-width="${n(sw)}" stroke-linecap="round"/>`,
  );
}

/** Crown with three points. */
export function crown(w: number, h: number): string {
  return svg(
    w,
    h,
    `<polygon points="${pts(w, h, [[0.06, 0.3], [0.29, 0.56], [0.5, 0.16], [0.71, 0.56], [0.94, 0.3], [0.86, 0.74], [0.14, 0.74]])}" fill="#000"/>` +
      `<rect x="${n(w * 0.14)}" y="${n(h * 0.79)}" width="${n(w * 0.72)}" height="${n(h * 0.09)}" fill="#000"/>`,
  );
}

/** Bow with two loops and two tails. */
export function bow(w: number, h: number): string {
  return svg(
    w,
    h,
    `<g fill="#000"><polygon points="${pts(w, h, [[0.5, 0.42], [0.04, 0.16], [0.04, 0.68]])}"/><polygon points="${pts(w, h, [[0.5, 0.42], [0.96, 0.16], [0.96, 0.68]])}"/>` +
      `<polygon points="${pts(w, h, [[0.46, 0.46], [0.24, 0.92], [0.4, 0.86]])}"/><polygon points="${pts(w, h, [[0.54, 0.46], [0.76, 0.92], [0.6, 0.86]])}"/>` +
      `<circle cx="${n(w / 2)}" cy="${n(h * 0.42)}" r="${n(Math.min(w, h) * 0.11)}" stroke="#fff" stroke-width="${n(Math.min(w, h) * 0.03)}"/></g>`,
  );
}

/** Flower with six petals. */
export function flower(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) / 2;
  const petals = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    return `<circle cx="${n(cx + R * 0.56 * Math.cos(a))}" cy="${n(cy + R * 0.56 * Math.sin(a))}" r="${n(R * 0.36)}"/>`;
  });
  return svg(w, h, `<g fill="#000">${petals.join('')}</g><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R * 0.3)}" fill="#fff"/><circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R * 0.17)}" fill="#000"/>`);
}

/** Paw print. */
export function paw(w: number, h: number): string {
  const toe = (x: number, y: number) => `<ellipse cx="${n(w * x)}" cy="${n(h * y)}" rx="${n(w * 0.105)}" ry="${n(h * 0.135)}"/>`;
  return svg(
    w,
    h,
    `<g fill="#000">${toe(0.17, 0.42)}${toe(0.37, 0.2)}${toe(0.63, 0.2)}${toe(0.83, 0.42)}` +
      `<path d="M${n(w * 0.5)} ${n(h * 0.46)}C${n(w * 0.72)} ${n(h * 0.46)} ${n(w * 0.84)} ${n(h * 0.7)} ${n(w * 0.78)} ${n(h * 0.82)}C${n(w * 0.7)} ${n(h * 0.96)} ${n(w * 0.58)} ${n(h * 0.84)} ${n(w * 0.5)} ${n(h * 0.84)}C${n(w * 0.42)} ${n(h * 0.84)} ${n(w * 0.3)} ${n(h * 0.96)} ${n(w * 0.22)} ${n(h * 0.82)}C${n(w * 0.16)} ${n(h * 0.7)} ${n(w * 0.28)} ${n(h * 0.46)} ${n(w * 0.5)} ${n(h * 0.46)}Z"/></g>`,
  );
}

/** Bone. */
export function bone(w: number, h: number): string {
  const r = Math.min(w * 0.13, h * 0.24);
  const knob = (x: number, y: number) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>`;
  const x0 = r * 1.1;
  const x1 = w - r * 1.1;
  return svg(w, h, `<g fill="#000">${knob(x0, h / 2 - r * 0.8)}${knob(x0, h / 2 + r * 0.8)}${knob(x1, h / 2 - r * 0.8)}${knob(x1, h / 2 + r * 0.8)}<rect x="${n(x0)}" y="${n(h / 2 - r * 0.75)}" width="${n(x1 - x0)}" height="${n(r * 1.5)}"/></g>`);
}

/** Sun with rays. */
export function sun(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) / 2;
  let d = '';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    d += `M${n(cx + R * 0.62 * Math.cos(a))} ${n(cy + R * 0.62 * Math.sin(a))}L${n(cx + R * 0.94 * Math.cos(a))} ${n(cy + R * 0.94 * Math.sin(a))}`;
  }
  return svg(w, h, `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R * 0.46)}" fill="#000"/><path d="${d}" stroke="#000" stroke-width="${n(Math.max(0.3, R * 0.13))}" stroke-linecap="round"/>`);
}

/** Crescent moon. */
export function crescent(w: number, h: number): string {
  const R = Math.min(w, h) * 0.46;
  const cx = w / 2;
  const cy = h / 2;
  return svg(w, h, `<path d="M${n(cx + R * 0.25)} ${n(cy - R)}A${n(R)} ${n(R)} 0 1 0 ${n(cx + R)} ${n(cy + R * 0.45)}A${n(R * 0.8)} ${n(R * 0.8)} 0 1 1 ${n(cx + R * 0.25)} ${n(cy - R)}Z" fill="#000"/>`);
}

/** Lightning bolt. */
export function bolt(w: number, h: number): string {
  return svg(w, h, `<polygon points="${pts(w, h, [[0.62, 0.02], [0.18, 0.56], [0.46, 0.56], [0.36, 0.98], [0.82, 0.42], [0.54, 0.42]])}" fill="#000"/>`);
}

/** Drop of liquid. */
export function drop(w: number, h: number): string {
  return svg(w, h, `<path d="M${n(w * 0.5)} ${n(h * 0.04)}C${n(w * 0.5)} ${n(h * 0.04)} ${n(w * 0.16)} ${n(h * 0.46)} ${n(w * 0.16)} ${n(h * 0.64)}A${n(w * 0.34)} ${n(h * 0.33)} 0 0 0 ${n(w * 0.84)} ${n(h * 0.64)}C${n(w * 0.84)} ${n(h * 0.46)} ${n(w * 0.5)} ${n(h * 0.04)} ${n(w * 0.5)} ${n(h * 0.04)}Z" fill="#000"/>`);
}

/** Two mountain peaks with snow. */
export function peaks(w: number, h: number): string {
  return svg(
    w,
    h,
    `<polygon points="${pts(w, h, [[0, 0.92], [0.36, 0.14], [0.56, 0.56], [0.7, 0.36], [1, 0.92]])}" fill="#000"/>` +
      `<polygon points="${pts(w, h, [[0.36, 0.14], [0.27, 0.34], [0.33, 0.4], [0.38, 0.33], [0.44, 0.4], [0.47, 0.37]])}" fill="#fff"/>`,
  );
}

/** Bell. */
export function bell(w: number, h: number): string {
  return svg(
    w,
    h,
    `<g fill="#000"><circle cx="${n(w * 0.5)}" cy="${n(h * 0.1)}" r="${n(Math.min(w, h) * 0.07)}"/>` +
      `<path d="M${n(w * 0.2)} ${n(h * 0.72)}Q${n(w * 0.2)} ${n(h * 0.16)} ${n(w * 0.5)} ${n(h * 0.16)}Q${n(w * 0.8)} ${n(h * 0.16)} ${n(w * 0.8)} ${n(h * 0.72)}L${n(w * 0.92)} ${n(h * 0.82)}H${n(w * 0.08)}Z"/>` +
      `<circle cx="${n(w * 0.5)}" cy="${n(h * 0.89)}" r="${n(Math.min(w, h) * 0.08)}"/></g>`,
  );
}

/** Wrapped gift box with a bow. */
export function present(w: number, h: number): string {
  const sw = Math.max(0.3, w * 0.07);
  return svg(
    w,
    h,
    `<g fill="#000"><rect x="${n(w * 0.1)}" y="${n(h * 0.46)}" width="${n(w * 0.8)}" height="${n(h * 0.5)}"/><rect x="${n(w * 0.04)}" y="${n(h * 0.28)}" width="${n(w * 0.92)}" height="${n(h * 0.16)}"/>` +
      `<ellipse cx="${n(w * 0.36)}" cy="${n(h * 0.17)}" rx="${n(w * 0.15)}" ry="${n(h * 0.1)}"/><ellipse cx="${n(w * 0.64)}" cy="${n(h * 0.17)}" rx="${n(w * 0.15)}" ry="${n(h * 0.1)}"/></g>` +
      `<line x1="${n(w / 2)}" y1="${n(h * 0.28)}" x2="${n(w / 2)}" y2="${n(h * 0.96)}" stroke="#fff" stroke-width="${n(sw)}"/>`,
  );
}

/** Cloud. */
export function cloud(w: number, h: number): string {
  return svg(
    w,
    h,
    `<g fill="#000"><circle cx="${n(w * 0.3)}" cy="${n(h * 0.58)}" r="${n(Math.min(w * 0.2, h * 0.3))}"/><circle cx="${n(w * 0.52)}" cy="${n(h * 0.42)}" r="${n(Math.min(w * 0.26, h * 0.36))}"/>` +
      `<circle cx="${n(w * 0.74)}" cy="${n(h * 0.6)}" r="${n(Math.min(w * 0.18, h * 0.27))}"/><rect x="${n(w * 0.3)}" y="${n(h * 0.58)}" width="${n(w * 0.44)}" height="${n(Math.min(w * 0.2, h * 0.3))}"/></g>`,
  );
}

/** Makes a black ornament white and a white detail black, for use on a solid shape. */
export function flip(markup: string): string {
  return markup.replace(/#000/g, '#TMP').replace(/#fff/g, '#000').replace(/#TMP/g, '#fff');
}
