export interface RecordContext {
  /** Zero-based position of the label in the job. */
  index: number;
  /** Data row values keyed by column name. */
  row?: Record<string, string>;
  now?: Date;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DATE_FORMATS = [
  'DD/MM/YYYY',
  'D MMM YYYY',
  'YYYY-MM-DD',
  'MM/DD/YYYY',
  'DD.MM.YYYY',
  'ddd D MMM',
  'HH:mm',
  'DD/MM/YYYY HH:mm',
  'YYYY-MM-DD HH:mm:ss',
];

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

export function formatDate(date: Date, format: string): string {
  return format.replace(/YYYY|YY|MMM|MM|M|DD|D|ddd|HH|H|hh|h|mm|ss|A/g, (token) => {
    switch (token) {
      case 'YYYY': return String(date.getFullYear());
      case 'YY': return pad(date.getFullYear() % 100);
      case 'MMM': return MONTHS[date.getMonth()];
      case 'MM': return pad(date.getMonth() + 1);
      case 'M': return String(date.getMonth() + 1);
      case 'DD': return pad(date.getDate());
      case 'D': return String(date.getDate());
      case 'ddd': return DAYS[date.getDay()];
      case 'HH': return pad(date.getHours());
      case 'H': return String(date.getHours());
      case 'hh': return pad(date.getHours() % 12 || 12);
      case 'h': return String(date.getHours() % 12 || 12);
      case 'mm': return pad(date.getMinutes());
      case 'ss': return pad(date.getSeconds());
      case 'A': return date.getHours() < 12 ? 'AM' : 'PM';
      default: return token;
    }
  });
}

export interface SerialSettings {
  start: number;
  step: number;
  digits: number;
  prefix: string;
  suffix: string;
}

export function formatSerial(s: SerialSettings, index: number): string {
  const n = s.start + index * s.step;
  const body = n < 0 ? `-${String(-n).padStart(s.digits, '0')}` : String(n).padStart(s.digits, '0');
  return `${s.prefix}${body}${s.suffix}`;
}

const PLACEHOLDER = /\{\{\s*([^}]+?)\s*\}\}/g;

export function hasPlaceholders(text: string): boolean {
  PLACEHOLDER.lastIndex = 0;
  return PLACEHOLDER.test(text);
}

/**
 * Replaces {{name}} placeholders. Names match data columns without regard to
 * case. Built-in names: date, time, datetime, index, and date:FORMAT.
 */
export function substitute(text: string, ctx: RecordContext): string {
  const now = ctx.now ?? new Date();
  const lowerRow = new Map(Object.entries(ctx.row ?? {}).map(([k, v]) => [k.trim().toLowerCase(), v]));
  return text.replace(PLACEHOLDER, (whole, rawName: string) => {
    const name = rawName.trim();
    const lower = name.toLowerCase();
    if (lowerRow.has(lower)) return lowerRow.get(lower) ?? '';
    if (lower === 'date') return formatDate(now, 'DD/MM/YYYY');
    if (lower === 'time') return formatDate(now, 'HH:mm');
    if (lower === 'datetime') return formatDate(now, 'DD/MM/YYYY HH:mm');
    if (lower === 'index') return String(ctx.index + 1);
    if (lower.startsWith('date:')) return formatDate(now, name.slice(5));
    return ctx.row ? '' : whole;
  });
}
