// Reads data files for batch printing: CSV, TSV, pasted tables and .xlsx.
// The data comes from outside the app, so each step checks the size before it
// does more work.

import Papa from 'papaparse';
import type { Dataset } from './editor/template';

export const DATA_LIMITS = {
  /** Data rows, without the header row. */
  rows: 20000,
  cols: 200,
  cellChars: 4000,
  /** Total unpacked size of the parts of an .xlsx file. */
  xlsxBytes: 64 * 1024 * 1024,
  xlsxParts: 5000,
};

export class DataFileError extends Error {}

const TOO_MANY_ROWS = `The file has more than ${DATA_LIMITS.rows.toLocaleString('en-AU')} rows. Split it into smaller files.`;
const TOO_MANY_COLS = `The file has more than ${DATA_LIMITS.cols} columns.`;
const CELL_TOO_LONG = `A cell has more than ${DATA_LIMITS.cellChars.toLocaleString('en-AU')} characters.`;

export function toDataset(name: string, matrix: unknown[][]): Dataset {
  if (matrix.length > DATA_LIMITS.rows + 1) throw new DataFileError(TOO_MANY_ROWS);
  const rows = matrix
    .map((r) => {
      if (r.length > DATA_LIMITS.cols) throw new DataFileError(TOO_MANY_COLS);
      return r.map((c) => (c === null || c === undefined ? '' : c instanceof Date ? c.toLocaleDateString() : String(c)));
    })
    .filter((r) => r.some((c) => c.trim() !== ''));
  if (!rows.length) throw new DataFileError('The file has no data.');
  if (rows.some((r) => r.some((c) => c.length > DATA_LIMITS.cellChars))) throw new DataFileError(CELL_TOO_LONG);
  const header = rows[0].map((h, i) => h.trim() || `Column ${i + 1}`);
  const seen = new Map<string, number>();
  const columns = header.map((h) => {
    const n = (seen.get(h) ?? 0) + 1;
    seen.set(h, n);
    return n > 1 ? `${h} ${n}` : h;
  });
  return { name, columns, rows: rows.slice(1).map((r) => columns.map((_, i) => r[i] ?? '')) };
}

/**
 * Parses CSV or TSV text one row at a time. Stops at the first row that is
 * more than the limits, so that a very large file does not fill the memory.
 * An empty delimiter detects it from the text.
 */
export function parseDelimited(text: string, delimiter: '' | '\t' | ','): string[][] {
  const rows: string[][] = [];
  let error: string | undefined;
  Papa.parse<string[]>(text, {
    skipEmptyLines: true,
    delimiter,
    step: (result, parser) => {
      const row = result.data;
      if (rows.length > DATA_LIMITS.rows) error = TOO_MANY_ROWS;
      else if (row.length > DATA_LIMITS.cols) error = TOO_MANY_COLS;
      else if (row.some((c) => c.length > DATA_LIMITS.cellChars)) error = CELL_TOO_LONG;
      if (error) parser.abort();
      else rows.push(row);
    },
  });
  if (error) throw new DataFileError(error);
  return rows;
}

/**
 * Reads the directory of an .xlsx file (a zip file) and refuses a file that
 * unpacks to more than the limit. The unzip library makes each part the size
 * that the directory gives, so this check limits the memory that it uses.
 */
export function checkXlsxSize(bytes: Uint8Array): void {
  const invalid = () => new DataFileError('This file is not a valid .xlsx file.');
  const tooLarge = () => new DataFileError('The spreadsheet is too large to open. Save a smaller part of it, or save it as CSV.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // The end-of-directory record is in the last 22 to 65,557 bytes.
  let end = -1;
  for (let i = bytes.length - 22; i >= 0 && i >= bytes.length - 65557; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw invalid();
  const entries = view.getUint16(end + 10, true);
  const dirSize = view.getUint32(end + 12, true);
  const dirOffset = view.getUint32(end + 16, true);
  // 0xFFFF and 0xFFFFFFFF mean a ZIP64 file. A spreadsheet of a supported size does not need ZIP64.
  if (entries === 0xffff || dirOffset === 0xffffffff || dirSize === 0xffffffff) throw tooLarge();
  if (dirOffset + dirSize > bytes.length) throw invalid();
  if (entries > DATA_LIMITS.xlsxParts) throw tooLarge();
  let total = 0;
  let p = dirOffset;
  for (let n = 0; n < entries; n++) {
    if (p + 46 > bytes.length || view.getUint32(p, true) !== 0x02014b50) throw invalid();
    const size = view.getUint32(p + 24, true);
    total += size;
    if (size === 0xffffffff || total > DATA_LIMITS.xlsxBytes) throw tooLarge();
    p += 46 + view.getUint16(p + 28, true) + view.getUint16(p + 30, true) + view.getUint16(p + 32, true);
  }
}
