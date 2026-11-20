import type { PrintArea } from '../../printer/printArea';

/**
 * Shades the parts of a label that the print head cannot reach and outlines
 * the printable area. Put it inside an element with position: relative that
 * has the same size as the label image.
 */
export function PrintAreaOverlay(props: { widthMm: number; heightMm: number; area: PrintArea }) {
  const { widthMm: w, heightMm: h, area: a } = props;
  if (!a.clipped) return null;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const shades = [
    { left: 0, top: 0, width: '100%', height: pct(a.y, h) },
    { left: 0, top: pct(a.y + a.height, h), width: '100%', height: pct(h - a.y - a.height, h) },
    { left: 0, top: pct(a.y, h), width: pct(a.x, w), height: pct(a.height, h) },
    { left: pct(a.x + a.width, w), top: pct(a.y, h), width: pct(w - a.x - a.width, w), height: pct(a.height, h) },
  ];
  return (
    <div className="print-area" aria-hidden="true">
      {shades.map((s, i) => (
        <div key={i} className="print-shade" style={s} />
      ))}
      <div className="print-edge" style={{ left: pct(a.x, w), top: pct(a.y, h), width: pct(a.width, w), height: pct(a.height, h) }} />
    </div>
  );
}
