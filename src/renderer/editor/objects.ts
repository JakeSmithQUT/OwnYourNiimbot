import { classRegistry, FabricObject, type FabricObjectProps } from 'fabric';
import { toCanvas } from 'bwip-js/browser';

// Fabric 7 changed the default origin to the centre of the object. The editor,
// the properties panel and saved labels use the top-left corner as the position.
FabricObject.ownDefaults.originX = 'left';
FabricObject.ownDefaults.originY = 'top';

export interface BarcodeFormat {
  id: string;
  label: string;
  twoD: boolean;
  sample: string;
}

export const BARCODE_FORMATS: BarcodeFormat[] = [
  { id: 'code128', label: 'Code 128', twoD: false, sample: 'ABC-12345' },
  { id: 'code39', label: 'Code 39', twoD: false, sample: 'ABC123' },
  { id: 'code93', label: 'Code 93', twoD: false, sample: 'ABC123' },
  { id: 'ean13', label: 'EAN-13', twoD: false, sample: '590123412345' },
  { id: 'ean8', label: 'EAN-8', twoD: false, sample: '9638507' },
  { id: 'upca', label: 'UPC-A', twoD: false, sample: '01234567890' },
  { id: 'upce', label: 'UPC-E', twoD: false, sample: '0123456' },
  { id: 'itf14', label: 'ITF-14', twoD: false, sample: '0461234567890' },
  { id: 'interleaved2of5', label: 'Interleaved 2 of 5', twoD: false, sample: '12345678' },
  { id: 'codabar', label: 'Codabar', twoD: false, sample: 'A12345B' },
  { id: 'gs1-128', label: 'GS1-128', twoD: false, sample: '(01)09521234543213(3103)000123' },
  { id: 'msi', label: 'MSI Plessey', twoD: false, sample: '1234567' },
  { id: 'qrcode', label: 'QR code', twoD: true, sample: 'https://example.com' },
  { id: 'datamatrix', label: 'Data Matrix', twoD: true, sample: 'ABC-12345' },
  { id: 'pdf417', label: 'PDF417', twoD: true, sample: 'ABC-12345' },
  { id: 'azteccode', label: 'Aztec', twoD: true, sample: 'ABC-12345' },
];

export function barcodeFormat(id: string): BarcodeFormat {
  return BARCODE_FORMATS.find((f) => f.id === id) ?? BARCODE_FORMATS[0];
}

interface BarsResult {
  canvas?: HTMLCanvasElement;
  error?: string;
}

const barsCache = new Map<string, BarsResult>();

/** Renders the symbol with one pixel per module. Results are cached by content. */
export function renderBars(format: string, value: string, eclevel: string): BarsResult {
  const key = `${format}\u0000${eclevel}\u0000${value}`;
  const cached = barsCache.get(key);
  if (cached) return cached;
  let result: BarsResult;
  if (!value) {
    result = { error: 'No value' };
  } else {
    try {
      const canvas = document.createElement('canvas');
      const twoD = barcodeFormat(format).twoD;
      const opts: Record<string, unknown> = {
        bcid: format,
        text: value,
        scale: 1,
        includetext: false,
        paddingwidth: 0,
        paddingheight: 0,
      };
      if (!twoD) opts.height = 2;
      if (format === 'qrcode') opts.eclevel = eclevel || 'M';
      if (format === 'gs1-128') opts.parse = true;
      toCanvas(canvas, opts as never);
      result = { canvas };
    } catch (err) {
      const msg = String((err as Error)?.message ?? err).replace(/^bwip-js:\s*/i, '');
      result = { error: msg.split(':').pop()?.trim() || 'Invalid value' };
    }
  }
  if (barsCache.size > 500) barsCache.clear();
  barsCache.set(key, result);
  return result;
}

/** Scale of the context transform along the x and y axes of the object. */
function contextScale(ctx: CanvasRenderingContext2D): [number, number] {
  const m = ctx.getTransform();
  return [Math.hypot(m.a, m.b) || 1, Math.hypot(m.c, m.d) || 1];
}

export interface LabelBarcodeProps {
  format: string;
  value: string;
  showText: boolean;
  textSize: number;
  eclevel: string;
}

