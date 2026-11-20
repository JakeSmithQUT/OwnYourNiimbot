// Vector ornaments for the template library. Each function returns an SVG
// drawn for an exact size in millimetres, so frames and bands fit any label.
// Shapes are solid black or white with lines of at least 0.3 mm, which a
// 1-bit thermal print head reproduces cleanly.

/** Pixels per millimetre for the SVG canvas. Higher than any print head. */
const PX = 24;

export function svg(w: number, h: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w * PX)}" height="${Math.round(h * PX)}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

export const n = (v: number) => Number(v.toFixed(3));

/** Rounded frame, optionally with a second thin frame inside it. */
export function frame(w: number, h: number, o: { stroke?: number; radius?: number; inner?: number; innerStroke?: number } = {}): string {
  const s = o.stroke ?? 0.6;
  const r = o.radius ?? 1.5;
  let body = `<rect x="${n(s / 2)}" y="${n(s / 2)}" width="${n(w - s)}" height="${n(h - s)}" rx="${r}" fill="none" stroke="#000" stroke-width="${s}"/>`;
  if (o.inner) {
    const is = o.innerStroke ?? 0.3;
    const g = o.inner;
    body += `<rect x="${n(g)}" y="${n(g)}" width="${n(w - 2 * g)}" height="${n(h - 2 * g)}" rx="${Math.max(0, r - g / 2)}" fill="none" stroke="#000" stroke-width="${is}"/>`;
  }
  return svg(w, h, body);
}

/** Frame of round dots. */
export function dotFrame(w: number, h: number, dot = 0.6, gap = 1.6): string {
  const parts: string[] = [];
  const m = dot;
  const nx = Math.max(2, Math.floor((w - 2 * m) / gap));
  const ny = Math.max(2, Math.floor((h - 2 * m) / gap));
  for (let i = 0; i <= nx; i++) {
    const x = m + ((w - 2 * m) * i) / nx;
    parts.push(`<circle cx="${n(x)}" cy="${m}" r="${dot / 2}"/><circle cx="${n(x)}" cy="${n(h - m)}" r="${dot / 2}"/>`);
  }
  for (let j = 1; j < ny; j++) {
    const y = m + ((h - 2 * m) * j) / ny;
    parts.push(`<circle cx="${m}" cy="${n(y)}" r="${dot / 2}"/><circle cx="${n(w - m)}" cy="${n(y)}" r="${dot / 2}"/>`);
  }
  return svg(w, h, `<g fill="#000">${parts.join('')}</g>`);
}

/** Four L-shaped corner marks. */
export function corners(w: number, h: number, len?: number, stroke = 0.6): string {
  const l = len ?? Math.min(w, h) * 0.22;
  const s = stroke / 2;
  const d = [
    `M${s} ${n(l)}V${s}H${n(l)}`,
    `M${n(w - l)} ${s}H${n(w - s)}V${n(l)}`,
    `M${n(w - s)} ${n(h - l)}V${n(h - s)}H${n(w - l)}`,
    `M${n(l)} ${n(h - s)}H${s}V${n(h - l)}`,
  ].join('');
  return svg(w, h, `<path d="${d}" fill="none" stroke="#000" stroke-width="${stroke}" stroke-linecap="square"/>`);
}

/** Circle with a scalloped edge, like a wax seal or a badge. */
export function seal(d: number, bumps = 22, fill = true): string {
  const r = d / 2;
  const cx = r;
  const rb = r * 0.86;
  const bump = (Math.PI * 2 * rb) / bumps / 2;
  const pts: string[] = [];
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2;
    pts.push(`<circle cx="${n(cx + rb * Math.cos(a))}" cy="${n(cx + rb * Math.sin(a))}" r="${n(bump * 1.15)}"/>`);
  }
  const inner = fill ? '' : `<circle cx="${cx}" cy="${cx}" r="${n(rb - bump * 0.4)}" fill="#fff"/>`;
  return svg(d, d, `<g fill="#000"><circle cx="${cx}" cy="${cx}" r="${n(rb)}"/>${pts.join('')}</g>${inner}`);
}

