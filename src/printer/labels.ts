import catalogue from './labels.json';
import { isRotated, type PrinterModel } from './models';
import { t } from '../renderer/i18n';

/**
 * A NIIMBOT label roll. Sizes are physical: width is across the print head,
 * length is along the feed direction.
 */
export interface LabelProduct {
  widthMm: number;
  lengthMm: number;
  /** Label type code, the same as the SetLabelType value. */
  type: number;
  shape?: 'rect' | 'round' | 'cable';
  /** Tail length of cable labels, included in lengthMm. */
  tailMm?: number;
  /** Printer series (as in models.json) that take this roll. */
  series: string[];
  note?: string;
  /** Roll barcodes from the RFID tag, where known. */
  barcodes?: string[];
}

export const LABELS: LabelProduct[] = catalogue as LabelProduct[];

/** Largest roll size in mm that the app uses, the same as the printer check and the label file limits. */
const MAX_ROLL_MM = { width: 300, length: 500 };

/**
 * True for a roll size that the app can use. Saved rolls come from the data
 * folder, where another program can change them.
 */
export function rollSizeOk(widthMm: unknown, lengthMm: unknown): boolean {
  const ok = (v: unknown, max: number) => typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= max;
  return ok(widthMm, MAX_ROLL_MM.width) && ok(lengthMm, MAX_ROLL_MM.length);
}

/** Editor size (width × height as shown on screen) for a physical label on a model. */
export function editorSize(widthMm: number, lengthMm: number, model: PrinterModel): { widthMm: number; heightMm: number } {
  return isRotated(model) ? { widthMm: lengthMm, heightMm: widthMm } : { widthMm, heightMm: lengthMm };
}

/** Physical size (across the head × along the feed) from an editor size. */
export function physicalSize(editorWidthMm: number, editorHeightMm: number, model: PrinterModel): { widthMm: number; lengthMm: number } {
  return isRotated(model) ? { widthMm: editorHeightMm, lengthMm: editorWidthMm } : { widthMm: editorWidthMm, lengthMm: editorHeightMm };
}

export function labelKey(widthMm: number, lengthMm: number, type?: number): string {
  return `${widthMm}x${lengthMm}${type ? `-${type}` : ''}`;
}

/** The name of a roll in the language of the app. The note comes from the label list and stays in English. */
export function labelName(l: Pick<LabelProduct, 'widthMm' | 'lengthMm' | 'shape' | 'tailMm' | 'note'>): string {
  const size = l.shape === 'round' ? t('device.roll.round', { width: l.widthMm }) : t('device.roll.size', { width: l.widthMm, length: l.lengthMm });
  const extra = [l.shape === 'cable' && l.tailMm ? t('device.roll.cable', { tail: l.tailMm }) : '', l.note ?? ''].filter(Boolean).join(', ');
  return extra ? t('device.roll.withDetails', { size, details: extra }) : size;
}

/**
 * Rolls that suit a model. Rolls listed for the model's series come first.
 * If the series has no listed rolls, rolls that fit the print head are used.
 */
export function compatibleLabels(model: PrinterModel): LabelProduct[] {
  const typeOk = (l: LabelProduct) => !model.paperTypes.length || model.paperTypes.includes(l.type);
  const own = LABELS.filter((l) => (l.series.includes(model.series) || l.series.includes(model.name)) && typeOk(l));
  const head = model.printWidthMm.max ?? model.maxLabelMm.width ?? 50;
  const minWidth = model.printWidthMm.min ?? 0;
  const pool = own.length ? own : LABELS.filter((l) => l.widthMm <= head + 2 && l.widthMm >= minWidth - 2 && typeOk(l));
  const seen = new Set<string>();
  return pool
    .filter((l) => {
      const k = labelKey(l.widthMm, l.lengthMm, l.type) + (l.shape ?? '');
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => a.widthMm - b.widthMm || a.lengthMm - b.lengthMm || a.type - b.type);
}

/** True when the catalogue lists rolls for the model's series. False means the list is only rolls that fit the head. */
export function hasConfirmedLabels(model: PrinterModel): boolean {
  return LABELS.some((l) => l.series.includes(model.series) || l.series.includes(model.name));
}

export function findLabelByBarcode(barcode: string | undefined): LabelProduct | undefined {
  if (!barcode) return undefined;
  return LABELS.find((l) => l.barcodes?.includes(barcode));
}
