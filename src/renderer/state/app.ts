import { api, newId } from '../api';
import { createStore } from './store';
import { emptyTemplate, type Dataset, type LabelTemplate } from '../editor/template';
import { editor } from '../editor/EditorController';
import type { PrintVariant } from '../../printer/models';

export type View = 'design' | 'templates' | 'data' | 'printer' | 'history' | 'settings';

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  modelName: string;
  variant: 'auto' | PrintVariant;
  flip180: boolean;
  threshold: number;
  gridMm: number;
  snap: boolean;
  densityByModel: Record<string, number>;
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
};

export interface AppState {
  view: View;
  template: LabelTemplate;
  dirty: boolean;
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

export async function saveTemplate(): Promise<LabelTemplate> {
  const t = captureTemplate();
  if (!t.id) t.id = newId();
  await api.store.put('templates', t.id, t);
  appStore.set({ template: t, dirty: false });
  toast(`Saved "${t.name}"`, 'success');
  return t;
}

export async function openTemplate(t: LabelTemplate): Promise<void> {
  appStore.set({ template: t, dirty: false, dataset: t.dataset ?? appStore.get().dataset, view: 'design' });
  await editor.load(t.canvas, t.widthMm, t.heightMm);
}

export async function newTemplate(widthMm: number, heightMm: number, labelType?: number): Promise<void> {
  const t = emptyTemplate(widthMm, heightMm, labelType);
  appStore.set({ template: t, dirty: false, view: 'design' });
  await editor.load(t.canvas, widthMm, heightMm);
}

export function confirmDiscard(): boolean {
  return !appStore.get().dirty || window.confirm('The current label has changes that are not saved. Continue and lose the changes?');
}
