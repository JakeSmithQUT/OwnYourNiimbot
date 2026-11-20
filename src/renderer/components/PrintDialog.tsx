import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Loader2, Printer as PrinterIcon, TriangleAlert } from 'lucide-react';
import { Modal, Field, NumberInput, Check } from './ui';
import { appStore, captureTemplate, toast, updateSettings } from '../state/app';
import { activeModel, activeVariant, usePrinter } from '../state/printer';
import { buildPrintImage, monoToCanvas } from '../editor/render';
import type { RecordContext } from '../editor/placeholders';
import { LABEL_TYPE_NAMES } from '../../printer/protocol';
import { MODELS, PRINT_VARIANTS, printheadDots, type PrintVariant } from '../../printer/models';
import { MAX_LABELS_PER_JOB, type PrintPage, type PrintProgress } from '../../printer/client';
import { api, newId } from '../api';
import { rollEditorSize, rollStore } from '../state/roll';

const BUILT_INS = new Set(['date', 'time', 'datetime', 'index']);

function placeholderNames(json: unknown): string[] {
  const text = JSON.stringify(json);
  const names = new Set<string>();
  for (const m of text.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)) {
    const n = m[1].trim().toLowerCase();
    if (!BUILT_INS.has(n) && !n.startsWith('date:')) names.add(n);
  }
  return [...names];
}

export interface HistoryEntry {
  id: string;
  time: number;
  name: string;
  labels: number;
  modelName: string;
  thumbnail?: string;
  template: ReturnType<typeof captureTemplate>;
}

