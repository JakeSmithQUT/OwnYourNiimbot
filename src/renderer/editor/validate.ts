// Checks label data that comes from outside the app: imported label files,
// and saved labels or history entries that another program could have
// changed. Invalid data raises an error. Valid data comes back as a clean
// copy with only the parts that the editor uses.

import type { LabelTemplate } from './template';

export const LIMITS = {
  minMm: 5,
  maxWidthMm: 300,
  maxHeightMm: 500,
  maxObjects: 2000,
  maxDepth: 4,
  maxText: 10000,
  maxImageChars: 15 * 1024 * 1024,
  maxTableRows: 30,
  maxTableCols: 12,
};

const TYPES = new Set([
  'textbox', 'i-text', 'text', 'rect', 'ellipse', 'circle', 'line', 'triangle', 'polyline', 'polygon', 'path', 'group', 'image',
  'labelbarcode', 'labeltable',
]);

const NUMBERS = [
  'left', 'top', 'width', 'height', 'scaleX', 'scaleY', 'angle', 'skewX', 'skewY', 'fontSize', 'strokeWidth', 'rx', 'ry', 'radius',
  'x1', 'x2', 'y1', 'y2', 'charSpacing', 'lineHeight', 'textSize', 'lineWidth', 'cellPadding', 'opacity', 'cropX', 'cropY',
];

/** Properties that Fabric can load as an image or a pattern from a URL. */
const COLOUR_PROPS = ['fill', 'stroke', 'backgroundColor', 'textBackgroundColor'];

export class LabelFileError extends Error {}

const KINDS = new Set(['text', 'datetime', 'serial', 'image', 'shape', 'icon']);
const IMAGE_MODES = new Set(['threshold', 'floyd', 'atkinson', 'grey']);

function clampNumber(v: unknown, min: number, max: number, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
}

/**
 * Cleans the editor data of an element ("oyn"). Keeps only the keys that the
 * app uses, with values in safe ranges. The limits are the same as for labels
 * from AI assistants. Returns undefined if there is no usable data.
 */
function cleanEditorData(v: unknown): Record<string, unknown> | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const d = v as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if (typeof d.kind === 'string' && KINDS.has(d.kind)) out.kind = d.kind;
  if (typeof d.locked === 'boolean') out.locked = d.locked;
  if (typeof d.format === 'string') out.format = d.format.slice(0, 40);
  if (d.offsetDays !== undefined) out.offsetDays = Math.round(clampNumber(d.offsetDays, -36500, 36500, 0));
  if (typeof d.name === 'string') out.name = d.name.slice(0, 60);
  if (d.serial && typeof d.serial === 'object' && !Array.isArray(d.serial)) {
    const s = d.serial as Record<string, unknown>;
    out.serial = {
      start: clampNumber(s.start, -1e9, 1e9, 1),
      step: clampNumber(s.step, -1e6, 1e6, 1),
      digits: Math.round(clampNumber(s.digits, 1, 12, 4)),
      prefix: typeof s.prefix === 'string' ? s.prefix.slice(0, 20) : '',
      suffix: typeof s.suffix === 'string' ? s.suffix.slice(0, 20) : '',
    };
  }
  if (d.original !== undefined) {
    checkImageSrc(d.original, 'An image');
    out.original = d.original;
  }
  if (d.settings && typeof d.settings === 'object' && !Array.isArray(d.settings)) {
    const s = d.settings as Record<string, unknown>;
    out.settings = {
      mode: typeof s.mode === 'string' && IMAGE_MODES.has(s.mode) ? s.mode : 'floyd',
      threshold: clampNumber(s.threshold, 0, 255, 128),
      brightness: clampNumber(s.brightness, -100, 100, 0),
      contrast: clampNumber(s.contrast, -100, 100, 0),
      invert: s.invert === true,
    };
  }
  return out;
}

function fail(msg: string): never {
  throw new LabelFileError(msg);
}

function finite(v: unknown, name: string, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) fail(`${name} is not a valid number.`);
  return v;
}

function checkImageSrc(src: unknown, where: string): void {
  if (typeof src !== 'string' || !/^data:image\/(png|jpeg|gif|bmp|webp|svg\+xml);base64,/i.test(src)) {
    fail(`${where} must be an embedded image. Links to files or websites are not accepted.`);
  }
  if (src.length > LIMITS.maxImageChars) fail(`${where} is too large.`);
}