/**
 * Barcode and 2D code object. Bars are drawn with a whole number of device
 * pixels per module so that the printed code scans reliably.
 */
export class LabelBarcode extends FabricObject {
  static type = 'LabelBarcode';
  static cacheProperties = [...FabricObject.cacheProperties, 'format', 'value', 'showText', 'textSize', 'eclevel'];
  static customProperties = ['format', 'value', 'showText', 'textSize', 'eclevel'];

  declare format: string;
  declare value: string;
  declare showText: boolean;
  declare textSize: number;
  declare eclevel: string;

  constructor(options: Partial<LabelBarcodeProps & FabricObjectProps> = {}) {
    super(options);
    this.format = options.format ?? 'code128';
    this.value = options.value ?? '12345678';
    this.showText = options.showText ?? !barcodeFormat(this.format).twoD;
    this.textSize = options.textSize ?? 24;
    this.eclevel = options.eclevel ?? 'M';
    this.objectCaching = false;
    this.lockScalingFlip = true;
  }

  get isTwoD(): boolean {
    return barcodeFormat(this.format).twoD;
  }

  get error(): string | undefined {
    return renderBars(this.format, this.value, this.eclevel).error;
  }

  _render(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;
    const { canvas: bars, error } = renderBars(this.format, this.value, this.eclevel);
    ctx.save();
    if (!bars) {
      ctx.strokeStyle = '#d33';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = '#d33';
      ctx.font = `${Math.max(12, Math.min(h / 4, 40))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(error ?? 'Invalid', 0, 0, w);
      ctx.restore();
      return;
    }
    const [sx, sy] = contextScale(ctx);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';

    if (this.isTwoD) {
      const fitPx = Math.min((w * sx) / bars.width, (h * sy) / bars.height);
      const modulePx = fitPx >= 1 ? Math.floor(fitPx) : fitPx;
      const dw = (bars.width * modulePx) / sx;
      const dh = (bars.height * modulePx) / sy;
      ctx.drawImage(bars, -dw / 2, -dh / 2, dw, dh);
    } else {
      const textH = this.showText ? this.textSize * 1.25 : 0;
      const barH = Math.max(1, h - textH);
      const fitPx = (w * sx) / bars.width;
      const modulePx = fitPx >= 1 ? Math.floor(fitPx) : fitPx;
      const dw = (bars.width * modulePx) / sx;
      ctx.drawImage(bars, 0, 0, bars.width, 1, -dw / 2, -h / 2, dw, barH);
      if (this.showText) {
        ctx.font = `${this.textSize}px "Segoe UI", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(this.value, 0, h / 2, w);
      }
    }
    ctx.restore();
  }

}

export interface LabelTableProps {
  rows: number;
  cols: number;
  cells: string[][];
  colRatios: number[];
  rowRatios: number[];
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  lineWidth: number;
  textAlign: 'left' | 'center' | 'right';
  cellPadding: number;
}

function normaliseRatios(r: number[] | undefined, n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => Math.max(0.05, r?.[i] ?? 1));
  const sum = arr.reduce((a, b) => a + b, 0);
  return arr.map((v) => v / sum);
}

/** Simple grid table with one text value per cell. */
export class LabelTable extends FabricObject {
  static type = 'LabelTable';
  static cacheProperties = [
    ...FabricObject.cacheProperties,
    'rows', 'cols', 'cells', 'colRatios', 'rowRatios', 'fontFamily', 'fontSize', 'fontWeight', 'lineWidth', 'textAlign', 'cellPadding',
  ];
  static customProperties = [
    'rows', 'cols', 'cells', 'colRatios', 'rowRatios', 'fontFamily', 'fontSize', 'fontWeight', 'lineWidth', 'textAlign', 'cellPadding',
  ];

  declare rows: number;
  declare cols: number;
  declare cells: string[][];
  declare colRatios: number[];
  declare rowRatios: number[];
  declare fontFamily: string;
  declare fontSize: number;
  declare fontWeight: string;
  declare lineWidth: number;
  declare textAlign: 'left' | 'center' | 'right';
  declare cellPadding: number;