export function PrintDialog(props: { onClose: () => void }) {
  const { settings, dataset } = appStore.use();
  const p = usePrinter();
  const template = useMemo(() => captureTemplate(), []);
  const connectedModel = p.info.model;
  const [modelName, setModelName] = useState(activeModel().name);
  const model = connectedModel ?? MODELS.find((m) => m.name === modelName) ?? activeModel();

  const fields = useMemo(() => placeholderNames(template.canvas), [template]);
  const dataColumns = new Set((dataset?.columns ?? []).map((c) => c.trim().toLowerCase()));
  const usesData = Boolean(dataset && fields.some((f) => dataColumns.has(f)));
  const missingFields = fields.filter((f) => !dataColumns.has(f));
  const hasSerial = JSON.stringify(template.canvas).includes('"kind":"serial"');

  const rowCount = dataset?.rows.length ?? 0;
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(Math.max(1, rowCount));
  const [labelCount, setLabelCount] = useState(1);
  const [copies, setCopies] = useState(1);
  const [density, setDensity] = useState(settings.densityByModel[model.name] ?? model.density.default);
  const { roll } = rollStore.use();
  const rollSize = roll ? rollEditorSize(roll) : undefined;
  const sizeMismatch = rollSize && (Math.abs(rollSize.widthMm - template.widthMm) >= 0.5 || Math.abs(rollSize.heightMm - template.heightMm) >= 0.5);
  const preferredType = roll?.labelType && model.paperTypes.includes(roll.labelType) ? roll.labelType : template.labelType;
  const defaultType = model.paperTypes.includes(preferredType) ? preferredType : (model.paperTypes[0] ?? 1);
  const [labelType, setLabelType] = useState(defaultType);
  const [variant, setVariant] = useState<'auto' | PrintVariant>(settings.variant);
  const [flip, setFlip] = useState(settings.flip180);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [progress, setProgress] = useState<PrintProgress | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const previewRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    setDensity(Math.min(model.density.max, Math.max(model.density.min, settings.densityByModel[model.name] ?? model.density.default)));
  }, [model.name]);

  const records = useMemo<RecordContext[]>(() => {
    const now = new Date();
    if (usesData && dataset) {
      const a = Math.max(1, Math.min(from, rowCount));
      const b = Math.max(a, Math.min(to, rowCount));
      const out: RecordContext[] = [];
      for (let i = a - 1; i < b; i++) {
        const row: Record<string, string> = {};
        dataset.columns.forEach((c, j) => (row[c] = dataset.rows[i]?.[j] ?? ''));
        out.push({ index: out.length, row, now });
      }
      return out;
    }
    const n = hasSerial ? Math.max(1, Math.min(9999, labelCount)) : 1;
    return Array.from({ length: n }, (_, i) => ({ index: i, now }));
  }, [usesData, dataset, from, to, rowCount, hasSerial, labelCount]);

  const total = records.length * copies;
  const effectiveVariant = variant === 'auto' ? activeVariant(model) : variant;

  useEffect(() => {
    let cancelled = false;
    const idx = Math.min(previewIndex, records.length - 1);
    void buildPrintImage(template, model, records[idx] ?? { index: 0 }, { threshold: settings.threshold }).then(({ preview }) => {
      if (cancelled || !previewRef.current) return;
      previewRef.current.replaceChildren(monoToCanvas(preview));
    });
    return () => {
      cancelled = true;
    };
  }, [template, model, records, previewIndex, settings.threshold]);

  const doPrint = async () => {
    setError(undefined);
    if (total > MAX_LABELS_PER_JOB) {
      setError(`One print job can have up to ${MAX_LABELS_PER_JOB.toLocaleString('en-AU')} labels. Print fewer copies, or print the data in parts with From and To.`);
      return;
    }
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      // Each page is rendered just before the printer needs it.
      const pages: PrintPage[] = records.map((rec) => ({
        image: async () => (await buildPrintImage(template, model, rec, { threshold: settings.threshold, flip180: flip })).mono,
        copies,
      }));
      updateSettings({ densityByModel: { ...settings.densityByModel, [model.name]: density }, flip180: flip });
      await p.print(
        { pages, density, labelType, variant: effectiveVariant, headDots: printheadDots(model) },
        setProgress,
        ctrl.signal,
      );
      const entry: HistoryEntry = {
        id: newId(),
        time: Date.now(),
        name: template.name,
        labels: total,
        modelName: model.name,
        thumbnail: template.thumbnail,
        template: { ...template, thumbnail: undefined },
      };
      void api.store.put('history', entry.id, entry);
      toast(`Printed ${total} label${total === 1 ? '' : 's'}`, 'success');
      props.onClose();
    } catch (err) {
      const e = err as Error;
      setError(e.name === 'AbortError' ? 'The print job was cancelled.' : e.message);
    } finally {
      setBusy(false);
      abortRef.current = undefined;
    }
  };

  const savePng = async () => {
    const { preview } = await buildPrintImage(template, model, records[Math.min(previewIndex, records.length - 1)] ?? { index: 0 }, { threshold: settings.threshold });
    const data = monoToCanvas(preview).toDataURL('image/png').split(',')[1];
    await api.files.save({ defaultName: `${template.name || 'label'}.png`, filters: [{ name: 'PNG image', extensions: ['png'] }], data, encoding: 'base64' });
  };

  const unsupported = model.protocol !== 'niimbot';
  const pct = progress && progress.total ? Math.round((progress.printed / progress.total) * 100) : 0;

  return (
    <Modal
      title="Print"
      icon={<PrinterIcon size={18} />}
      wide
      onClose={() => {
        if (busy) abortRef.current?.abort();
        else props.onClose();
      }}
      footer={
        <>
          <button className="btn ghost" onClick={() => void savePng()} disabled={busy}>
            <Download size={15} /> Save as PNG
          </button>
          <div style={{ flex: 1 }} />
          {busy ? (
            <button className="btn danger" onClick={() => abortRef.current?.abort()}>
              Cancel
            </button>
          ) : (
            <button className="btn" onClick={props.onClose}>
              Close
            </button>
          )}
          {p.connected ? (
            <button className="btn primary" disabled={busy || unsupported || records.length === 0} onClick={() => void doPrint()}>
              {busy ? <Loader2 size={15} className="spin" /> : <PrinterIcon size={15} />}
              Print {total} label{total === 1 ? '' : 's'}
            </button>
          ) : (
            <button className="btn primary" onClick={() => appStore.set({ connectOpen: true })}>
              Connect a printer
            </button>
          )}
        </>
      }
    >
      <div className="print-layout">
        <div>
          <div className="preview-box">
            <div ref={previewRef} />
            {records.length > 1 && (
              <div className="btn-row">
                <button className="btn small icon" disabled={previewIndex === 0} onClick={() => setPreviewIndex(previewIndex - 1)}>
                  <ChevronLeft size={15} />
                </button>
                <span className="muted">
                  Label {Math.min(previewIndex, records.length - 1) + 1} of {records.length}
                </span>
                <button className="btn small icon" disabled={previewIndex >= records.length - 1} onClick={() => setPreviewIndex(previewIndex + 1)}>
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
            <small className="muted">Preview at {model.dpi} dpi, as the printer receives it</small>
          </div>
          {busy && progress && (
            <div style={{ marginTop: 14 }}>
              <div className="progress">
                <div style={{ width: `${pct}%` }} />
              </div>
              <p className="muted">
                {progress.message} · {progress.printed} of {progress.total}
              </p>
            </div>
          )}
          {error && (
            <div className="notice error" style={{ marginTop: 14 }}>
              <TriangleAlert size={16} /> {error}
            </div>
          )}
        </div>

        <div>
          {!connectedModel && (
            <Field label="Printer model" hint="Connect a printer to detect the model.">
              <select value={modelName} onChange={(e) => setModelName(e.target.value)}>
                {MODELS.filter((m) => m.protocol === 'niimbot').map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {connectedModel && (
            <p className="muted" style={{ marginTop: 0 }}>
              Printer: <strong>{connectedModel.name}</strong> on {p.transport?.kind === 'bluetooth' ? 'Bluetooth' : 'USB'}
            </p>
          )}
          {sizeMismatch && roll && rollSize && (
            <div className="notice warn">
              The printer has {rollSize.widthMm} × {rollSize.heightMm} mm labels loaded. This label is {template.widthMm} × {template.heightMm} mm.
            </div>
          )}
          {unsupported && (
            <div className="notice warn">
              The {model.name} uses a different command set ({model.protocol}). This app supports NIIMBOT protocol printers only.
            </div>
          )}

          {usesData && dataset ? (
            <Field label={`Data rows (${rowCount} in ${dataset.name})`}>
              <div className="field-row">
                <NumberInput value={from} min={1} max={rowCount} step={1} decimals={0} onChange={(v) => setFrom(Math.round(v))} />
                <NumberInput value={to} min={1} max={rowCount} step={1} decimals={0} onChange={(v) => setTo(Math.round(v))} />
              </div>
            </Field>
          ) : hasSerial ? (
            <Field label="Number of serial labels">
              <NumberInput value={labelCount} min={1} max={9999} step={1} decimals={0} onChange={(v) => setLabelCount(Math.round(v))} />
            </Field>
          ) : null}
          {missingFields.length > 0 && (
            <div className="notice warn">
              No data column for: {missingFields.map((f) => `{{${f}}}`).join(', ')}. Load a data file on the Data page.
            </div>
          )}

          <Field label="Copies of each label">
            <NumberInput value={copies} min={1} max={999} step={1} decimals={0} onChange={(v) => setCopies(Math.round(v))} />
          </Field>
          <Field label={`Print density ${density} (${model.density.min} to ${model.density.max})`}>
            <input type="range" min={model.density.min} max={model.density.max} step={1} value={density} onChange={(e) => setDensity(Number(e.target.value))} />
          </Field>
          <Field label="Label type">
            <select value={labelType} onChange={(e) => setLabelType(Number(e.target.value))}>
              {(model.paperTypes.length ? model.paperTypes : Object.keys(LABEL_TYPE_NAMES).map(Number)).map((t) => (
                <option key={t} value={t}>
                  {LABEL_TYPE_NAMES[t] ?? `Type ${t}`}
                </option>
              ))}
            </select>
          </Field>
          <details>
            <summary className="muted" style={{ cursor: 'pointer', marginBottom: 8 }}>
              Advanced
            </summary>
            <Field label="Command set" hint={`Auto uses ${PRINT_VARIANTS.find((v) => v.value === activeVariant(model))?.label} for the ${model.name}.`}>
              <select value={variant} onChange={(e) => setVariant(e.target.value as 'auto' | PrintVariant)}>
                <option value="auto">Auto</option>
                {PRINT_VARIANTS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </Field>
            <Check checked={flip} onChange={setFlip}>
              Turn the print 180°
            </Check>
          </details>
        </div>
      </div>
    </Modal>
  );
}
