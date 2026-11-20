import { emptyTemplate, type LabelTemplate } from '../editor/template';
import { renderLabel } from '../editor/render';
import { compatibleLabels, physicalSize } from '../../printer/labels';
import type { PrinterModel } from '../../printer/models';
import { isRoundSize, type TemplateDesign } from './catalogue';

const templates = new Map<string, Promise<LabelTemplate>>();
const thumbs = new Map<string, Promise<string>>();

const keyOf = (d: TemplateDesign, w: number, h: number) => `${d.id}-${w}x${h}`;

/** Builds the label for one design and size. Results are cached. */
export function buildTemplate(design: TemplateDesign, w: number, h: number): Promise<LabelTemplate> {
  const key = keyOf(design, w, h);
  let p = templates.get(key);
  if (!p) {
    p = (async () => {
      const objects = await Promise.all(design.build(w, h));
      const t = emptyTemplate(w, h, design.labelType);
      t.name = design.name;
      t.cornerRadiusMm = isRoundSize(design, w, h) ? Math.min(w, h) / 2 : 1.5;
      t.canvas = { version: '6', objects: objects.map((o) => o.toObject(['oyn'])) };
      return t;
    })();
    templates.set(key, p);
  }
  return p;
}

// Thumbnails render one at a time, so a long list does not block the window.
let queue: Promise<unknown> = Promise.resolve();

export function thumbnail(design: TemplateDesign, w: number, h: number): Promise<string> {
  const key = keyOf(design, w, h);
  let p = thumbs.get(key);
  if (!p) {
    p = queue.then(async () => {
      const t = await buildTemplate(design, w, h);
      const dots = Math.min(8, 240 / Math.max(w, h));
      const sample = design.sampleData;
      const row = sample ? Object.fromEntries(sample.columns.map((c, i) => [c, sample.rows[0]?.[i] ?? ''])) : undefined;
      const canvas = await renderLabel(t, dots, { index: 0, row });
      return canvas.toDataURL('image/png');
    });
    queue = p.catch(() => undefined);
    thumbs.set(key, p);
  }
  return p;
}

export type Fit = 'roll' | 'fits' | 'no';

const near = (a: number, b: number) => Math.abs(a - b) < 0.6;

/** How well a template size suits a printer model. */
export function fitFor(w: number, h: number, model: PrinterModel): Fit {
  if (model.protocol !== 'niimbot') return 'no';
  const phys = physicalSize(w, h, model);
  if (compatibleLabels(model).some((l) => near(l.widthMm, phys.widthMm) && near(l.lengthMm, phys.lengthMm))) return 'roll';
  const head = model.printWidthMm.max ?? model.maxLabelMm.width ?? 48;
  return phys.widthMm <= head + 2 ? 'fits' : 'no';
}