/** Star burst for "new" and "sale" stickers. */
export function burst(w: number, h: number, points = 18, depth = 0.16): string {
  const cx = w / 2;
  const cy = h / 2;
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const k = i % 2 === 0 ? 1 : 1 - depth;
    pts.push(`${n(cx + cx * k * Math.cos(a))},${n(cy + cy * k * Math.sin(a))}`);
  }
  return svg(w, h, `<polygon points="${pts.join(' ')}" fill="#000"/>`);
}

/** Ribbon banner with folded, notched ends. */
export function ribbon(w: number, h: number): string {
  const t = Math.min(w * 0.12, h * 0.9);
  const notch = t * 0.45;
  const band = `M${n(t * 0.6)} 0H${n(w - t * 0.6)}V${n(h * 0.8)}H${n(t * 0.6)}Z`;
  const left = `M0 ${n(h * 0.2)}H${n(t)}V${n(h)}H0L${n(notch)} ${n(h * 0.6)}Z`;
  const right = `M${n(w)} ${n(h * 0.2)}H${n(w - t)}V${n(h)}H${n(w)}L${n(w - notch)} ${n(h * 0.6)}Z`;
  return svg(w, h, `<path d="${left}${right}" fill="#000"/><path d="${band}" fill="#000" stroke="#fff" stroke-width="${n(Math.min(0.4, h * 0.05))}"/>`);
}

/** Ticket outline with half-circle notches on both sides. */
export function ticket(w: number, h: number, stroke = 0.6, dashed = true): string {
  const r = Math.min(h * 0.14, 3);
  const s = stroke / 2;
  const my = h / 2;
  const d = `M${s} ${s}H${n(w - s)}V${n(my - r)}A${r} ${r} 0 0 0 ${n(w - s)} ${n(my + r)}V${n(h - s)}H${s}V${n(my + r)}A${r} ${r} 0 0 0 ${s} ${n(my - r)}Z`;
  const stub = dashed ? `<line x1="${n(w * 0.72)}" y1="${n(stroke * 2)}" x2="${n(w * 0.72)}" y2="${n(h - stroke * 2)}" stroke="#000" stroke-width="${n(stroke * 0.6)}" stroke-dasharray="1 0.8"/>` : '';
  return svg(w, h, `<path d="${d}" fill="none" stroke="#000" stroke-width="${stroke}"/>${stub}`);
}

/** Wavy line. */
export function wave(w: number, h: number, waves?: number, stroke = 0.45): string {
  const count = waves ?? Math.max(3, Math.round(w / 6));
  const step = w / count;
  const mid = h / 2;
  const amp = h / 2 - stroke;
  let d = `M0 ${n(mid)}`;
  for (let i = 0; i < count; i++) {
    const x = i * step;
    d += `Q${n(x + step / 4)} ${n(mid - amp)} ${n(x + step / 2)} ${n(mid)}T${n(x + step)} ${n(mid)}`;
  }
  return svg(w, h, `<path d="${d}" fill="none" stroke="#000" stroke-width="${stroke}" stroke-linecap="round"/>`);
}

/** Thin rule with a diamond in the middle and small dots at the ends. */
export function diamondRule(w: number, h: number, stroke = 0.35): string {
  const mid = h / 2;
  const dm = Math.min(h * 0.45, 2.2);
  const cx = w / 2;
  return svg(
    w,
    h,
    `<line x1="${n(dm * 1.2)}" y1="${n(mid)}" x2="${n(cx - dm * 1.6)}" y2="${n(mid)}" stroke="#000" stroke-width="${stroke}"/>` +
      `<line x1="${n(cx + dm * 1.6)}" y1="${n(mid)}" x2="${n(w - dm * 1.2)}" y2="${n(mid)}" stroke="#000" stroke-width="${stroke}"/>` +
      `<polygon points="${n(cx - dm)},${n(mid)} ${n(cx)},${n(mid - dm)} ${n(cx + dm)},${n(mid)} ${n(cx)},${n(mid + dm)}" fill="#000"/>` +
      `<circle cx="${n(dm * 0.5)}" cy="${n(mid)}" r="${n(dm * 0.35)}" fill="#000"/><circle cx="${n(w - dm * 0.5)}" cy="${n(mid)}" r="${n(dm * 0.35)}" fill="#000"/>`,
  );
}