  constructor(options: Partial<LabelTableProps & FabricObjectProps> = {}) {
    super(options);
    // Sizes come from label files too, so keep them in range.
    this.rows = Math.max(1, Math.min(30, Math.round(Number(options.rows) || 3)));
    this.cols = Math.max(1, Math.min(12, Math.round(Number(options.cols) || 2)));
    this.cells = Array.from({ length: this.rows }, (_, r) =>
      Array.from({ length: this.cols }, (_, c) => String(options.cells?.[r]?.[c] ?? '').slice(0, 1000)),
    );
    this.colRatios = normaliseRatios(options.colRatios, this.cols);
    this.rowRatios = normaliseRatios(options.rowRatios, this.rows);
    this.fontFamily = options.fontFamily ?? 'Arial';
    this.fontSize = options.fontSize ?? 30;
    this.fontWeight = options.fontWeight ?? 'normal';
    this.lineWidth = options.lineWidth ?? 3;
    this.textAlign = options.textAlign ?? 'center';
    this.cellPadding = options.cellPadding ?? 6;
    this.objectCaching = false;
  }

  /** Changes the grid size and keeps the existing cell text. */
  resize(rows: number, cols: number): void {
    rows = Math.max(1, Math.min(30, Math.round(rows)));
    cols = Math.max(1, Math.min(12, Math.round(cols)));
    this.cells = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => this.cells[r]?.[c] ?? ''));
    this.colRatios = normaliseRatios(cols === this.cols ? this.colRatios : undefined, cols);
    this.rowRatios = normaliseRatios(rows === this.rows ? this.rowRatios : undefined, rows);
    this.rows = rows;
    this.cols = cols;
    this.dirty = true;
  }

  _render(ctx: CanvasRenderingContext2D): void {
    const w = this.width;
    const h = this.height;
    const x0 = -w / 2;
    const y0 = -h / 2;
    const colX = [x0];
    for (const r of this.colRatios) colX.push(colX[colX.length - 1] + r * w);
    const rowY = [y0];
    for (const r of this.rowRatios) rowY.push(rowY[rowY.length - 1] + r * h);

    ctx.save();
    ctx.fillStyle = '#000';
    ctx.font = `${this.fontWeight} ${this.fontSize}px "${this.fontFamily}"`;
    ctx.textBaseline = 'middle';
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const text = this.cells[r]?.[c] ?? '';
        if (!text) continue;
        const cx = colX[c];
        const cy = rowY[r];
        const cw = colX[c + 1] - cx;
        const ch = rowY[r + 1] - cy;
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx, cy, cw, ch);
        ctx.clip();
        const pad = this.cellPadding;
        const lines = wrapText(ctx, text, cw - pad * 2);
        const lh = this.fontSize * 1.15;
        let ty = cy + ch / 2 - ((lines.length - 1) * lh) / 2;
        ctx.textAlign = this.textAlign;
        const tx = this.textAlign === 'left' ? cx + pad : this.textAlign === 'right' ? cx + cw - pad : cx + cw / 2;
        for (const line of lines) {
          ctx.fillText(line, tx, ty);
          ty += lh;
        }
        ctx.restore();
      }
    }
    if (this.lineWidth > 0) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = this.lineWidth;
      const half = this.lineWidth / 2;
      ctx.strokeRect(x0 + half, y0 + half, w - this.lineWidth, h - this.lineWidth);
      ctx.beginPath();
      for (let c = 1; c < this.cols; c++) {
        ctx.moveTo(colX[c], y0);
        ctx.lineTo(colX[c], y0 + h);
      }
      for (let r = 1; r < this.rows; r++) {
        ctx.moveTo(x0, rowY[r]);
        ctx.lineTo(x0 + w, rowY[r]);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(/(\s+)/);
    let line = '';
    for (const word of words) {
      const test = line + word;
      if (line && ctx.measureText(test).width > maxWidth) {
        out.push(line.trimEnd());
        line = word.trimStart();
      } else {
        line = test;
      }
    }
    out.push(line);
  }
  return out;
}

classRegistry.setClass(LabelBarcode);
classRegistry.setClass(LabelTable);
