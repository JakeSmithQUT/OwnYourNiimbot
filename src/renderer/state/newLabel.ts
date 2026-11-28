// Rules for a new label from the New label dialog. This file has no
// dependency on the editor, so that the tests can use it.

import type { LabelTemplate } from '../editor/template';
import { LIMITS } from '../editor/validate';

export interface NewLabelSettings {
  widthMm: number;
  heightMm: number;
  labelType: number;
}

/** The size of the roll in the printer, in editor orientation. */
export interface RollSize {
  widthMm: number;
  heightMm: number;
  labelType?: number;
}

const near = (a: number, b: number) => Math.abs(a - b) < 0.3;

/**
 * A label size inside the limits of label files, to 0.1 mm. The size can come
 * from the printer or a saved roll, so every new or changed size goes through this.
 */
export function clampLabelSize(widthMm: number, heightMm: number): { widthMm: number; heightMm: number } {
  const clamp = (v: number, max: number) => Math.round(Math.min(max, Math.max(LIMITS.minMm, Number.isFinite(v) ? v : LIMITS.minMm)) * 10) / 10;
  return { widthMm: clamp(widthMm, LIMITS.maxWidthMm), heightMm: clamp(heightMm, LIMITS.maxHeightMm) };
}

/**
 * The first values of the New label dialog. They are the size and type of the
 * last label, or the size and type of the roll in the printer when the
 * setting "Give a new, empty label the size of the roll in the printer" is on.
 */
export function newLabelDefaults(last: Pick<LabelTemplate, 'widthMm' | 'heightMm' | 'labelType'>, roll: RollSize | undefined, useRollSize: boolean): NewLabelSettings {
  if (useRollSize && roll) return { widthMm: roll.widthMm, heightMm: roll.heightMm, labelType: roll.labelType ?? last.labelType };
  return { widthMm: last.widthMm, heightMm: last.heightMm, labelType: last.labelType };
}

/**
 * The corner radius of the new label. A new label with the same size as the
 * last label keeps its corners, for example the circle of a round label.
 * Undefined gives the default radius.
 */
export function newLabelCornerRadius(last: Pick<LabelTemplate, 'widthMm' | 'heightMm' | 'cornerRadiusMm'>, widthMm: number, heightMm: number): number | undefined {
  return near(last.widthMm, widthMm) && near(last.heightMm, heightMm) ? last.cornerRadiusMm : undefined;
}

/**
 * True for Ctrl+N, or Cmd+N on macOS. A keyboard layout without Latin letters
 * gives another key, so the position of the N key counts too.
 */
export function isNewLabelKey(e: Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>): boolean {
  if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return false;
  const key = e.key.toLowerCase();
  return key === 'n' || (!/^[a-z]$/.test(key) && e.code === 'KeyN');
}
