import { useState } from 'react';
import { FilePlus2, Save } from 'lucide-react';
import { appStore, newTemplate, saveTemplate, toast } from '../state/app';
import { newLabelCornerRadius, newLabelDefaults } from '../state/newLabel';
import { activeModel, usePrinter } from '../state/printer';
import { rollEditorSize, rollStore } from '../state/roll';
import { editor } from '../editor/EditorController';
import { LABEL_TYPE_NAMES, labelTypeName } from '../../printer/protocol';
import { LabelPicker } from './LabelPicker';
import { Field, Modal, NumberInput } from './ui';
import { t } from '../i18n';

const near = (a: number, b: number) => Math.abs(a - b) < 0.3;

const close = () => appStore.set({ newLabel: undefined });

/** Asks to save the changes of the open label before the app makes a new label. */
function SaveFirstDialog() {
  const { template } = appStore.use();
  const [busy, setBusy] = useState(false);
  const next = () => appStore.set({ newLabel: 'size' });
  const save = async () => {
    setBusy(true);
    try {
      await saveTemplate();
      next();
    } catch (err) {
      toast((err as Error).message, 'error');
      setBusy(false);
    }
  };
  return (
    <Modal
      title={t('labels.new.saveTitle')}
      icon={<Save size={18} />}
      onClose={close}
      footer={
        <>
          <button className="btn" onClick={close}>
            {t('common.cancel')}
          </button>
          <button className="btn" onClick={next}>
            {t('labels.new.dontSave')}
          </button>
          <button className="btn primary" autoFocus disabled={busy} onClick={() => void save()}>
            {t('common.save')}
          </button>
        </>
      }
    >
      <p style={{ margin: 0 }}>{t('labels.new.saveText', { name: template.name })}</p>
    </Modal>
  );
}

/**
 * Asks for the size and type of the new label. It starts with the size and
 * type of the last label, or with the roll in the printer when new labels take
 * the roll size.
 */
function SizeDialog() {
  usePrinter();
  const model = activeModel();
  const { roll } = rollStore.use();
  // The values of the open label when the dialog opens. The editor has the size while the design view is open.
  const [last] = useState(() => {
    const { template } = appStore.get();
    const live = Boolean(editor.canvas);
    return {
      widthMm: live ? editor.widthMm : template.widthMm,
      heightMm: live ? editor.heightMm : template.heightMm,
      labelType: template.labelType,
      cornerRadiusMm: template.cornerRadiusMm,
    };
  });
  const [start] = useState(() => {
    const r = rollStore.get().roll;
    const size = r ? rollEditorSize(r) : undefined;
    return newLabelDefaults(last, size && { ...size, labelType: r?.labelType }, appStore.get().settings.autoLabelSize);
  });
  const [w, setW] = useState(start.widthMm);
  const [h, setH] = useState(start.heightMm);
  const [labelType, setLabelType] = useState(start.labelType);
  const rollSize = roll ? rollEditorSize(roll) : undefined;
  const rollChosen = Boolean(rollSize && near(rollSize.widthMm, w) && near(rollSize.heightMm, h));

  const create = async () => {
    await newTemplate(w, h, labelType, newLabelCornerRadius(last, w, h));
    // The design view no longer needs to offer the roll size when the new label has it.
    const { suggestion } = rollStore.get();
    const offered = suggestion ? rollEditorSize(suggestion) : undefined;
    if (offered && near(offered.widthMm, w) && near(offered.heightMm, h)) rollStore.set({ suggestion: undefined });
    close();
  };

  return (
    <Modal
      title={t('labels.new.title')}
      icon={<FilePlus2 size={18} />}
      onClose={close}
      footer={
        <>
          <button className="btn" onClick={close}>
            {t('common.cancel')}
          </button>
          <button className="btn primary" autoFocus onClick={() => void create()}>
            {t('labels.new.create')}
          </button>
        </>
      }
    >
      <Field label={t('labels.new.roll', { model: model.name })} hint={rollChosen ? t('labels.new.rollSelected') : undefined}>
        <LabelPicker
          model={model}
          widthMm={w}
          heightMm={h}
          labelType={labelType}
          onPick={(p) => {
            setW(p.widthMm);
            setH(p.heightMm);
            if (p.labelType !== undefined) setLabelType(p.labelType);
          }}
        />
      </Field>
      <div className="field-row">
        <Field label={t('labels.new.width')}>
          <NumberInput unit="mm" min={5} max={300} value={w} onChange={setW} />
        </Field>
        <Field label={t('labels.new.height')}>
          <NumberInput unit="mm" min={5} max={500} value={h} onChange={setH} />
        </Field>
      </div>
      <Field label={t('props.label.type')}>
        <select value={labelType} onChange={(e) => setLabelType(Number(e.target.value))}>
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
    </Modal>
  );
}

/** The steps of a new label. requestNewLabel() in state/app.ts opens them. */
export function NewLabelDialog() {
  const { newLabel } = appStore.use();
  if (newLabel === 'save') return <SaveFirstDialog />;
  if (newLabel === 'size') return <SizeDialog />;
  return null;
}
