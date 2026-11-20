const FALLBACK_FONTS = [
  'Arial',
  'Arial Black',
  'Calibri',
  'Cambria',
  'Comic Sans MS',
  'Consolas',
  'Courier New',
  'DejaVu Sans',
  'Georgia',
  'Helvetica',
  'Impact',
  'Liberation Sans',
  'Noto Sans',
  'Segoe UI',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
];

let cache: string[] | undefined;

interface LocalFontData {
  family: string;
}

/** Lists the fonts installed on the computer. Falls back to a fixed list. */
export async function listFonts(): Promise<string[]> {
  if (cache) return cache;
  const query = (window as unknown as { queryLocalFonts?: () => Promise<LocalFontData[]> }).queryLocalFonts;
  let families: string[] = [];
  if (query) {
    try {
      const fonts = await query();
      families = [...new Set(fonts.map((f) => f.family))];
    } catch {
      families = [];
    }
  }
  if (!families.length) {
    families = FALLBACK_FONTS.filter((f) => document.fonts.check(`12px "${f}"`));
    if (!families.length) families = FALLBACK_FONTS;
  }
  cache = families.sort((a, b) => a.localeCompare(b));
  return cache;
}
