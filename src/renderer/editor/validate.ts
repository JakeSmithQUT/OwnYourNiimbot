// Checks label data that comes from outside the app: imported label files,
// and saved labels or history entries that another program could have
// changed. Invalid data raises an error. Valid data comes back as a clean
// copy with only the parts that the editor uses.

import type { LabelTemplate } from './template';
import { imageSize } from './imageSize';
import { t } from '../i18n';
import type { MessageKey } from '../../i18n/translate';

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
  /** Pixels of one print image. A 300 x 500 mm label at 300 dpi is about 21 million. */
  maxImagePixels: 40_000_000,
  /** Pixels of all print images in a label together. */
  maxLabelPixels: 100_000_000,
  /** Pixels of the original image that the app keeps to resize an image again. */
  maxOriginalPixels: 100_000_000,
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
    checkImageSrc(d.original, LIMITS.maxOriginalPixels);
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

/** `name` is the property name for the default message. `message` is a key for a message of its own. */
function finite(v: unknown, name: string, min: number, max: number, message: MessageKey = 'errors.label.notNumber'): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) fail(t(message, { name }));
  return v;
}

/**
 * Checks an embedded image and returns its number of pixels. The size comes
 * from the image header, because a small file can describe a very large image.
 */
function checkImageSrc(src: unknown, maxPixels: number): number {
  if (typeof src !== 'string' || !/^data:image\/(png|jpeg|gif|bmp|webp|svg\+xml);base64,/i.test(src)) {
    fail(t('errors.label.imageNotEmbedded'));
  }
  if (src.length > LIMITS.maxImageChars) fail(t('errors.label.imageTooLarge'));
  if (/^data:image\/svg\+xml/i.test(src)) return 0;
  const size = imageSize(src);
  if (!size || !size.width || !size.height) fail(t('errors.label.imageNotValid'));
  const pixels = size.width * size.height;
  if (pixels > maxPixels) fail(t('errors.label.imagePixels', { width: size.width, height: size.height }));
  return pixels;
}

function checkObject(o: unknown, depth: number, count: { n: number; pixels: number }): void {
  if (!o || typeof o !== 'object' || Array.isArray(o)) fail(t('errors.label.elementNotValid'));
  const obj = o as Record<string, unknown>;
  if (++count.n > LIMITS.maxObjects) fail(t('errors.label.tooManyElements', { max: LIMITS.maxObjects }));
  const type = typeof obj.type === 'string' ? obj.type.toLowerCase() : '';
  if (!TYPES.has(type)) fail(t('errors.label.unknownType', { type: String(obj.type).slice(0, 30) }));

  for (const k of NUMBERS) if (k in obj && obj[k] !== null) finite(obj[k], k, -1e6, 1e6);
  if ('fontSize' in obj) finite(obj.fontSize, 'fontSize', 0, 5000);
  if ('width' in obj) finite(obj.width, 'width', 0, 1e5);
  if ('height' in obj) finite(obj.height, 'height', 0, 1e5);
  // The scaled size counts too. A small image with a large scale would need a very large canvas.
  // 20,000 units is 2 m, four times the longest label.
  const scaled = (size: unknown, scale: unknown) => Math.abs(Number(size ?? 0) * Number(scale ?? 1));
  if (scaled(obj.width, obj.scaleX) > 2e4 || scaled(obj.height, obj.scaleY) > 2e4) fail(t('errors.label.elementTooLarge'));

  for (const k of COLOUR_PROPS) {
    if (k in obj && obj[k] !== null && obj[k] !== undefined && typeof obj[k] !== 'string') fail(t('errors.label.notColour', { name: k }));
  }
  if ('text' in obj && (typeof obj.text !== 'string' || obj.text.length > LIMITS.maxText)) fail(t('errors.label.textTooLong'));
  if ('path' in obj && JSON.stringify(obj.path ?? '').length > LIMITS.maxImageChars) fail(t('errors.label.shapeTooLarge'));
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
  if (type === 'image') {
    count.pixels += checkImageSrc(obj.src, LIMITS.maxImagePixels);
    if (count.pixels > LIMITS.maxLabelPixels) fail(t('errors.label.imagesTooLarge'));
  }
  if (type === 'labelbarcode') {
    if (typeof obj.value !== 'string' || obj.value.length > 4000) fail(t('errors.label.barcodeTooLong'));
    if (typeof obj.format !== 'string' || !/^[a-z0-9-]{2,30}$/i.test(obj.format)) fail(t('errors.label.barcodeType'));
  }
  if (type === 'labeltable') {
    const rows = finite(obj.rows, 'rows', 1, LIMITS.maxTableRows);
    const cols = finite(obj.cols, 'cols', 1, LIMITS.maxTableCols);
    if (!Array.isArray(obj.cells) || obj.cells.length > rows) fail(t('errors.label.tableNotValid'));
    for (const r of obj.cells) {
      if (!Array.isArray(r) || r.length > cols || r.some((c) => typeof c !== 'string' || c.length > 1000)) fail(t('errors.label.tableNotValid'));
    }
  }
  if (obj.clipPath !== undefined && obj.clipPath !== null) {
    if (depth >= LIMITS.maxDepth) fail(t('errors.label.tooDeep'));
    checkObject(obj.clipPath, depth + 1, count);
  }
  if (type === 'group') {
    if (depth >= LIMITS.maxDepth) fail(t('errors.label.tooDeep'));
    if (!Array.isArray(obj.objects)) fail(t('errors.label.groupNotValid'));
    for (const child of obj.objects) checkObject(child, depth + 1, count);
  }
}

