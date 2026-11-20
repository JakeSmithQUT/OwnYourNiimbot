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
import { LABEL_TYPE_NAMES, labelTypeName } from '../../printer/protocol';
import { Check, Field, NumberInput, Segmented, TextInput } from './ui';
import { t, tn } from '../i18n';
import type { MessageKey } from '../../i18n/translate';

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
      <optgroup label={t('props.font.bundled')}>
        {BUNDLED_FONTS.map((f) => (
          <option key={f.family} value={f.family} style={{ fontFamily: `"${f.family}"` }}>
            {f.family} · {f.style.toLowerCase()}
          </option>
        ))}
      </optgroup>
      <optgroup label={t('props.font.system')}>
        {system.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

/** Names of the built-in data fields in the field menu. The inserted token stays the same in every language. */
const BUILT_IN_FIELDS: Record<string, MessageKey> = {
  date: 'props.field.date',
  time: 'props.field.time',
  index: 'props.field.index',
};

function FieldInsert(props: { onInsert: (token: string) => void }) {
  const { dataset } = appStore.use();
  const options = [...(dataset?.columns ?? []), ...Object.keys(BUILT_IN_FIELDS)];
  return (
    <select
      value=""
      onChange={(e) => {
        if (e.target.value) props.onInsert(`{{${e.target.value}}}`);
      }}
    >
      <option value="">{t('props.field.insert')}</option>
      {dataset?.columns.length ? (
        <optgroup label={t('props.field.columns', { name: dataset.name })}>
          {dataset.columns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </optgroup>
      ) : null}
      <optgroup label={t('props.field.builtIn')}>
        {options.slice(dataset?.columns.length ?? 0).map((c) => (
          <option key={c} value={c}>
            {t(BUILT_IN_FIELDS[c])}
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
          <Field label={t('props.width')}>
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
            <Field label={t('props.height')}>
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
      <Field label={t('props.rotation')}>
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
          <Field label={t('props.dateFormat')}>
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
          <Field label={t('props.addDays')} hint={t('props.addDaysHint')}>
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
          <Field label={t('props.text')}>
            <TextInput multiline value={obj.text ?? ''} onChange={(v) => set({ text: v })} />
          </Field>
          <div className="field">
            <FieldInsert onInsert={(token) => set({ text: `${obj.text ?? ''}${token}` })} />
          </div>
        </>
      )}
      <Field label={t('props.font')}>
        <FontSelect value={obj.fontFamily ?? 'Arial'} fonts={fonts} onChange={(f) => set({ fontFamily: f })} />
      </Field>
      <div className="field-row">
        <Field label={t('props.size')}>
          <NumberInput unit="pt" min={2} max={400} value={unitsToPt(obj.fontSize ?? 12)} onChange={(v) => set({ fontSize: ptToUnits(v) })} />
        </Field>
        <Field label={t('props.lineSpacing')}>
          <NumberInput min={0.5} max={4} step={0.05} decimals={2} value={obj.lineHeight ?? 1.1} onChange={(v) => set({ lineHeight: v })} />
        </Field>
      </div>
      <div className="field">
        <label>{t('props.style')}</label>
        <div className="btn-row">
          <div className="seg">
            <button className={obj.fontWeight === 'bold' ? 'on' : ''} title={t('props.bold')} onClick={() => set({ fontWeight: obj.fontWeight === 'bold' ? 'normal' : 'bold' })}>
              <Bold size={15} />
            </button>
            <button className={obj.fontStyle === 'italic' ? 'on' : ''} title={t('props.italic')} onClick={() => set({ fontStyle: obj.fontStyle === 'italic' ? 'normal' : 'italic' })}>
              <Italic size={15} />
            </button>
            <button className={obj.underline ? 'on' : ''} title={t('props.underline')} onClick={() => set({ underline: !obj.underline })}>
              <Underline size={15} />
            </button>
            <button className={obj.linethrough ? 'on' : ''} title={t('props.strikethrough')} onClick={() => set({ linethrough: !obj.linethrough })}>
              <Strikethrough size={15} />
            </button>
          </div>
          <Segmented
            value={obj.textAlign ?? 'left'}
            options={[
              { value: 'left', label: <AlignLeft size={15} />, title: t('props.align.left') },
              { value: 'center', label: <AlignCenter size={15} />, title: t('props.align.centre') },
              { value: 'right', label: <AlignRight size={15} />, title: t('props.align.right') },
              { value: 'justify', label: <AlignJustify size={15} />, title: t('props.align.justify') },
            ]}
            onChange={(v) => set({ textAlign: v })}
          />
        </div>
      </div>
      <Field label={t('props.letterSpacing')}>
        <input type="range" min={-100} max={800} step={10} value={obj.charSpacing ?? 0} onChange={(e) => set({ charSpacing: Number(e.target.value) })} />
      </Field>
      <Check checked={inverted} onChange={(v) => set(v ? { backgroundColor: '#000000', fill: '#ffffff' } : { backgroundColor: '', fill: '#000000' })}>
        {t('props.inverted')}
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
        <Field label={t('props.serial.prefix')}>
          <TextInput value={s.prefix} onChange={(v) => set({ prefix: v })} />
        </Field>
        <Field label={t('props.serial.suffix')}>
          <TextInput value={s.suffix} onChange={(v) => set({ suffix: v })} />
        </Field>
      </div>
      <div className="field-row three">
        <Field label={t('props.serial.start')}>
          <NumberInput value={s.start} step={1} decimals={0} onChange={(v) => set({ start: Math.round(v) })} />
        </Field>
        <Field label={t('props.serial.step')}>
          <NumberInput value={s.step} step={1} decimals={0} onChange={(v) => set({ step: Math.round(v) })} />
        </Field>
        <Field label={t('props.serial.digits')}>
          <NumberInput value={s.digits} min={1} max={12} step={1} decimals={0} onChange={(v) => set({ digits: Math.round(v) })} />
        </Field>
      </div>
      <p className="muted">{t('props.serial.example', { first: formatSerial(s, 0), second: formatSerial(s, 1), third: formatSerial(s, 2) })}</p>
    </>
  );
}

function BarcodeProps({ obj }: { obj: LabelBarcode }) {
  const set = (props: Record<string, unknown>) => editor.update(obj, props);
  const fmt = barcodeFormat(obj.format);
  const error = obj.error;
  return (
    <>
      <Field label={t('props.barcode.type')}>
        <select
          value={obj.format}
          onChange={(e) => {
            const next = barcodeFormat(e.target.value);
            set({ format: next.id, showText: next.twoD ? false : obj.showText, value: next.twoD === fmt.twoD && !obj.error ? obj.value : next.sample });
          }}
        >
          <optgroup label={t('props.barcode.linear')}>
            {BARCODE_FORMATS.filter((f) => !f.twoD).map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </optgroup>
          <optgroup label={t('props.barcode.twoD')}>
            {BARCODE_FORMATS.filter((f) => f.twoD).map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </optgroup>
        </select>
      </Field>
      <Field label={t('props.barcode.content')}>
        <TextInput multiline={fmt.twoD} value={obj.value} onChange={(v) => set({ value: v })} />
      </Field>
      <div className="field">
        <FieldInsert onInsert={(token) => set({ value: `${obj.value}${token}` })} />
      </div>
      {error && !/\{\{/.test(obj.value) && <div className="notice error">{error}</div>}
      {obj.format === 'qrcode' && (
        <Field label={t('props.barcode.errorCorrection')}>
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
            {t('props.barcode.showText')}
          </Check>
          {obj.showText && (
            <Field label={t('props.textSize')}>
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
  if (!data.original) return <p className="muted">{t('props.image.noSource')}</p>;
  return (
    <>
      <Field label={t('props.image.mode')}>
        <select value={settings.mode} onChange={(e) => void apply({ mode: e.target.value as ImageMode })}>
          <option value="floyd">{t('props.image.mode.floyd')}</option>
          <option value="atkinson">{t('props.image.mode.atkinson')}</option>
          <option value="threshold">{t('props.image.mode.threshold')}</option>
          <option value="grey">{t('props.image.mode.grey')}</option>
        </select>
      </Field>
      <Field label={t('props.image.threshold', { value: settings.threshold })}>
        <input type="range" min={10} max={245} value={settings.threshold} onChange={(e) => setSettings({ ...settings, threshold: Number(e.target.value) })} onMouseUp={() => void apply({})} />
      </Field>
      <Field label={t('props.image.brightness', { value: settings.brightness })}>
        <input type="range" min={-100} max={100} value={settings.brightness} onChange={(e) => setSettings({ ...settings, brightness: Number(e.target.value) })} onMouseUp={() => void apply({})} />
      </Field>
      <Field label={t('props.image.contrast', { value: settings.contrast })}>
        <input type="range" min={-100} max={100} value={settings.contrast} onChange={(e) => setSettings({ ...settings, contrast: Number(e.target.value) })} onMouseUp={() => void apply({})} />
      </Field>
      <Check checked={settings.invert} onChange={(v) => void apply({ invert: v })}>
        {t('props.image.invert')}
      </Check>
      {busy && <p className="muted">{t('props.image.processing')}</p>}
    </>
  );
}

function ShapeProps({ obj }: { obj: FabricObject }) {
  const set = (props: Record<string, unknown>) => editor.update(obj, props);
  const filled = obj.fill === '#000000';
  const dashed = Array.isArray(obj.strokeDashArray) && obj.strokeDashArray.length > 0;
  return (
    <>
      <Field label={t('props.lineWidth')}>
        <NumberInput unit="mm" min={0.1} max={10} value={unitsToMm(obj.strokeWidth ?? 0)} onChange={(v) => set({ strokeWidth: mmToUnits(v) })} />
      </Field>
      {!(obj instanceof Line) && (
        <Check checked={filled} onChange={(v) => set({ fill: v ? '#000000' : 'transparent' })}>
          {t('props.shape.fill')}
        </Check>
      )}
      <Check checked={dashed} onChange={(v) => set({ strokeDashArray: v ? [mmToUnits(1.2), mmToUnits(0.8)] : null })}>
        {t('props.shape.dashed')}
      </Check>
      {obj instanceof Rect && (
        <Field label={t('props.shape.cornerRadius')}>
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
        <Field label={t('props.table.rows')}>
          <NumberInput value={obj.rows} min={1} max={30} step={1} decimals={0} onChange={(v) => {
            obj.resize(v, obj.cols);
            set({});
          }} />
        </Field>
        <Field label={t('props.table.columns')}>
          <NumberInput value={obj.cols} min={1} max={12} step={1} decimals={0} onChange={(v) => {
            obj.resize(obj.rows, v);
            set({});
          }} />
        </Field>
      </div>
      <div className="field">
        <label>{t('props.table.cells')}</label>
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
      <Field label={t('props.font')}>
        <FontSelect value={obj.fontFamily} fonts={fonts} onChange={(f) => set({ fontFamily: f })} />
      </Field>
      <div className="field-row">
        <Field label={t('props.textSize')}>
          <NumberInput unit="pt" min={2} max={100} value={unitsToPt(obj.fontSize)} onChange={(v) => set({ fontSize: ptToUnits(v) })} />
        </Field>
        <Field label={t('props.lineWidth')}>
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
          {t('props.bold')}
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
      <div className="section-title">{t('props.label')}</div>
      <Field label={t('props.label.roll')}>
        <LabelPicker model={model} widthMm={editor.widthMm} heightMm={editor.heightMm} labelType={template.labelType} onPick={(p) => setSize(p.widthMm, p.heightMm, p.labelType)} />
      </Field>
      {roll && roll.source === 'unknown' && roll.barcode && (
        <div className="notice">
          <div>
            {t('props.label.unknownRoll', { barcode: roll.barcode })}
            <div style={{ marginTop: 8 }}>
              <button
                className="btn small"
                onClick={() => {
                  const phys = physicalSize(editor.widthMm, editor.heightMm, model);
                  void rememberRoll(roll.barcode!, phys.widthMm, phys.lengthMm, template.labelType).then(() =>
                    toast(t('props.label.rollSaved', { width: editor.widthMm, height: editor.heightMm, barcode: roll.barcode! }), 'success'),
                  );
                }}
              >
                {t('props.label.saveRoll', { width: editor.widthMm, height: editor.heightMm })}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="field-row">
        <Field label={t('props.width')}>
          <NumberInput unit="mm" min={5} max={300} value={editor.widthMm} onChange={(v) => setSize(v, editor.heightMm)} />
        </Field>
        <Field label={t('props.height')}>
          <NumberInput unit="mm" min={5} max={500} value={editor.heightMm} onChange={(v) => setSize(editor.widthMm, v)} />
        </Field>
      </div>
      {area.clipped &&
        (outside.length ? (
          <div className="notice warn">
            <div>
              {t('props.label.clipped', {
                model: model.name,
                head: Number(area.headMm.toFixed(1)),
                size: Number((area.sideways ? editor.heightMm : editor.widthMm).toFixed(1)),
              })}{' '}
              {tn('props.label.outside', outside.length)}
              <div style={{ marginTop: 8 }}>
                <button className="btn small" onClick={() => editor.fitToArea(area)}>
                  {t('props.label.fit')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="muted print-area-hint">{t('props.label.printAreaHint', { model: model.name, head: Number(area.headMm.toFixed(1)) })}</p>
        ))}
      <Field label={t('props.label.type')}>
        <select value={template.labelType} onChange={(e) => setTemplate({ labelType: Number(e.target.value) })}>
          {Object.entries(LABEL_TYPE_NAMES).map(([k, v]) => {
            const name = labelTypeName(Number(k)) ?? v;
            const listed = !model.paperTypes.length || model.paperTypes.includes(Number(k));
            return (
              <option key={k} value={k}>
                {listed ? name : t('props.label.typeNotListed', { type: name })}
              </option>
            );
          })}
        </select>
      </Field>
      <Field label={t('props.label.cornerRadius')}>
        <NumberInput unit="mm" min={0} max={20} value={template.cornerRadiusMm} onChange={(v) => setTemplate({ cornerRadiusMm: v })} />
      </Field>
      <Field label={t('props.label.snapGrid')}>
        <NumberInput unit="mm" min={0.1} max={10} value={settings.gridMm} onChange={(v) => {
          editor.gridMm = v;
          appStore.set({ settings: { ...settings, gridMm: v } });
        }} />
      </Field>
      <p className="muted">{t('props.label.hint')}</p>
    </>
  );
}

export function PropertiesPanel() {
  useEditor();
  const selection = editor.selection;
  const obj = selection.length === 1 ? selection[0] : undefined;
  let title: MessageKey = 'props.title.element';
  let body: React.ReactNode = null;
  if (obj instanceof Textbox) {
    const kind = oyn(obj).kind;
    title = kind === 'datetime' ? 'props.title.dateTime' : kind === 'serial' ? 'props.title.serial' : 'props.title.text';
    body = <TextProps obj={obj} />;
  } else if (obj instanceof LabelBarcode) {
    title = barcodeFormat(obj.format).twoD ? 'props.title.code2d' : 'props.title.barcode';
    body = <BarcodeProps obj={obj} />;
  } else if (obj instanceof FabricImage) {
    title = 'props.title.image';
    body = <ImageProps obj={obj} />;
  } else if (obj instanceof LabelTable) {
    title = 'props.title.table';
    body = <TableProps obj={obj} />;
  } else if (obj instanceof Rect || obj instanceof Ellipse || obj instanceof Line) {
    title = 'props.title.shape';
    body = <ShapeProps obj={obj} />;
  } else if (obj) {
    title = oyn(obj).kind === 'icon' ? 'props.title.symbol' : 'props.title.element';
  }

  return (
    <aside className="props">
      {selection.length === 0 && <LabelProps />}
      {selection.length > 1 && (
        <>
          <div className="section-title">{tn('props.selected', selection.length)}</div>
          <p className="muted">{t('props.selectedHint')}</p>
        </>
      )}
      {obj && (
        <>
          <div className="section-title">{t(title)}</div>
          {body}
          <div className="section-title" style={{ marginTop: 16 }}>
            {t('props.title.position')}
          </div>
          <GeometryFields obj={obj} />
        </>
      )}
    </aside>
  );
}
