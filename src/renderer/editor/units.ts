/** Canvas units per millimetre. Object positions and sizes are stored in these units. */
export const UNITS_PER_MM = 10;

export const mmToUnits = (mm: number) => mm * UNITS_PER_MM;
export const unitsToMm = (u: number) => u / UNITS_PER_MM;

/** 1 pt = 0.3528 mm */
export const ptToUnits = (pt: number) => (pt * 25.4 * UNITS_PER_MM) / 72;
export const unitsToPt = (u: number) => (u * 72) / (25.4 * UNITS_PER_MM);

export const round = (v: number, step = 0.1) => Math.round(v / step) * step;
