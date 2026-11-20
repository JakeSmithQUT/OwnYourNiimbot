import { useEffect, useState } from 'react';
import { Ellipse, FabricImage, Line, Rect, Textbox, type FabricObject } from 'fabric';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Underline,
} from 'lucide-react';
import { editor } from '../editor/EditorController';
import { useEditor } from '../views/DesignView';
import { BARCODE_FORMATS, barcodeFormat, LabelBarcode, LabelTable } from '../editor/objects';
import { oyn } from '../editor/render';
import { listFonts } from '../editor/fonts';
import { BUNDLED_FONTS } from '../editor/bundledFonts';
import { DATE_FORMATS, formatDate, formatSerial, type SerialSettings } from '../editor/placeholders';
import { DEFAULT_IMAGE_SETTINGS, type ImageMode, type ImageSettings } from '../editor/imageProcessing';
import { mmToUnits, ptToUnits, unitsToMm, unitsToPt } from '../editor/units';
import { appStore, applyLabelSize, markDirty, toast } from '../state/app';
import { activeModel, usePrinter } from '../state/printer';
import { rememberRoll, rollStore } from '../state/roll';
import { physicalSize } from '../../printer/labels';
import { printArea } from '../../printer/printArea';
import { LabelPicker } from './LabelPicker';
import { LABEL_TYPE_NAMES } from '../../printer/protocol';
import { Check, Field, NumberInput, Segmented, TextInput } from './ui';

function useFonts(): string[] {
  const [fonts, setFonts] = useState<string[]>([]);
  useEffect(() => {
    void listFonts().then(setFonts);
  }, []);
  return fonts;
}

