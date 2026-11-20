import { api } from '../api';
import { createStore } from './store';
import { printer, activeModel } from './printer';
import { appStore, applyLabelSize, isTemplateBlank, toast } from './app';
import { editorSize, findLabelByBarcode, labelName } from '../../printer/labels';
import { t } from '../i18n';

/** Where the size of the loaded roll comes from. */
export type RollSource = 'printer' | 'remembered' | 'catalogue' | 'unknown';

export interface LoadedRoll {
  barcode?: string;
  serial?: string;
  total?: number;
  used?: number;
  /** Across the print head. */
  widthMm?: number;
  /** Along the feed. */
  lengthMm?: number;
  gapMm?: number;
  tailMm?: number;
  labelType?: number;
  source: RollSource;
}

export interface RememberedRoll {
  barcode: string;
  widthMm: number;
  lengthMm: number;
  labelType?: number;
  updatedAt: number;
}

interface RollState {
  roll?: LoadedRoll;
  remembered: Record<string, RememberedRoll>;
  /** A detected roll whose size differs from the open label, offered in the design view. */
  suggestion?: LoadedRoll;
}

/** A lookup object without a prototype, so a barcode such as "__proto__" is an ordinary key. */
function rollMap(from?: Record<string, RememberedRoll>): Record<string, RememberedRoll> {
  return Object.assign(Object.create(null) as Record<string, RememberedRoll>, from);
}

export const rollStore = createStore<RollState>({ remembered: rollMap() });

const storeId = (barcode: string) => barcode.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 100);

export async function loadRememberedRolls(): Promise<void> {
  const list = await api.store.list<RememberedRoll>('rolls');
  const remembered = rollMap();
  for (const r of list) {
    if (r && typeof r.barcode === 'string' && typeof r.widthMm === 'number' && typeof r.lengthMm === 'number') remembered[r.barcode] = r;
  }
  rollStore.set({ remembered });
  update();
}

/** Saves the size of a roll so that it is found the next time the roll is loaded. */
export async function rememberRoll(barcode: string, widthMm: number, lengthMm: number, labelType?: number): Promise<void> {
  const entry: RememberedRoll = { barcode, widthMm, lengthMm, labelType, updatedAt: Date.now() };
  await api.store.put('rolls', storeId(barcode), entry);
  const remembered = rollMap(rollStore.get().remembered);
  remembered[barcode] = entry;
  rollStore.set({ remembered });
  update();
}

export async function forgetRoll(barcode: string): Promise<void> {
  await api.store.delete('rolls', storeId(barcode));
  const remembered = rollMap(rollStore.get().remembered);
  delete remembered[barcode];
  rollStore.set({ remembered });
  update();
}

function resolve(): LoadedRoll | undefined {
  if (!printer.connected) return undefined;
  const rfid = printer.rfid?.present ? printer.rfid : undefined;
  const paper = printer.paper;
  if (!rfid && !paper) return undefined;
  const base: LoadedRoll = {
    barcode: rfid?.barcode || undefined,
    serial: rfid?.serial || undefined,
    total: rfid?.totalLabels,
    used: rfid?.usedLabels,
    labelType: paper?.labelType || rfid?.type,
    source: 'unknown',
  };
  if (paper) {
    return { ...base, widthMm: paper.widthMm, lengthMm: paper.lengthMm, gapMm: paper.gapMm, tailMm: paper.tailMm || undefined, source: 'printer' };
  }
  const saved = base.barcode ? rollStore.get().remembered[base.barcode] : undefined;
  if (saved) return { ...base, widthMm: saved.widthMm, lengthMm: saved.lengthMm, labelType: saved.labelType ?? base.labelType, source: 'remembered' };
  const known = findLabelByBarcode(base.barcode);
  if (known) return { ...base, widthMm: known.widthMm, lengthMm: known.lengthMm, tailMm: known.tailMm, labelType: known.type, source: 'catalogue' };
  return base;
}

const sizeKey = (r?: LoadedRoll) => (r ? `${r.barcode ?? ''}|${r.serial ?? ''}|${r.widthMm ?? ''}x${r.lengthMm ?? ''}|${r.labelType ?? ''}` : '');

function update(): void {
  const prev = rollStore.get().roll;
  const next = resolve();
  if (sizeKey(prev) === sizeKey(next)) {
    if (prev && next && (prev.used !== next.used || prev.total !== next.total)) rollStore.set({ roll: next });
    return;
  }
  rollStore.set({ roll: next, suggestion: undefined });
  if (next?.widthMm && next.lengthMm) onRollDetected(next);
}

/** Editor size of a roll for the active printer model. */
export function rollEditorSize(r: LoadedRoll): { widthMm: number; heightMm: number } | undefined {
  if (!r.widthMm || !r.lengthMm) return undefined;
  return editorSize(r.widthMm, r.lengthMm, activeModel());
}

export function rollLabel(r: LoadedRoll): string {
  if (!r.widthMm || !r.lengthMm) return t('state.roll.unknownSize');
  return labelName({ widthMm: r.widthMm, lengthMm: r.lengthMm, tailMm: r.tailMm, shape: r.tailMm ? 'cable' : undefined });
}

export function applyRollSize(r: LoadedRoll): void {
  const size = rollEditorSize(r);
  if (!size) return;
  applyLabelSize(size.widthMm, size.heightMm, r.labelType);
  rollStore.set({ suggestion: undefined });
}

/**
 * A new roll with a known size was found. A blank label takes the roll size
 * at once. A label with content keeps its size and the design view offers
 * the roll size instead.
 */
function onRollDetected(r: LoadedRoll): void {
  // A printer that reports its size also remembers it for the barcode, for later use without that command.
  if (r.source === 'printer' && r.barcode && r.widthMm && r.lengthMm) {
    const saved = rollStore.get().remembered[r.barcode];
    if (!saved || saved.widthMm !== r.widthMm || saved.lengthMm !== r.lengthMm) void rememberRoll(r.barcode, r.widthMm, r.lengthMm, r.labelType);
  }
  const size = rollEditorSize(r);
  if (!size) return;
  const { template, settings } = appStore.get();
  const same = Math.abs(template.widthMm - size.widthMm) < 0.5 && Math.abs(template.heightMm - size.heightMm) < 0.5;
  if (same) return;
  if (settings.autoLabelSize && isTemplateBlank()) {
    applyRollSize(r);
    toast(t('state.roll.sizeSet', { width: size.widthMm, height: size.heightMm }), 'success');
  } else {
    rollStore.set({ suggestion: r });
  }
}

let started = false;

/** Starts roll tracking. Call once at start-up. */
export function startRollTracking(): void {
  if (started) return;
  started = true;
  printer.subscribe(update);
  void loadRememberedRolls();
}
