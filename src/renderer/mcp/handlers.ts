// Runs the MCP tools that the main process forwards to the app window.
// Labels that an assistant makes live in a small workspace in memory until
// the assistant saves them or the app closes.

import { api, newId } from '../api';
import { appStore, captureTemplate, openTemplate } from '../state/app';
import { activeModel, activeVariant, printer } from '../state/printer';
import { rollEditorSize, rollLabel, rollStore } from '../state/roll';
import { buildPrintImage, monoToCanvas } from '../editor/render';
import { validateTemplate } from '../editor/validate';
import type { LabelTemplate } from '../editor/template';
import { BUNDLED_FONTS } from '../editor/bundledFonts';
import { BARCODE_FORMATS } from '../editor/objects';
import { ICONS } from '../editor/icons';
import { DESIGNS } from '../templates/catalogue';
import { buildTemplate, fitFor } from '../templates/materialise';
import { compatibleLabels, editorSize, labelName } from '../../printer/labels';
import { pixelsPerMm, printheadDots } from '../../printer/models';
import { batteryPercent, type PrintPage } from '../../printer/client';
import { LABEL_TYPE_NAMES } from '../../printer/protocol';
import type { HistoryEntry } from '../components/PrintDialog';
import { buildFromSpec, replaceText, type LabelSpec } from './spec';
import { util, type FabricObject } from 'fabric';
import { outsideArea, printArea, type PrintArea } from '../../printer/printArea';
import { UNITS_PER_MM } from '../editor/units';

interface Result {
  data?: unknown;
  image?: string;
}

const WORKSPACE_LIMIT = 40;
const workspace = new Map<string, LabelTemplate>();
const MAX_PRINT = 500;

function remember(t: LabelTemplate): string {
  const id = `ws-${newId()}`;
  workspace.set(id, t);
  while (workspace.size > WORKSPACE_LIMIT) workspace.delete(workspace.keys().next().value as string);
  return id;
}

async function resolveLabel(id: string): Promise<LabelTemplate> {
  if (id === 'open') return validateTemplate(captureTemplate());
  const ws = workspace.get(id);
  if (ws) return ws;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) throw new Error(`Unknown label_id "${id}".`);
  const saved = await api.store.get<LabelTemplate>('templates', id);
  if (!saved) throw new Error(`No label with label_id "${id}". Use "open", an ID from create_label, or an ID from list_saved_labels.`);
  return validateTemplate(saved);
}

function fields(t: LabelTemplate): string[] {
  const names = new Set<string>();
  for (const m of JSON.stringify(t.canvas).matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)) {
    const n = m[1].trim();
    if (!/^(date|time|datetime|index)(:.*)?$/i.test(n)) names.add(n);
  }
  return [...names];
}