/** Returns a checked copy of a label, or raises LabelFileError. */
export function validateTemplate(input: unknown): LabelTemplate {
  if (!input || typeof input !== 'object') fail(t('errors.label.notLabelFile'));
  // A JSON round trip drops functions, undefined values and prototype tricks.
  const raw = JSON.parse(JSON.stringify(input)) as Record<string, unknown>;
  const widthMm = finite(raw.widthMm, 'widthMm', LIMITS.minMm, LIMITS.maxWidthMm, 'errors.label.widthNotNumber');
  const heightMm = finite(raw.heightMm, 'heightMm', LIMITS.minMm, LIMITS.maxHeightMm, 'errors.label.heightNotNumber');
  const canvas = raw.canvas as Record<string, unknown> | undefined;
  if (!canvas || typeof canvas !== 'object' || !Array.isArray(canvas.objects)) fail(t('errors.label.notLabelFile'));
  const count = { n: 0, pixels: 0 };
  for (const o of canvas.objects) checkObject(o, 0, count);

  const labelType = typeof raw.labelType === 'number' && Number.isInteger(raw.labelType) && raw.labelType >= 0 && raw.labelType <= 255 ? raw.labelType : 1;
  const radius = typeof raw.cornerRadiusMm === 'number' && Number.isFinite(raw.cornerRadiusMm) ? Math.max(0, Math.min(250, raw.cornerRadiusMm)) : 1.5;
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.slice(0, 200) : t('state.importedLabel');
  const now = Date.now();
  const time = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : now);
  const thumbnail = typeof raw.thumbnail === 'string' && raw.thumbnail.startsWith('data:image/png;base64,') && raw.thumbnail.length < 2_000_000 ? raw.thumbnail : undefined;

  return {
    id: typeof raw.id === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(raw.id) ? raw.id : '',
    name,
    widthMm,
    heightMm,
    cornerRadiusMm: radius,
    labelType,
    modelName: typeof raw.modelName === 'string' ? raw.modelName.slice(0, 50) : undefined,
    // Only the object list is kept. Canvas-level images and overlays are dropped.
    canvas: { version: typeof canvas.version === 'string' ? canvas.version.slice(0, 20) : '6', objects: canvas.objects },
    dataset: validDataset(raw.dataset),
    createdAt: time(raw.createdAt),
    updatedAt: time(raw.updatedAt),
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
  return { name: typeof ds.name === 'string' ? ds.name.slice(0, 200) : t('state.dataName'), columns: ds.columns as string[], rows: ds.rows as string[][] };
}
