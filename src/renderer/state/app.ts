import { api, newId } from '../api';
import { createStore } from './store';
import { savesAsNewLabel } from './saveRules';
import { emptyTemplate, type Dataset, type LabelTemplate } from '../editor/template';
import { editor } from '../editor/EditorController';
import { LIMITS, validateTemplate } from '../editor/validate';
import type { PrintVariant } from '../../printer/models';

export type View = 'design' | 'library' | 'templates' | 'data' | 'printer' | 'history' | 'settings';

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  modelName: string;
  variant: 'auto' | PrintVariant;
  flip180: boolean;
  threshold: number;
  gridMm: number;
  snap: boolean;
  densityByModel: Record<string, number>;
  /** Give a blank label the size of the roll that is loaded in the printer. */
  autoLabelSize: boolean;
  /** Shade the parts of the label that the print head cannot reach. */
  printArea: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  modelName: 'B1',
  variant: 'auto',
  flip180: false,
  threshold: 127,
  gridMm: 0.5,
  snap: true,
  densityByModel: {},
  autoLabelSize: true,
  printArea: true,
};

export interface AppState {
  view: View;
  template: LabelTemplate;
  dirty: boolean;
  /** The name of the open label when it was opened or saved. Save with another name makes a new saved label. */
  savedName?: string;
  dataset?: Dataset;
  settings: Settings;
  printOpen: boolean;
  connectOpen: boolean;
  toast?: { text: string; kind: 'info' | 'error' | 'success'; id: number };
}

export const appStore = createStore<AppState>({
  view: 'design',
  template: emptyTemplate(),
  dirty: false,
  settings: DEFAULT_SETTINGS,
  printOpen: false,
  connectOpen: false,
});

export function toast(text: string, kind: 'info' | 'error' | 'success' = 'info'): void {
  const id = Date.now();
  appStore.set({ toast: { text, kind, id } });
  setTimeout(() => {
    if (appStore.get().toast?.id === id) appStore.set({ toast: undefined });
  }, kind === 'error' ? 6000 : 3000);
}

export async function loadSettings(): Promise<void> {
  const saved = await api.store.get<Partial<Settings>>('settings', 'app');
  const settings = { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
  appStore.set({ settings });
  editor.snapToGrid = settings.snap;
  editor.gridMm = settings.gridMm;
}

export function updateSettings(patch: Partial<Settings>): void {
  const settings = { ...appStore.get().settings, ...patch };
  appStore.set({ settings });
  editor.snapToGrid = settings.snap;
  editor.gridMm = settings.gridMm;
  void api.store.put('settings', 'app', settings);
}

export function markDirty(): void {
  if (!appStore.get().dirty) appStore.set({ dirty: true });
}

/** Copies the editor content into the template object. */
export function captureTemplate(): LabelTemplate {
  const { template, dataset } = appStore.get();
  // The editor canvas only exists while the design view is open.
  const live = Boolean(editor.canvas);
  return {
    ...template,
    widthMm: live ? editor.widthMm : template.widthMm,
    heightMm: live ? editor.heightMm : template.heightMm,
    canvas: live ? editor.toJSON() : template.canvas,
    dataset: dataset && dataset.rows.length <= 5000 ? dataset : undefined,
    updatedAt: Date.now(),
    thumbnail: live ? editor.thumbnail() : template.thumbnail,
  };
}

/**
 * Saves the open label. A label with a new name is saved as a new label, and
 * the label that was opened stays as it was.
 */
export async function saveTemplate(): Promise<LabelTemplate> {
  const t = captureTemplate();
  const asNew = savesAsNewLabel(t.id, t.name, appStore.get().savedName);
  if (asNew) {
    t.id = newId();
    t.createdAt = t.updatedAt;
  }
  if (!t.id) t.id = newId();
  await api.store.put('templates', t.id, t);
  appStore.set({ template: t, dirty: false, savedName: t.name });
  toast(asNew ? `Saved "${t.name}" as a new label` : `Saved "${t.name}"`, 'success');
  return t;
}

/** Opens a label in the design view. Labels from files or the data folder are checked first. */
export async function openTemplate(t: LabelTemplate): Promise<boolean> {
  let safe: LabelTemplate;
  try {
    safe = validateTemplate(t);
  } catch (err) {
    toast(`This label cannot be opened. ${(err as Error).message}`, 'error');
    return false;
  }
  appStore.set({
    template: safe,
    dirty: false,
    savedName: safe.id ? safe.name : undefined,
    dataset: safe.dataset ?? appStore.get().dataset,
    view: 'design',
  });
  await editor.load(safe.canvas, safe.widthMm, safe.heightMm);
  return true;
}

export async function newTemplate(widthMm: number, heightMm: number, labelType?: number): Promise<void> {
  const t = emptyTemplate(widthMm, heightMm, labelType);
  appStore.set({ template: t, dirty: false, savedName: undefined, view: 'design' });
  await editor.load(t.canvas, widthMm, heightMm);
}

export function confirmDiscard(): boolean {
  return !appStore.get().dirty || window.confirm('The current label has changes that are not saved. Continue and lose the changes?');
}

/** True when the open label has no elements. */
export function isTemplateBlank(): boolean {
  if (editor.canvas) return editor.allObjects().length === 0;
  return (appStore.get().template.canvas.objects?.length ?? 0) === 0;
}

/** Changes the size (and optionally the label type) of the open label. */
export function applyLabelSize(widthMm: number, heightMm: number, labelType?: number): void {
  // The size can come from the printer or a saved roll, so keep it inside the same limits as label files.
  const clamp = (v: number, max: number) => Math.min(max, Math.max(LIMITS.minMm, Number.isFinite(v) ? v : LIMITS.minMm));
  const w = Math.round(clamp(widthMm, LIMITS.maxWidthMm) * 10) / 10;
  const h = Math.round(clamp(heightMm, LIMITS.maxHeightMm) * 10) / 10;
  if (editor.canvas) editor.setLabelSize(w, h);
  const t = appStore.get().template;
  appStore.set({ template: { ...t, widthMm: w, heightMm: h, labelType: labelType ?? t.labelType } });
  markDirty();
  window.dispatchEvent(new Event('oyn-fit'));
}
