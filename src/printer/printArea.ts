// The part of a label that the print head can reach. The print image is
// turned for printers that feed the label sideways and is then cropped to the
// print head width (see rotateMono and fitToPrinthead in encoder.ts). This
// file gives the same area in label coordinates, as the label shows on screen.

import { isRotated, pixelsPerMm, printheadDots, type PrinterModel } from './models';

export interface PrintArea {
  /** Printable rectangle in millimetres, from the top-left corner of the label as it shows on screen. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** True when part of the label is outside the print head and does not print. */
  clipped: boolean;
  /** Width of the print head in millimetres. */
  headMm: number;
  /** True when the label edge across the print head is its height (the label is fed sideways). */
  sideways: boolean;
}

/** The printable area of a label on a printer model. `flip180` is the "Turn the print 180°" option. */
export function printArea(widthMm: number, heightMm: number, model: PrinterModel, flip180 = false): PrintArea {
  const dpm = pixelsPerMm(model.dpi);
  const head = printheadDots(model);
  const headMm = head / dpm;
  const rotation = (((isRotated(model) ? model.printDirection : 0) + (flip180 ? 180 : 0)) % 360 + 360) % 360;
  const sideways = rotation === 90 || rotation === 270;
  const acrossDots = Math.round((sideways ? heightMm : widthMm) * dpm);
  if (acrossDots <= head) return { x: 0, y: 0, width: widthMm, height: heightMm, clipped: false, headMm, sideways };

  // The columns that fitToPrinthead keeps, in the turned image.
  const start = model.align === 'left' ? 0 : model.align === 'right' ? acrossDots - head : Math.floor((acrossDots - head) / 2);
  // Turning by 90 or 180 degrees reverses the order of the columns against the label.
  const reversed = rotation === 90 || rotation === 180;
  const offset = (reversed ? acrossDots - start - head : start) / dpm;
  return sideways
    ? { x: 0, y: offset, width: widthMm, height: headMm, clipped: true, headMm, sideways }
    : { x: offset, y: 0, width: headMm, height: heightMm, clipped: true, headMm, sideways };
}

/** True when a rectangle (millimetres) goes outside the printable area by more than `toleranceMm`. */
export function outsideArea(r: { x: number; y: number; width: number; height: number }, a: PrintArea, toleranceMm = 0.2): boolean {
  if (!a.clipped) return false;
  return r.x < a.x - toleranceMm || r.y < a.y - toleranceMm || r.x + r.width > a.x + a.width + toleranceMm || r.y + r.height > a.y + a.height + toleranceMm;
}
