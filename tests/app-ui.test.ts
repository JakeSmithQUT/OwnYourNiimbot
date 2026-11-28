import { describe, expect, it } from 'vitest';
import { NAV } from '../src/renderer/nav';
import { fitInside } from '../src/renderer/editor/imageFit';
import { clampLabelSize, isNewLabelKey, newLabelCornerRadius, newLabelDefaults } from '../src/renderer/state/newLabel';
import { LabelType } from '../src/printer/protocol';

describe('navigation rail', () => {
  it('lists Design, Labels, Templates, Data, Printer and History from top to bottom', () => {
    expect(NAV.map((n) => n.label)).toEqual(['app.nav.design', 'app.nav.labels', 'app.nav.templates', 'app.nav.data', 'app.nav.printer', 'app.nav.history']);
    // The Labels page is the "templates" view and the Templates page is the "library" view.
    expect(NAV.map((n) => n.view)).toEqual(['design', 'templates', 'library', 'data', 'printer', 'history']);
  });
});

describe('replacement image size', () => {
  it('fits the image inside the box and keeps its aspect ratio', () => {
    // A wide picture in a square box uses the full width.
    expect(fitInside(200, 200, 400, 100)).toEqual({ width: 200, height: 50 });
    // A tall picture in a wide box uses the full height.
    expect(fitInside(300, 100, 50, 200)).toEqual({ width: 25, height: 100 });
    // A small picture is made larger to fill the box.
    expect(fitInside(300, 150, 30, 15)).toEqual({ width: 300, height: 150 });
  });

  it('fills the box when the image has no size', () => {
    expect(fitInside(120, 80, 0, 0)).toEqual({ width: 120, height: 80 });
    expect(fitInside(120, 80, Number.NaN, 50)).toEqual({ width: 120, height: 80 });
  });
});

describe('new label', () => {
  const last = { widthMm: 40, heightMm: 30, labelType: LabelType.Transparent, cornerRadiusMm: 15 };
  const roll = { widthMm: 50, heightMm: 30, labelType: LabelType.Gap };

  it('starts with the size and type of the last label', () => {
    expect(newLabelDefaults(last, undefined, true)).toEqual({ widthMm: 40, heightMm: 30, labelType: LabelType.Transparent });
  });

  it('starts with the roll in the printer when new labels take the roll size', () => {
    expect(newLabelDefaults(last, roll, true)).toEqual({ widthMm: 50, heightMm: 30, labelType: LabelType.Gap });
    // A roll without a known type keeps the type of the last label.
    expect(newLabelDefaults(last, { widthMm: 50, heightMm: 30 }, true).labelType).toBe(LabelType.Transparent);
    // With the setting off, the roll does not change the first values.
    expect(newLabelDefaults(last, roll, false)).toEqual({ widthMm: 40, heightMm: 30, labelType: LabelType.Transparent });
  });

  it('keeps the corners of the last label only for the same size', () => {
    expect(newLabelCornerRadius(last, 40, 30)).toBe(15);
    expect(newLabelCornerRadius(last, 40.1, 30)).toBe(15);
    expect(newLabelCornerRadius(last, 50, 30)).toBeUndefined();
  });

  it('keeps a new label size inside the label file limits', () => {
    expect(clampLabelSize(40.04, 30)).toEqual({ widthMm: 40, heightMm: 30 });
    // A saved roll that another program changed must not give a huge canvas.
    expect(clampLabelSize(1e9, 1e9)).toEqual({ widthMm: 300, heightMm: 500 });
    expect(clampLabelSize(Number.NaN, -5)).toEqual({ widthMm: 5, heightMm: 5 });
  });

  it('opens with Ctrl+N or Cmd+N', () => {
    const key = (k: Partial<KeyboardEvent>) => ({ key: 'n', code: 'KeyN', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...k });
    expect(isNewLabelKey(key({ ctrlKey: true }))).toBe(true);
    expect(isNewLabelKey(key({ metaKey: true }))).toBe(true);
    expect(isNewLabelKey(key({ ctrlKey: true, key: 'N' }))).toBe(true);
    // A Cyrillic layout gives another letter on the N key.
    expect(isNewLabelKey(key({ ctrlKey: true, key: 'т' }))).toBe(true);
    expect(isNewLabelKey(key({}))).toBe(false);
    expect(isNewLabelKey(key({ ctrlKey: true, shiftKey: true }))).toBe(false);
    // AltGr on Windows sets Ctrl and Alt.
    expect(isNewLabelKey(key({ ctrlKey: true, altKey: true }))).toBe(false);
    // On a layout where another Latin letter is on that key, only the letter N counts.
    expect(isNewLabelKey(key({ ctrlKey: true, key: 'b' }))).toBe(false);
  });
});