/** Diagonal black and white stripes, for warning bands. */
export function stripes(w: number, h: number, band?: number): string {
  const b = band ?? Math.max(1.2, h * 0.5);
  const parts: string[] = [];
  for (let x = -h; x < w + h; x += b * 2) {
    parts.push(`<polygon points="${n(x)},${n(h)} ${n(x + b)},${n(h)} ${n(x + b + h)},0 ${n(x + h)},0"/>`);
  }
  return svg(w, h, `<g fill="#000">${parts.join('')}</g>`);
}

/** Row of small dots. */
export function dots(w: number, h: number, gap?: number): string {
  const r = Math.min(h / 2, 0.45);
  const g = gap ?? r * 4;
  const count = Math.max(1, Math.floor(w / g));
  const start = (w - (count - 1) * g) / 2;
  const parts = Array.from({ length: count }, (_, i) => `<circle cx="${n(start + i * g)}" cy="${n(h / 2)}" r="${n(r)}"/>`);
  return svg(w, h, `<g fill="#000">${parts.join('')}</g>`);
}

/** Solid heart. */
export function heart(w: number, h: number): string {
  return svg(w, h, `<path d="M${n(w / 2)} ${n(h * 0.95)}C${n(w * -0.25)} ${n(h * 0.45)} ${n(w * 0.15)} ${n(h * -0.15)} ${n(w / 2)} ${n(h * 0.28)}C${n(w * 0.85)} ${n(h * -0.15)} ${n(w * 1.25)} ${n(h * 0.45)} ${n(w / 2)} ${n(h * 0.95)}Z" fill="#000"/>`);
}

/** Five-point star, solid or outline. */
export function star(w: number, h: number, fill = true): string {
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) / 2;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? R : R * 0.45;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${n(cx + r * Math.cos(a))},${n(cy + r * Math.sin(a))}`);
  }
  return svg(w, h, fill ? `<polygon points="${pts.join(' ')}" fill="#000"/>` : `<polygon points="${pts.join(' ')}" fill="none" stroke="#000" stroke-width="0.4"/>`);
}

/** Small leaf sprig: a stem with leaves on both sides. */
export function sprig(w: number, h: number): string {
  const mid = h / 2;
  const leaves: string[] = [];
  const count = Math.max(3, Math.floor(w / 3.2));
  for (let i = 0; i < count; i++) {
    const x = ((i + 0.6) / (count + 0.4)) * w;
    const lw = Math.min(2.4, w / count);
    const lh = h * 0.42;
    const up = i % 2 === 0;
    const y2 = up ? mid - lh : mid + lh;
    leaves.push(`<path d="M${n(x)} ${n(mid)}Q${n(x + lw * 0.9)} ${n((mid + y2) / 2 - (up ? lh * 0.2 : -lh * 0.2))} ${n(x + lw)} ${n(y2)}Q${n(x + lw * 0.1)} ${n((mid + y2) / 2)} ${n(x)} ${n(mid)}Z" fill="#000"/>`);
  }
  return svg(w, h, `<line x1="0" y1="${n(mid)}" x2="${n(w)}" y2="${n(mid)}" stroke="#000" stroke-width="0.35"/>${leaves.join('')}`);
}

/** Solid rounded tab, for labels that look like a folder tab or a price flag. */
export function tab(w: number, h: number, r = 1.2): string {
  return svg(w, h, `<rect x="0" y="0" width="${n(w)}" height="${n(h)}" rx="${r}" fill="#000"/>`);
}

/** Three white dots, like the buttons on a terminal window title bar. */
export function windowDots(w: number, h: number): string {
  const r = Math.min(h / 2, w / 7);
  const parts = [0, 1, 2].map((i) => `<circle cx="${n(r + i * r * 2.6)}" cy="${n(h / 2)}" r="${n(r)}"/>`);
  return svg(w, h, `<g fill="#fff">${parts.join('')}</g>`);
}
