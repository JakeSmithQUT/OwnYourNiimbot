import { LabelType } from '../../printer/protocol';

export interface Dataset {
  name: string;
  columns: string[];
  rows: string[][];
}

export interface LabelTemplate {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  cornerRadiusMm: number;
  labelType: number;
  modelName?: string;
  /** Fabric.js canvas JSON. */
  canvas: { objects?: unknown[]; [key: string]: unknown };
  dataset?: Dataset;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

export interface LabelSize {
  widthMm: number;
  heightMm: number;
  labelType?: number;
  note?: string;
}

/** Common label sizes. Width is across the print head for wide printers and along the label for narrow ones. */
export const LABEL_PRESETS: { group: string; sizes: LabelSize[] }[] = [
  {
    group: 'D11, D110, D101, H1, B18 (narrow)',
    sizes: [
      { widthMm: 22, heightMm: 12 },
      { widthMm: 30, heightMm: 12 },
      { widthMm: 40, heightMm: 12 },
      { widthMm: 30, heightMm: 14 },
      { widthMm: 30, heightMm: 15 },
      { widthMm: 40, heightMm: 15 },
      { widthMm: 50, heightMm: 15 },
      { widthMm: 75, heightMm: 12 },
      { widthMm: 109, heightMm: 12.5, note: 'Cable label' },
      { widthMm: 40, heightMm: 24 },
      { widthMm: 50, heightMm: 25 },
      { widthMm: 60, heightMm: 12, labelType: LabelType.Continuous, note: 'Continuous' },
    ],
  },
  {
    group: 'B1, B21, B3S, B2 (up to 50 mm)',
    sizes: [
      { widthMm: 25, heightMm: 15 },
      { widthMm: 30, heightMm: 15 },
      { widthMm: 30, heightMm: 20 },
      { widthMm: 40, heightMm: 20 },
      { widthMm: 40, heightMm: 30 },
      { widthMm: 40, heightMm: 40 },
      { widthMm: 40, heightMm: 60 },
      { widthMm: 50, heightMm: 15 },
      { widthMm: 50, heightMm: 20 },
      { widthMm: 50, heightMm: 30 },
      { widthMm: 50, heightMm: 40 },
      { widthMm: 50, heightMm: 50 },
      { widthMm: 50, heightMm: 70 },
      { widthMm: 50, heightMm: 80 },
      { widthMm: 30, heightMm: 30, note: 'Round' },
      { widthMm: 50, heightMm: 30, labelType: LabelType.Transparent, note: 'Transparent' },
    ],
  },
  {
    group: 'B3S, B31, B32, K3, M3 (up to 80 mm)',
    sizes: [
      { widthMm: 60, heightMm: 40 },
      { widthMm: 70, heightMm: 50 },
      { widthMm: 75, heightMm: 50 },
      { widthMm: 80, heightMm: 50 },
      { widthMm: 75, heightMm: 100 },
    ],
  },
  {
    group: 'B4, K4 (up to 104 mm)',
    sizes: [
      { widthMm: 100, heightMm: 50 },
      { widthMm: 100, heightMm: 100 },
      { widthMm: 100, heightMm: 150, note: 'Shipping label' },
    ],
  },
];

export function sizeLabel(s: LabelSize): string {
  return `${s.widthMm} × ${s.heightMm} mm${s.note ? ` (${s.note})` : ''}`;
}

export function emptyTemplate(widthMm = 50, heightMm = 30, labelType: number = LabelType.Gap): LabelTemplate {
  const now = Date.now();
  return {
    id: '',
    name: 'Untitled label',
    widthMm,
    heightMm,
    cornerRadiusMm: 1.5,
    labelType,
    canvas: { version: '6', objects: [] },
    createdAt: now,
    updatedAt: now,
  };
}
