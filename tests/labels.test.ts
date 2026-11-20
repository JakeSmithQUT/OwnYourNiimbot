import { describe, expect, it } from 'vitest';
import { compatibleLabels, editorSize, findLabelByBarcode, hasConfirmedLabels, LABELS, physicalSize } from '../src/printer/labels';
import { findModelByName, MODELS } from '../src/printer/models';

const model = (name: string) => {
  const m = findModelByName(name);
  if (!m) throw new Error(`No model ${name}`);
  return m;
};

const has = (name: string, w: number, l: number) => compatibleLabels(model(name)).some((r) => r.widthMm === w && r.lengthMm === l);

describe('label catalogue', () => {
  it('names only series and models that exist', () => {
    const known = new Set([...MODELS.map((m) => m.series), ...MODELS.map((m) => m.name)]);
    for (const l of LABELS) for (const s of l.series) expect(known, `${s} in ${l.widthMm}x${l.lengthMm}`).toContain(s);
  });

  it('links each barcode to one roll only', () => {
    const seen = new Map<string, string>();
    for (const l of LABELS) {
      for (const b of l.barcodes ?? []) {
        expect(seen.has(b), b).toBe(false);
        seen.set(b, `${l.widthMm}x${l.lengthMm}`);
      }
    }
  });

  it('lists rolls for every NIIMBOT protocol model that takes labels', () => {
    // Card and tube printers take PVC tags and tube only. No roll sizes are sourced for them.
    const empty = MODELS.filter((m) => m.protocol === 'niimbot' && compatibleLabels(m).length === 0).map((m) => m.name);
    expect(empty.sort()).toEqual(['P1', 'P18', 'P1S']);
  });

  it('marks models without sourced rolls', () => {
    expect(hasConfirmedLabels(model('B1'))).toBe(true);
    expect(hasConfirmedLabels(model('C1'))).toBe(false);
  });

  it('gives each printer family its own rolls', () => {
    expect(has('D110', 12, 40)).toBe(true);
    expect(has('D110', 50, 30)).toBe(false);
    expect(has('B1', 50, 30)).toBe(true);
    expect(has('B1', 12, 40)).toBe(false);
    expect(has('B3S', 70, 100)).toBe(true);
    expect(has('D101', 25, 60)).toBe(true);
    expect(has('B4', 100, 150)).toBe(true);
  });

  it('leaves out label types that a model cannot use', () => {
    // The A1 Pro takes continuous and perforated media only.
    for (const l of compatibleLabels(model('A1 Pro'))) expect([3, 4]).toContain(l.type);
  });

  it('finds a roll by its RFID barcode', () => {
    expect(findLabelByBarcode('6972842743589')).toMatchObject({ widthMm: 15, lengthMm: 30 });
    expect(findLabelByBarcode('0000000000000')).toBeUndefined();
  });

  it('turns the label on screen for printers that feed sideways', () => {
    expect(editorSize(12, 40, model('D110'))).toEqual({ widthMm: 40, heightMm: 12 });
    expect(editorSize(50, 30, model('B1'))).toEqual({ widthMm: 50, heightMm: 30 });
    expect(physicalSize(40, 12, model('D110'))).toEqual({ widthMm: 12, lengthMm: 40 });
  });
});
