import modelData from './models.json';

export type PrinterProtocol = 'niimbot' | 'zicox' | 'daozhen' | 'snbc' | 'unknown';

export interface PrinterModel {
  name: string;
  ids: number[];
  series: string;
  protocol: PrinterProtocol;
  dpi: number;
  /** Rotation in degrees that the official app applies to the label image. */
  printDirection: number;
  align: 'left' | 'center' | 'right';
  printWidthMm: { min: number | null; max: number | null };
  maxLabelMm: { width: number | null; length: number | null };
  density: { min: number; max: number; default: number };
  paperTypes: number[];
  defaultLabelMm: { width: number; height: number };
  rfid: boolean;
  wifi: boolean;
  cutter: string | null;
  calibration: boolean;
}

/**
 * Print command sequences. Printer firmware families expect different packets
 * at the start of a job and for the page size.
 *
 * - legacy: PrintStart(1 byte), SetPageSize(rows, cols), PrintQuantity
 * - d110:   as legacy, with PrintClear before each page
 * - modern: PrintStart(7 bytes with total count), SetPageSize(rows, cols, copies)
 */
export type PrintVariant = 'legacy' | 'd110' | 'modern';

export const PRINT_VARIANTS: { value: PrintVariant; label: string; hint: string }[] = [
  { value: 'legacy', label: 'Legacy (D11, B21, B3S)', hint: 'Older D11, B21 and B3S firmware' },
  { value: 'd110', label: 'D110 family', hint: 'D110, B21S, B18 and similar' },
  { value: 'modern', label: 'Modern (B1 and newer)', hint: 'B1, B2, B31, B32, K3, M2, M3, P1 and newer models' },
];

export const MODELS: PrinterModel[] = modelData as PrinterModel[];

const LEGACY = new Set([
  'D11', 'D11S', 'Hi-NB-D11', 'Fust', 'D41', 'D61', 'Dxx',
  'B21', 'B21-L2B', 'B21-C2B',
  'B3S', 'JCB3S', 'A8', 'S6',
  'D101', 'Betty', 'H1', 'B16',
]);
// The H1S (model ID 4352) uses the modern sequence. With the D110 sequence it
// ignores the copy count, and the first job after a connection does not print.
const D110 = new Set([
  'D110', 'Hi-D110', 'B21S', 'B21S-C2B', 'D11 H', 'D11 Pro',
  'B18', 'B18S', 'N1', 'B203', 'A20', 'A203',
]);

/** Newer models with low model IDs that still use the modern sequence. */
const MODERN = new Set([
  'B32', 'B32R', 'Z401', 'A63', 'T8S',
  'B3S P', 'B3S A', 'A8 P', 'S6 P',
  'B21 Pro', 'D110 M', 'P1', 'P1S', 'P18',
]);

export function findModelById(id: number): PrinterModel | undefined {
  return MODELS.find((m) => m.ids.includes(id));
}

export function findModelByName(name: string): PrinterModel | undefined {
  const n = name.trim().toLowerCase();
  return MODELS.find((m) => m.name.toLowerCase() === n);
}

/** Guess the model from a Bluetooth name such as "D110-H123456789" or "B1-G1234". */
export function guessModelFromDeviceName(deviceName: string): PrinterModel | undefined {
  const prefix = deviceName.split(/[-_\s]/)[0]?.toUpperCase();
  if (!prefix) return undefined;
  return MODELS.find((m) => m.name.toUpperCase() === prefix) ??
    MODELS.find((m) => m.name.replace(/\s/g, '').toUpperCase() === prefix);
}

export function defaultVariant(model: PrinterModel | undefined): PrintVariant {
  if (!model) return 'modern';
  if (LEGACY.has(model.name)) return 'legacy';
  if (D110.has(model.name)) return 'd110';
  if (MODERN.has(model.name)) return 'modern';
  const id = model.ids[0] ?? 0;
  return id >= 0x1000 || id === 0 ? 'modern' : 'd110';
}

/** Dots per millimetre. A "203 dpi" head is 8 dots/mm (203.2 dpi). */
export function pixelsPerMm(dpi: number): number {
  return dpi === 203 ? 8 : dpi / 25.4;
}

/** Width of the print head in dots. */
export function printheadDots(model: PrinterModel): number {
  const mm = model.printWidthMm.max ?? model.maxLabelMm.width ?? 48;
  return Math.round(mm * pixelsPerMm(model.dpi));
}

export function isSupportedProtocol(model: PrinterModel | undefined): boolean {
  return !model || model.protocol === 'niimbot';
}

/** True when the label is fed sideways, so the image must be turned before printing. */
export function isRotated(model: PrinterModel): boolean {
  return model.printDirection === 90 || model.printDirection === 270;
}

/** Bluetooth name prefixes of known models, longest first. */
export const KNOWN_NAME_PREFIXES = [...new Set(MODELS.map((m) => m.name.replace(/\s/g, '').toUpperCase()))]
  .sort((a, b) => b.length - a.length);

export function looksLikeNiimbot(deviceName: string | undefined): boolean {
  if (!deviceName) return false;
  const upper = deviceName.toUpperCase();
  return KNOWN_NAME_PREFIXES.some((p) => upper.startsWith(p)) || upper.includes('NIIMBOT');
}