/** Font list with the fonts that ship with the app first. */
function FontSelect(props: { value: string; fonts: string[]; onChange: (f: string) => void }) {
  const bundled = BUNDLED_FONTS.map((f) => f.family);
  const system = props.fonts.filter((f) => !bundled.includes(f));
  const known = bundled.includes(props.value) || system.includes(props.value);
  return (
    <select value={props.value} onChange={(e) => props.onChange(e.target.value)}>
      {!known && <option value={props.value}>{props.value}</option>}
      <optgroup label="Included with the app">
        {BUNDLED_FONTS.map((f) => (
          <option key={f.family} value={f.family} style={{ fontFamily: `"${f.family}"` }}>
            {f.family} · {f.style.toLowerCase()}
          </option>
        ))}
      </optgroup>
      <optgroup label="Fonts on this computer">
        {system.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

function FieldInsert(props: { onInsert: (token: string) => void }) {
  const { dataset } = appStore.use();
  const options = [...(dataset?.columns ?? []), 'date', 'time', 'index'];
  return (
    <select
      value=""
      onChange={(e) => {
        if (e.target.value) props.onInsert(`{{${e.target.value}}}`);
      }}
    >
      <option value="">Insert a data field…</option>
      {dataset?.columns.length ? (
        <optgroup label={`Columns from ${dataset.name}`}>
          {dataset.columns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </optgroup>
      ) : null}
      <optgroup label="Built-in">
        {options.slice(dataset?.columns.length ?? 0).map((c) => (
          <option key={c} value={c}>
            {c === 'index' ? 'label number' : c}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

function GeometryFields({ obj }: { obj: FabricObject }) {
  const locked = Boolean(oyn(obj).locked);
  const set = (props: Record<string, unknown>) => editor.update(obj, props);
  const isLine = obj instanceof Line;
  return (
    <>
      <div className="field-row">
        <Field label="X">
          <NumberInput unit="mm" value={unitsToMm(obj.left ?? 0)} disabled={locked} onChange={(v) => set({ left: mmToUnits(v) })} />
        </Field>
        <Field label="Y">
          <NumberInput unit="mm" value={unitsToMm(obj.top ?? 0)} disabled={locked} onChange={(v) => set({ top: mmToUnits(v) })} />
        </Field>
      </div>
      {!isLine && (
        <div className="field-row">
          <Field label="Width">
            <NumberInput
              unit="mm"
              min={0.5}
              value={unitsToMm(obj.getScaledWidth())}
              disabled={locked}
              onChange={(v) => {
                if (obj instanceof FabricImage || (!(obj instanceof Textbox) && !(obj instanceof LabelBarcode) && !(obj instanceof LabelTable) && !(obj instanceof Rect) && !(obj instanceof Ellipse))) {
                  set({ scaleX: mmToUnits(v) / obj.width });
                } else if (obj instanceof Ellipse) {
                  set({ rx: mmToUnits(v) / 2 / (obj.scaleX ?? 1) });
                } else {
                  set({ width: mmToUnits(v) / (obj.scaleX ?? 1) });
                }
              }}
            />
          </Field>
          {!(obj instanceof Textbox) && (
            <Field label="Height">
              <NumberInput
                unit="mm"
                min={0.5}
                value={unitsToMm(obj.getScaledHeight())}
                disabled={locked}
                onChange={(v) => {
                  if (obj instanceof FabricImage || (!(obj instanceof LabelBarcode) && !(obj instanceof LabelTable) && !(obj instanceof Rect) && !(obj instanceof Ellipse))) {
                    set({ scaleY: mmToUnits(v) / obj.height });
                  } else if (obj instanceof Ellipse) {
                    set({ ry: mmToUnits(v) / 2 / (obj.scaleY ?? 1) });
                  } else {
                    set({ height: mmToUnits(v) / (obj.scaleY ?? 1) });
                  }
                }}
              />
            </Field>
          )}
        </div>
      )}
      <Field label="Rotation">
        <Segmented
          value={String(Math.round(obj.angle ?? 0) % 360)}
          options={['0', '90', '180', '270'].map((d) => ({ value: d, label: `${d}°` }))}
          onChange={(d) => {
            obj.rotate(Number(d));
            editor.update(obj, {});
          }}
        />
      </Field>
    </>
  );
}

function TextProps({ obj }: { obj: Textbox }) {
  const fonts = useFonts();
  const data = oyn(obj);
  const set = (props: Record<string, unknown>) => editor.update(obj, props);
  const inverted = obj.backgroundColor === '#000000';
  return (
    <>
      {data.kind === 'datetime' ? (
        <>
          <Field label="Date format">
            <select
              value={data.format}
              onChange={(e) => {
                data.format = e.target.value;
                set({ text: formatDate(new Date(Date.now() + (data.offsetDays ?? 0) * 86400000), data.format) });
              }}
            >
              {[...new Set([...DATE_FORMATS, data.format ?? ''])].filter(Boolean).map((f) => (
                <option key={f} value={f}>
                  {formatDate(new Date(), f)} ({f})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Add days" hint="Use this for best-before or expiry dates.">
            <NumberInput
              value={data.offsetDays ?? 0}
              step={1}
              decimals={0}
              onChange={(v) => {
                data.offsetDays = Math.round(v);
                set({ text: formatDate(new Date(Date.now() + data.offsetDays * 86400000), data.format ?? 'DD/MM/YYYY') });
              }}
            />
          </Field>
        </>
      ) : data.kind === 'serial' && data.serial ? (
        <SerialFields
          value={data.serial}
          onChange={(s) => {
            data.serial = s;
            set({ text: formatSerial(s, 0) });
          }}
        />
      ) : (
        <>
          <Field label="Text">
            <TextInput multiline value={obj.text ?? ''} onChange={(v) => set({ text: v })} />
          </Field>
          <div className="field">
            <FieldInsert onInsert={(token) => set({ text: `${obj.text ?? ''}${token}` })} />
          </div>
        </>
      )}
      <Field label="Font">
        <FontSelect value={obj.fontFamily ?? 'Arial'} fonts={fonts} onChange={(f) => set({ fontFamily: f })} />
      </Field>
      <div className="field-row">
        <Field label="Size">
          <NumberInput unit="pt" min={2} max={400} value={unitsToPt(obj.fontSize ?? 12)} onChange={(v) => set({ fontSize: ptToUnits(v) })} />
        </Field>
        <Field label="Line spacing">
          <NumberInput min={0.5} max={4} step={0.05} decimals={2} value={obj.lineHeight ?? 1.1} onChange={(v) => set({ lineHeight: v })} />
        </Field>
      </div>
      <div className="field">
        <label>Style</label>
        <div className="btn-row">
          <div className="seg">
            <button className={obj.fontWeight === 'bold' ? 'on' : ''} title="Bold" onClick={() => set({ fontWeight: obj.fontWeight === 'bold' ? 'normal' : 'bold' })}>
              <Bold size={15} />
            </button>
            <button className={obj.fontStyle === 'italic' ? 'on' : ''} title="Italic" onClick={() => set({ fontStyle: obj.fontStyle === 'italic' ? 'normal' : 'italic' })}>
              <Italic size={15} />
            </button>
            <button className={obj.underline ? 'on' : ''} title="Underline" onClick={() => set({ underline: !obj.underline })}>
              <Underline size={15} />
            </button>
            <button className={obj.linethrough ? 'on' : ''} title="Strikethrough" onClick={() => set({ linethrough: !obj.linethrough })}>
              <Strikethrough size={15} />
            </button>
          </div>
          <Segmented
            value={obj.textAlign ?? 'left'}
            options={[
              { value: 'left', label: <AlignLeft size={15} />, title: 'Left' },
              { value: 'center', label: <AlignCenter size={15} />, title: 'Centre' },
              { value: 'right', label: <AlignRight size={15} />, title: 'Right' },
              { value: 'justify', label: <AlignJustify size={15} />, title: 'Justify' },
            ]}
            onChange={(v) => set({ textAlign: v })}
          />
        </div>
      </div>
      <Field label="Letter spacing">
        <input type="range" min={-100} max={800} step={10} value={obj.charSpacing ?? 0} onChange={(e) => set({ charSpacing: Number(e.target.value) })} />
      </Field>
      <Check checked={inverted} onChange={(v) => set(v ? { backgroundColor: '#000000', fill: '#ffffff' } : { backgroundColor: '', fill: '#000000' })}>
        White text on black
      </Check>
    </>
  );
}

function SerialFields(props: { value: SerialSettings; onChange: (s: SerialSettings) => void }) {
  const s = props.value;
  const set = (patch: Partial<SerialSettings>) => props.onChange({ ...s, ...patch });
  return (
    <>
      <div className="field-row">
        <Field label="Prefix">
          <TextInput value={s.prefix} onChange={(v) => set({ prefix: v })} />
        </Field>
        <Field label="Suffix">
          <TextInput value={s.suffix} onChange={(v) => set({ suffix: v })} />
        </Field>
      </div>
      <div className="field-row three">
        <Field label="Start">
          <NumberInput value={s.start} step={1} decimals={0} onChange={(v) => set({ start: Math.round(v) })} />
        </Field>
        <Field label="Step">
          <NumberInput value={s.step} step={1} decimals={0} onChange={(v) => set({ step: Math.round(v) })} />
        </Field>
        <Field label="Digits">
          <NumberInput value={s.digits} min={1} max={12} step={1} decimals={0} onChange={(v) => set({ digits: Math.round(v) })} />
        </Field>
      </div>
      <p className="muted">
        Example: {formatSerial(s, 0)}, {formatSerial(s, 1)}, {formatSerial(s, 2)}
      </p>
    </>
  );
}

function BarcodeProps({ obj }: { obj: LabelBarcode }) {
  const set = (props: Record<string, unknown>) => editor.update(obj, props);
  const fmt = barcodeFormat(obj.format);
  const error = obj.error;
  return (
    <>
      <Field label="Type">
        <select
          value={obj.format}
          onChange={(e) => {
            const next = barcodeFormat(e.target.value);
            set({ format: next.id, showText: next.twoD ? false : obj.showText, value: next.twoD === fmt.twoD && !obj.error ? obj.value : next.sample });
          }}
        >
          <optgroup label="Barcodes">
            {BARCODE_FORMATS.filter((f) => !f.twoD).map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="2D codes">
            {BARCODE_FORMATS.filter((f) => f.twoD).map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </optgroup>
        </select>
      </Field>
      <Field label="Content">
        <TextInput multiline={fmt.twoD} value={obj.value} onChange={(v) => set({ value: v })} />
      </Field>
      <div className="field">
        <FieldInsert onInsert={(token) => set({ value: `${obj.value}${token}` })} />
      </div>
      {error && !/\{\{/.test(obj.value) && <div className="notice error">{error}</div>}
      {obj.format === 'qrcode' && (
        <Field label="Error correction">
          <Segmented
            value={obj.eclevel}
            options={['L', 'M', 'Q', 'H'].map((l) => ({ value: l, label: l }))}
            onChange={(v) => set({ eclevel: v })}
          />
        </Field>
      )}
      {!fmt.twoD && (
        <>
          <Check checked={obj.showText} onChange={(v) => set({ showText: v })}>
            Show text under the bars
          </Check>
          {obj.showText && (
            <Field label="Text size">
              <NumberInput unit="pt" min={3} max={40} value={unitsToPt(obj.textSize)} onChange={(v) => set({ textSize: ptToUnits(v) })} />
            </Field>
          )}
        </>
      )}
    </>
  );
}

function ImageProps({ obj }: { obj: FabricImage }) {
  const data = oyn(obj);
  const [settings, setSettings] = useState<ImageSettings>({ ...DEFAULT_IMAGE_SETTINGS, ...((data.settings as ImageSettings) ?? {}) });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setSettings({ ...DEFAULT_IMAGE_SETTINGS, ...((oyn(obj).settings as ImageSettings) ?? {}) });
  }, [obj]);
  const apply = async (patch: Partial<ImageSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setBusy(true);
    try {
      await editor.reprocessImage(obj, next);
    } finally {
      setBusy(false);
    }
  };
  if (!data.original) return <p className="muted">This image has no source data to process.</p>;
  return (
    <>
      <Field label="Black and white">
        <select value={settings.mode} onChange={(e) => void apply({ mode: e.target.value as ImageMode })}>
          <option value="floyd">Dither (photos)</option>
          <option value="atkinson">Dither, high contrast</option>
          <option value="threshold">Threshold (logos, line art)</option>
          <option value="grey">Greyscale preview</option>
        </select>
      </Field>
      <Field label={`Threshold ${settings.threshold}`}>
        <input type="range" min={10} max={245} value={settings.threshold} onChange={(e) => setSettings({ ...settings, threshold: Number(e.target.value) })} onMouseUp={() => void apply({})} />
      </Field>
      <Field label={`Brightness ${settings.brightness}`}>
        <input type="range" min={-100} max={100} value={settings.brightness} onChange={(e) => setSettings({ ...settings, brightness: Number(e.target.value) })} onMouseUp={() => void apply({})} />
      </Field>
      <Field label={`Contrast ${settings.contrast}`}>
        <input type="range" min={-100} max={100} value={settings.contrast} onChange={(e) => setSettings({ ...settings, contrast: Number(e.target.value) })} onMouseUp={() => void apply({})} />
      </Field>
      <Check checked={settings.invert} onChange={(v) => void apply({ invert: v })}>
        Invert
      </Check>
      {busy && <p className="muted">Processing…</p>}
    </>
  );
}

function ShapeProps({ obj }: { obj: FabricObject }) {
  const set = (props: Record<string, unknown>) => editor.update(obj, props);
  const filled = obj.fill === '#000000';
  const dashed = Array.isArray(obj.strokeDashArray) && obj.strokeDashArray.length > 0;
  return (
    <>
      <Field label="Line width">
        <NumberInput unit="mm" min={0.1} max={10} value={unitsToMm(obj.strokeWidth ?? 0)} onChange={(v) => set({ strokeWidth: mmToUnits(v) })} />
      </Field>
      {!(obj instanceof Line) && (
        <Check checked={filled} onChange={(v) => set({ fill: v ? '#000000' : 'transparent' })}>
          Fill black
        </Check>
      )}
      <Check checked={dashed} onChange={(v) => set({ strokeDashArray: v ? [mmToUnits(1.2), mmToUnits(0.8)] : null })}>
        Dashed line
      </Check>
      {obj instanceof Rect && (
        <Field label="Corner radius">
          <NumberInput unit="mm" min={0} max={50} value={unitsToMm(obj.rx ?? 0)} onChange={(v) => set({ rx: mmToUnits(v), ry: mmToUnits(v) })} />
        </Field>
      )}
    </>
  );
}

function TableProps({ obj }: { obj: LabelTable }) {
  const fonts = useFonts();
  const set = (props: Record<string, unknown>) => editor.update(obj, props);
  return (
    <>
      <div className="field-row">
        <Field label="Rows">
          <NumberInput value={obj.rows} min={1} max={30} step={1} decimals={0} onChange={(v) => {
            obj.resize(v, obj.cols);
            set({});
          }} />
        </Field>
        <Field label="Columns">
          <NumberInput value={obj.cols} min={1} max={12} step={1} decimals={0} onChange={(v) => {
            obj.resize(obj.rows, v);
            set({});
          }} />
        </Field>
      </div>
      <div className="field">
        <label>Cells</label>
        <div className="cell-grid" style={{ gridTemplateColumns: `repeat(${obj.cols}, 1fr)` }}>
          {obj.cells.map((row, r) =>
            row.map((cell, c) => (
              <input
                key={`${r}-${c}`}
                type="text"
                value={cell}
                onKeyDown={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const cells = obj.cells.map((x) => [...x]);
                  cells[r][c] = e.target.value;
                  set({ cells });
                }}
              />
            )),
          )}
        </div>
      </div>
      <Field label="Font">
        <FontSelect value={obj.fontFamily} fonts={fonts} onChange={(f) => set({ fontFamily: f })} />
      </Field>
      <div className="field-row">
        <Field label="Text size">
          <NumberInput unit="pt" min={2} max={100} value={unitsToPt(obj.fontSize)} onChange={(v) => set({ fontSize: ptToUnits(v) })} />
        </Field>
        <Field label="Line width">
          <NumberInput unit="mm" min={0} max={5} value={unitsToMm(obj.lineWidth)} onChange={(v) => set({ lineWidth: mmToUnits(v) })} />
        </Field>
      </div>
      <div className="btn-row">
        <Segmented
          value={obj.textAlign}
          options={[
            { value: 'left', label: <AlignLeft size={15} /> },
            { value: 'center', label: <AlignCenter size={15} /> },
            { value: 'right', label: <AlignRight size={15} /> },
          ]}
          onChange={(v) => set({ textAlign: v })}
        />
        <Check checked={obj.fontWeight === 'bold'} onChange={(v) => set({ fontWeight: v ? 'bold' : 'normal' })}>
          Bold
        </Check>
      </div>
    </>
  );
}

function LabelProps() {
  const { template, settings } = appStore.use();
  const model = activeModel();
  const { roll } = rollStore.use();
  usePrinter();
  const setSize = (w: number, h: number, labelType?: number) => applyLabelSize(w, h, labelType);
  const setTemplate = (patch: Partial<typeof template>) => {
    appStore.set({ template: { ...appStore.get().template, ...patch } });
    markDirty();
  };
  const area = printArea(editor.widthMm, editor.heightMm, model, settings.flip180);
  const outside = editor.elementsOutside(area);
  return (
    <>
      <div className="section-title">Label</div>
      <Field label="NIIMBOT roll">
        <LabelPicker model={model} widthMm={editor.widthMm} heightMm={editor.heightMm} labelType={template.labelType} onPick={(p) => setSize(p.widthMm, p.heightMm, p.labelType)} />
      </Field>
      {roll && roll.source === 'unknown' && roll.barcode && (
        <div className="notice">
          <div>
            The loaded roll ({roll.barcode}) has no known size. Select its size, then save it for this roll.
            <div style={{ marginTop: 8 }}>
              <button
                className="btn small"
                onClick={() => {
                  const phys = physicalSize(editor.widthMm, editor.heightMm, model);
                  void rememberRoll(roll.barcode!, phys.widthMm, phys.lengthMm, template.labelType).then(() =>
                    toast(`Saved ${editor.widthMm} × ${editor.heightMm} mm for roll ${roll.barcode}`, 'success'),
                  );
                }}
              >
                Save {editor.widthMm} × {editor.heightMm} mm for this roll
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="field-row">
        <Field label="Width">
          <NumberInput unit="mm" min={5} max={300} value={editor.widthMm} onChange={(v) => setSize(v, editor.heightMm)} />
        </Field>
        <Field label="Height">
          <NumberInput unit="mm" min={5} max={500} value={editor.heightMm} onChange={(v) => setSize(editor.widthMm, v)} />
        </Field>
      </div>
      {area.clipped &&
        (outside.length ? (
          <div className="notice warn">
            <div>
              The {model.name} prints {Number(area.headMm.toFixed(1))} mm across this {Number((area.sideways ? editor.heightMm : editor.widthMm).toFixed(1))} mm label.{' '}
              {outside.length === 1 ? '1 element goes' : `${outside.length} elements go`} outside the print area and will be cut off.
              <div style={{ marginTop: 8 }}>
                <button className="btn small" onClick={() => editor.fitToArea(area)}>
                  Fit into the print area
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="muted print-area-hint">
            The {model.name} prints {Number(area.headMm.toFixed(1))} mm across this label. The shaded parts do not print.
          </p>
        ))}
      <Field label="Label type">
        <select value={template.labelType} onChange={(e) => setTemplate({ labelType: Number(e.target.value) })}>
          {Object.entries(LABEL_TYPE_NAMES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
              {model.paperTypes.length && !model.paperTypes.includes(Number(k)) ? ' (not listed for this model)' : ''}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Corner radius (preview only)">
        <NumberInput unit="mm" min={0} max={20} value={template.cornerRadiusMm} onChange={(v) => setTemplate({ cornerRadiusMm: v })} />
      </Field>
      <Field label="Snap grid">
        <NumberInput unit="mm" min={0.1} max={10} value={settings.gridMm} onChange={(v) => {
          editor.gridMm = v;
          appStore.set({ settings: { ...settings, gridMm: v } });
        }} />
      </Field>
      <p className="muted">Select an element on the label to change it. Double-click text to edit it on the label.</p>
    </>
  );
}

export function PropertiesPanel() {
  useEditor();
  const selection = editor.selection;
  const obj = selection.length === 1 ? selection[0] : undefined;
  let title = 'Element';
  let body: React.ReactNode = null;
  if (obj instanceof Textbox) {
    const kind = oyn(obj).kind;
    title = kind === 'datetime' ? 'Date and time' : kind === 'serial' ? 'Serial number' : 'Text';
    body = <TextProps obj={obj} />;
  } else if (obj instanceof LabelBarcode) {
    title = barcodeFormat(obj.format).twoD ? '2D code' : 'Barcode';
    body = <BarcodeProps obj={obj} />;
  } else if (obj instanceof FabricImage) {
    title = 'Image';
    body = <ImageProps obj={obj} />;
  } else if (obj instanceof LabelTable) {
    title = 'Table';
    body = <TableProps obj={obj} />;
  } else if (obj instanceof Rect || obj instanceof Ellipse || obj instanceof Line) {
    title = 'Shape';
    body = <ShapeProps obj={obj} />;
  } else if (obj) {
    title = oyn(obj).kind === 'icon' ? 'Symbol' : 'Element';
  }

  return (
    <aside className="props">
      {selection.length === 0 && <LabelProps />}
      {selection.length > 1 && (
        <>
          <div className="section-title">{selection.length} elements selected</div>
          <p className="muted">Use the toolbar to align, move or delete the selected elements.</p>
        </>
      )}
      {obj && (
        <>
          <div className="section-title">{title}</div>
          {body}
          <div className="section-title" style={{ marginTop: 16 }}>
            Position
          </div>
          <GeometryFields obj={obj} />
        </>
      )}
    </aside>
  );
}
