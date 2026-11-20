import { useMemo } from 'react';
import { compatibleLabels, editorSize, hasConfirmedLabels, labelName, physicalSize, type LabelProduct } from '../../printer/labels';
import type { PrinterModel } from '../../printer/models';
import { rollLabel, rollStore, type LoadedRoll } from '../state/roll';
import { t } from '../i18n';
import type { MessageKey } from '../../i18n/translate';

const TYPE_SHORT: Record<number, MessageKey> = {
  2: 'roll.type.blackMark',
  3: 'roll.type.continuous',
  4: 'roll.type.perforated',
  5: 'roll.type.transparent',
  6: 'roll.type.pvcTag',
  10: 'roll.type.blackMarkGap',
  11: 'roll.type.heatShrinkTube',
};

/** Where the size of the loaded roll comes from. Each read gives the text in the current language. */
export const SOURCE_TEXT: Readonly<Record<LoadedRoll['source'], string>> = {
  get printer() {
    return t('roll.source.printer');
  },
  get remembered() {
    return t('roll.source.remembered');
  },
  get catalogue() {
    return t('roll.source.catalogue');
  },
  get unknown() {
    return t('roll.source.unknown');
  },
};

export function productLabel(l: LabelProduct): string {
  const type = TYPE_SHORT[l.type];
  return type ? `${labelName(l)} · ${t(type)}` : labelName(l);
}

const near = (a: number, b: number) => Math.abs(a - b) < 0.3;

export interface PickedLabel {
  widthMm: number;
  heightMm: number;
  labelType?: number;
}

/**
 * Drop-down list of the NIIMBOT rolls that suit a printer model, with the
 * roll that is loaded in the printer at the top.
 */
export function LabelPicker(props: {
  model: PrinterModel;
  widthMm: number;
  heightMm: number;
  labelType?: number;
  onPick: (p: PickedLabel) => void;
}) {
  const { roll } = rollStore.use();
  const labels = useMemo(() => compatibleLabels(props.model), [props.model]);
  const confirmed = useMemo(() => hasConfirmedLabels(props.model), [props.model]);
  const phys = physicalSize(props.widthMm, props.heightMm, props.model);
  const rollSize = roll?.widthMm && roll.lengthMm ? editorSize(roll.widthMm, roll.lengthMm, props.model) : undefined;

  let value = 'custom';
  if (rollSize && near(rollSize.widthMm, props.widthMm) && near(rollSize.heightMm, props.heightMm)) value = 'roll';
  else {
    const exact = labels.findIndex((l) => near(l.widthMm, phys.widthMm) && near(l.lengthMm, phys.lengthMm) && (props.labelType === undefined || l.type === props.labelType));
    const any = exact >= 0 ? exact : labels.findIndex((l) => near(l.widthMm, phys.widthMm) && near(l.lengthMm, phys.lengthMm));
    if (any >= 0) value = `cat:${any}`;
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === 'roll' && roll && rollSize) props.onPick({ ...rollSize, labelType: roll.labelType });
        else if (v.startsWith('cat:')) {
          const l = labels[Number(v.slice(4))];
          if (l) props.onPick({ ...editorSize(l.widthMm, l.lengthMm, props.model), labelType: l.type });
        }
      }}
    >
      {roll && rollSize && (
        <optgroup label={t('roll.loaded')}>
          <option value="roll">
            {rollLabel(roll)} ({SOURCE_TEXT[roll.source]})
          </option>
        </optgroup>
      )}
      {labels.length > 0 && (
        <optgroup label={confirmed ? t('roll.forModel', { model: props.model.name }) : t('roll.fitModel', { model: props.model.name })}>
          {labels.map((l, i) => (
            <option key={i} value={`cat:${i}`}>
              {productLabel(l)}
            </option>
          ))}
        </optgroup>
      )}
      <option value="custom">{t('roll.custom')}</option>
    </select>
  );
}