function hasSerial(t: LabelTemplate): boolean {
  return JSON.stringify(t.canvas).includes('"kind":"serial"');
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/** The printable area of a label size on the active printer, with the "Turn the print 180°" setting. */
function areaFor(widthMm: number, heightMm: number): PrintArea {
  return printArea(widthMm, heightMm, activeModel(), appStore.get().settings.flip180);
}

function areaData(a: PrintArea) {
  return {
    print_area_mm: { x: r1(a.x), y: r1(a.y), width: r1(a.width), height: r1(a.height) },
    whole_label_prints: !a.clipped,
  };
}

/** Elements of a label that go outside the printable area, with a short description of each. */
async function outsideElements(t: LabelTemplate, a: PrintArea): Promise<{ index: number; type: string; text?: string }[]> {
  if (!a.clipped || !t.canvas.objects?.length) return [];
  const objects = (await util.enlivenObjects(t.canvas.objects)) as FabricObject[];
  const out: { index: number; type: string; text?: string }[] = [];
  objects.forEach((o, index) => {
    const r = o.getBoundingRect();
    const rect = { x: r.left / UNITS_PER_MM, y: r.top / UNITS_PER_MM, width: r.width / UNITS_PER_MM, height: r.height / UNITS_PER_MM };
    if (!outsideArea(rect, a)) return;
    const raw = o as unknown as { text?: string; value?: string };
    const text = (raw.text ?? raw.value)?.slice(0, 40);
    out.push({ index, type: o.type, ...(text ? { text } : {}) });
  });
  return out;
}

/** The print area of a label and the elements that go outside it, for the tool results. */
async function areaReport(t: LabelTemplate) {
  const a = areaFor(t.widthMm, t.heightMm);
  const outside = await outsideElements(t, a);
  return {
    ...areaData(a),
    ...(outside.length
      ? {
          outside_print_area: outside,
          warning: `${outside.length} element(s) go outside print_area_mm and will be cut off. Move or resize them so that they are inside print_area_mm, or make the label again with lines (the automatic layout stays inside the print area).`,
        }
      : {}),
  };
}

function info(id: string, t: LabelTemplate) {
  const model = activeModel();
  return {
    label_id: id,
    name: t.name,
    width_mm: t.widthMm,
    height_mm: t.heightMm,
    label_type: LABEL_TYPE_NAMES[t.labelType] ?? t.labelType,
    elements: t.canvas.objects?.length ?? 0,
    data_fields: fields(t),
    counts_up: hasSerial(t),
    fits_printer: fitFor(t.widthMm, t.heightMm, model) !== 'no',
    printer_model: model.name,
  };
}

async function preview(t: LabelTemplate, record?: Record<string, string>): Promise<string> {
  const model = activeModel();
  const { preview: mono } = await buildPrintImage(t, model, { index: 0, row: record, now: new Date() }, { threshold: appStore.get().settings.threshold });
  const canvas = monoToCanvas(mono);
  // Grey out the parts that the print head cannot reach, so that the assistant can see them.
  const a = areaFor(t.widthMm, t.heightMm);
  if (a.clipped) {
    const ctx = canvas.getContext('2d')!;
    const sx = canvas.width / t.widthMm;
    const sy = canvas.height / t.heightMm;
    ctx.fillStyle = 'rgba(128, 128, 128, 0.6)';
    ctx.fillRect(0, 0, canvas.width, a.y * sy);
    ctx.fillRect(0, (a.y + a.height) * sy, canvas.width, canvas.height - (a.y + a.height) * sy);
    ctx.fillRect(0, a.y * sy, a.x * sx, a.height * sy);
    ctx.fillRect((a.x + a.width) * sx, a.y * sy, canvas.width - (a.x + a.width) * sx, a.height * sy);
  }
  return canvas.toDataURL('image/png').split(',')[1];
}

async function maybeOpen(t: LabelTemplate, open: boolean | undefined): Promise<{ opened: boolean; note?: string }> {
  if (!open) return { opened: false };
  if (appStore.get().dirty) return { opened: false, note: 'The label in the editor has changes that are not saved, so it was not replaced.' };
  return { opened: await openTemplate({ ...t, id: '' }) };
}

function sizeFromArgs(args: { width_mm?: number; height_mm?: number; use_loaded_roll?: boolean }): { w: number; h: number; type?: number } {
  const roll = rollStore.get().roll;
  const rollSize = roll ? rollEditorSize(roll) : undefined;
  if (args.width_mm && args.height_mm && !args.use_loaded_roll) return { w: args.width_mm, h: args.height_mm };
  if (rollSize) return { w: rollSize.widthMm, h: rollSize.heightMm, type: roll?.labelType };
  if (args.width_mm && args.height_mm) return { w: args.width_mm, h: args.height_mm };
  const m = activeModel();
  return { w: m.defaultLabelMm.width, h: m.defaultLabelMm.height };
}

function checkPrinter() {
  if (!printer.connected) throw new Error('No printer is connected. Ask the user to connect the printer in the app.');
  if (printer.printing) throw new Error('The printer is busy with another job.');
  const model = activeModel();
  if (model.protocol !== 'niimbot') throw new Error(`The ${model.name} uses a command set that this app does not support.`);
  return model;
}

function recordsFor(t: LabelTemplate, args: { records?: Record<string, string>[]; serial_count?: number }) {
  const now = new Date();
  if (args.records?.length) return args.records.map((row, index) => ({ index, row, now }));
  const n = hasSerial(t) ? (args.serial_count ?? 1) : 1;
  return Array.from({ length: n }, (_, index) => ({ index, now }));
}

const TOOLS: Record<string, (args: Record<string, unknown>) => Promise<Result>> = {
  async get_status() {
    const model = activeModel();
    const roll = rollStore.get().roll;
    const size = roll ? rollEditorSize(roll) : undefined;
    const { template, dirty } = appStore.get();
    return {
      data: {
        printer: printer.connected
          ? {
              connected: true,
              model: printer.info.model?.name ?? 'unknown',
              connection: printer.transport?.kind,
              battery_percent: batteryPercent(printer.info.batteryLevel),
              firmware: printer.info.firmware,
              printing: printer.printing,
            }
          : { connected: false, model_for_design: model.name },
        loaded_roll: roll
          ? {
              size: size ? { width_mm: size.widthMm, height_mm: size.heightMm } : null,
              description: rollLabel(roll),
              label_type: roll.labelType !== undefined ? (LABEL_TYPE_NAMES[roll.labelType] ?? roll.labelType) : undefined,
              labels_remaining: roll.total !== undefined && roll.used !== undefined ? Math.max(0, roll.total - roll.used) : undefined,
            }
          : null,
        open_label: {
          label_id: 'open',
          name: template.name,
          width_mm: template.widthMm,
          height_mm: template.heightMm,
          unsaved_changes: dirty,
          ...areaData(areaFor(template.widthMm, template.heightMm)),
        },
        print_head_mm: r1(printheadDots(model) / pixelsPerMm(model.dpi)),
        prints_sideways: model.printDirection === 90 || model.printDirection === 270,
        print_resolution_dpi: model.dpi,
        fonts: BUNDLED_FONTS.map((f) => `${f.family} (${f.style.toLowerCase()})`),
        barcode_types: BARCODE_FORMATS.map((f) => f.id),
        symbols: ICONS.map((i) => i.name),
      },
    };
  },

  async list_label_sizes() {
    const model = activeModel();
    const roll = rollStore.get().roll;
    return {
      data: {
        printer_model: model.name,
        loaded_roll: roll ? rollEditorSize(roll) : null,
        rolls: compatibleLabels(model).map((l) => {
          const s = editorSize(l.widthMm, l.lengthMm, model);
          return { name: labelName(l), width_mm: s.widthMm, height_mm: s.heightMm, label_type: LABEL_TYPE_NAMES[l.type] ?? l.type, ...areaData(areaFor(s.widthMm, s.heightMm)) };
        }),
      },
    };
  },

  async list_templates(args) {
    const model = activeModel();
    const q = String(args.query ?? '').trim().toLowerCase();
    const category = String(args.category ?? '').trim().toLowerCase();
    const onlyFits = args.only_fits_printer !== false;
    const limit = Number(args.limit ?? 40);
    const out = DESIGNS.filter((d) => {
      if (args.decorative_only && !d.fonts?.length) return false;
      if (category && d.category.toLowerCase() !== category) return false;
      return !q || `${d.id} ${d.name} ${d.description} ${d.category}`.toLowerCase().includes(q);
    })
      .map((d) => ({
        template_id: d.id,
        name: d.name,
        category: d.category,
        description: d.description,
        fonts: d.fonts,
        sizes: d.sizes.filter(([w, h]) => !onlyFits || fitFor(w, h, model) !== 'no').map(([w, h]) => ({ width_mm: w, height_mm: h })),
      }))
      .filter((d) => d.sizes.length)
      .slice(0, limit);
    return { data: { printer_model: model.name, count: out.length, templates: out } };
  },

  async create_label(args) {
    const { w, h, type } = sizeFromArgs(args as { width_mm?: number; height_mm?: number; use_loaded_roll?: boolean });
    const a = areaFor(w, h);
    const t = await buildFromSpec(args as LabelSpec, w, h, type ?? 1, a.clipped ? a : undefined);
    const id = remember(t);
    const open = await maybeOpen(t, args.open_in_editor as boolean | undefined);
    return { data: { ...info(id, t), ...(await areaReport(t)), ...open }, image: await preview(t) };
  },

  async create_from_template(args) {
    const design = DESIGNS.find((d) => d.id === args.template_id);
    if (!design) throw new Error(`No template "${String(args.template_id)}". Use list_templates.`);
    const size = design.sizes.find(([w, h]) => Math.abs(w - Number(args.width_mm)) < 0.2 && Math.abs(h - Number(args.height_mm)) < 0.2);
    if (!size) throw new Error(`The template comes in these sizes: ${design.sizes.map(([w, h]) => `${w} x ${h}`).join(', ')}.`);
    let t = await buildTemplate(design, size[0], size[1]);
    const pairs = args.replace as { find: string; replace: string }[] | undefined;
    if (pairs?.length) t = replaceText(t, pairs);
    t = { ...t, name: String(args.name ?? design.name) };
    const id = remember(t);
    const open = await maybeOpen(t, args.open_in_editor as boolean | undefined);
    return { data: { ...info(id, t), ...(await areaReport(t)), ...open, sample_data_columns: design.sampleData?.columns }, image: await preview(t, design.sampleData ? Object.fromEntries(design.sampleData.columns.map((c, i) => [c, design.sampleData!.rows[0]?.[i] ?? ''])) : undefined) };
  },

  async edit_label_text(args) {
    const t = replaceText(await resolveLabel(String(args.label_id)), args.replace as { find: string; replace: string }[]);
    const id = remember(t);
    const open = await maybeOpen(t, args.open_in_editor as boolean | undefined);
    return { data: { ...info(id, t), ...(await areaReport(t)), ...open }, image: await preview(t) };
  },

  async preview_label(args) {
    const t = await resolveLabel(String(args.label_id));
    return { data: { ...info(String(args.label_id), t), ...(await areaReport(t)) }, image: await preview(t, args.record as Record<string, string> | undefined) };
  },

  async list_saved_labels() {
    const list = await api.store.list<LabelTemplate>('templates');
    return {
      data: list
        .filter((t) => t && typeof t.id === 'string')
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
        .slice(0, 200)
        .map((t) => ({ label_id: t.id, name: String(t.name ?? '').slice(0, 120), width_mm: t.widthMm, height_mm: t.heightMm })),
    };
  },

  async save_label(args) {
    const t = await resolveLabel(String(args.label_id));
    const id = newId();
    const saved: LabelTemplate = { ...t, id, name: String(args.name ?? t.name).slice(0, 120), createdAt: Date.now(), updatedAt: Date.now() };
    await api.store.put('templates', id, saved);
    return { data: { saved: true, label_id: id, name: saved.name } };
  },

  async print_summary(args) {
    const model = checkPrinter();
    const t = await resolveLabel(String(args.label_id));
    const copies = Number(args.copies ?? 1);
    const labels = recordsFor(t, args).length * copies;
    if (labels > MAX_PRINT) throw new Error(`One request can print up to ${MAX_PRINT} labels.`);
    const missing = fields(t).filter((f) => !(args.records as Record<string, string>[] | undefined)?.some((r) => f in r));
    if (missing.length) throw new Error(`The label needs values for: ${missing.join(', ')}. Pass them in "records".`);
    const report = await areaReport(t);
    return { data: { labels, name: t.name, size: `${t.widthMm} × ${t.heightMm} mm`, model: model.name, ...(report.warning ? { warning: report.warning } : {}) } };
  },

  async print_label(args) {
    const model = checkPrinter();
    const t = await resolveLabel(String(args.label_id));
    const settings = appStore.get().settings;
    const copies = Number(args.copies ?? 1);
    const records = recordsFor(t, args);
    // Also checked in print_summary. Checked here too, so that the limit does not depend on the order of the calls.
    if (records.length * copies > MAX_PRINT) throw new Error(`One request can print up to ${MAX_PRINT} labels.`);
    const pages: PrintPage[] = records.map((rec) => ({
      image: async () => (await buildPrintImage(t, model, rec, { threshold: settings.threshold, flip180: settings.flip180 })).mono,
      copies,
    }));
    const density = Math.min(model.density.max, Math.max(model.density.min, Number(args.density ?? settings.densityByModel[model.name] ?? model.density.default)));
    const labelType = model.paperTypes.length && !model.paperTypes.includes(t.labelType) ? model.paperTypes[0] : t.labelType;
    await printer.print({ pages, density, labelType, variant: activeVariant(model), headDots: printheadDots(model) });
    const total = pages.length * copies;
    const entry: HistoryEntry = { id: newId(), time: Date.now(), name: t.name, labels: total, modelName: model.name, template: { ...t, thumbnail: undefined } };
    void api.store.put('history', entry.id, entry);
    return { data: { printed: total, name: t.name, printer_model: model.name } };
  },
};

let started = false;

/** Answers tool calls from the main process. Call once at start-up. */
export function startMcpHandlers(): void {
  if (started) return;
  started = true;
  api.mcp.onCall(({ id, tool, args }) => {
    const fn = TOOLS[tool];
    if (!fn) {
      api.mcp.reply(id, { ok: false, error: `Unknown tool ${tool}` });
      return;
    }
    fn((args ?? {}) as Record<string, unknown>)
      .then((result) => api.mcp.reply(id, { ok: true, result }))
      .catch((err: unknown) => api.mcp.reply(id, { ok: false, error: (err as Error)?.message ?? String(err) }));
  });
  api.mcp.ready();
}