function checkObject(o: unknown, depth: number, count: { n: number }): void {
  if (!o || typeof o !== 'object' || Array.isArray(o)) fail('A label element is not valid.');
  const obj = o as Record<string, unknown>;
  if (++count.n > LIMITS.maxObjects) fail(`The label has more than ${LIMITS.maxObjects} elements.`);
  const type = typeof obj.type === 'string' ? obj.type.toLowerCase() : '';
  if (!TYPES.has(type)) fail(`The label has an element of an unknown type (${String(obj.type).slice(0, 30)}).`);

  for (const k of NUMBERS) if (k in obj && obj[k] !== null) finite(obj[k], k, -1e6, 1e6);
  if ('fontSize' in obj) finite(obj.fontSize, 'fontSize', 0, 5000);
  if ('width' in obj) finite(obj.width, 'width', 0, 1e5);
  if ('height' in obj) finite(obj.height, 'height', 0, 1e5);

  for (const k of COLOUR_PROPS) {
    if (k in obj && obj[k] !== null && obj[k] !== undefined && typeof obj[k] !== 'string') fail(`${k} must be a colour.`);
  }
  if ('text' in obj && (typeof obj.text !== 'string' || obj.text.length > LIMITS.maxText)) fail('A text element is too long.');
  if ('path' in obj && JSON.stringify(obj.path ?? '').length > LIMITS.maxImageChars) fail('A shape is too large.');
  // Effects that the editor does not use. Fabric can load images or run filters for these.
  delete obj.shadow;
  delete obj.filters;
  delete obj.resizeFilter;
  delete obj.styles;

  if ('oyn' in obj) {
    const extra = cleanEditorData(obj.oyn);
    if (extra) obj.oyn = extra;
    else delete obj.oyn;
  }
  if (type === 'image') checkImageSrc(obj.src, 'An image');
  if (type === 'labelbarcode') {
    if (typeof obj.value !== 'string' || obj.value.length > 4000) fail('A barcode value is too long.');
    if (typeof obj.format !== 'string' || !/^[a-z0-9-]{2,30}$/i.test(obj.format)) fail('A barcode type is not valid.');
  }
  if (type === 'labeltable') {
    const rows = finite(obj.rows, 'rows', 1, LIMITS.maxTableRows);
    const cols = finite(obj.cols, 'cols', 1, LIMITS.maxTableCols);
    if (!Array.isArray(obj.cells) || obj.cells.length > rows) fail('A table is not valid.');
    for (const r of obj.cells) {
      if (!Array.isArray(r) || r.length > cols || r.some((c) => typeof c !== 'string' || c.length > 1000)) fail('A table is not valid.');
    }
  }
  if (obj.clipPath !== undefined && obj.clipPath !== null) {
    if (depth >= LIMITS.maxDepth) fail('The label has too many nested elements.');
    checkObject(obj.clipPath, depth + 1, count);
  }
  if (type === 'group') {
    if (depth >= LIMITS.maxDepth) fail('The label has too many nested elements.');
    if (!Array.isArray(obj.objects)) fail('A group is not valid.');
    for (const child of obj.objects) checkObject(child, depth + 1, count);
  }
}

/** Returns a checked copy of a label, or raises LabelFileError. */
export function validateTemplate(input: unknown): LabelTemplate {
  if (!input || typeof input !== 'object') fail('This file is not a label file.');
  // A JSON round trip drops functions, undefined values and prototype tricks.
  const t = JSON.parse(JSON.stringify(input)) as Record<string, unknown>;
  const widthMm = finite(t.widthMm, 'The label width', LIMITS.minMm, LIMITS.maxWidthMm);
  const heightMm = finite(t.heightMm, 'The label height', LIMITS.minMm, LIMITS.maxHeightMm);
  const canvas = t.canvas as Record<string, unknown> | undefined;
  if (!canvas || typeof canvas !== 'object' || !Array.isArray(canvas.objects)) fail('This file is not a label file.');
  const count = { n: 0 };
  for (const o of canvas.objects) checkObject(o, 0, count);

  const labelType = typeof t.labelType === 'number' && Number.isInteger(t.labelType) && t.labelType >= 0 && t.labelType <= 255 ? t.labelType : 1;
  const radius = typeof t.cornerRadiusMm === 'number' && Number.isFinite(t.cornerRadiusMm) ? Math.max(0, Math.min(250, t.cornerRadiusMm)) : 1.5;
  const name = typeof t.name === 'string' && t.name.trim() ? t.name.slice(0, 200) : 'Imported label';
  const now = Date.now();
  const time = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : now);
  const thumbnail = typeof t.thumbnail === 'string' && t.thumbnail.startsWith('data:image/png;base64,') && t.thumbnail.length < 2_000_000 ? t.thumbnail : undefined;

  return {
    id: typeof t.id === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(t.id) ? t.id : '',
    name,
    widthMm,
    heightMm,
    cornerRadiusMm: radius,
    labelType,
    modelName: typeof t.modelName === 'string' ? t.modelName.slice(0, 50) : undefined,
    // Only the object list is kept. Canvas-level images and overlays are dropped.
    canvas: { version: typeof canvas.version === 'string' ? canvas.version.slice(0, 20) : '6', objects: canvas.objects },
    dataset: validDataset(t.dataset),
    createdAt: time(t.createdAt),
    updatedAt: time(t.updatedAt),
    thumbnail,
  };
}

/** True for a preview image that the app made itself (a PNG data URL). */
export function isPreview(src: unknown): src is string {
  return typeof src === 'string' && src.startsWith('data:image/png;base64,') && src.length < 2_000_000;
}

function validDataset(d: unknown): LabelTemplate['dataset'] {
  if (!d || typeof d !== 'object') return undefined;
  const ds = d as Record<string, unknown>;
  if (!Array.isArray(ds.columns) || !Array.isArray(ds.rows) || ds.columns.length > 200 || ds.rows.length > 20000) return undefined;
  if (!ds.columns.every((c) => typeof c === 'string')) return undefined;
  if (!ds.columns.every((c) => (c as string).length <= 4000)) return undefined;
  if (!ds.rows.every((r) => Array.isArray(r) && r.length <= 200 && r.every((c) => typeof c === 'string' && c.length <= 4000))) return undefined;
  return { name: typeof ds.name === 'string' ? ds.name.slice(0, 200) : 'Data', columns: ds.columns as string[], rows: ds.rows as string[][] };
}
