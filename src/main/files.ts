import { open } from 'node:fs/promises';

/**
 * A file name for the save dialog. The name can come from a label file, so
 * folders and characters that Windows does not allow are replaced. The dialog
 * then opens in its usual folder.
 */
export function safeFileName(name: unknown, fallback: string): string {
  const clean = String(name ?? '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/^[.\s]+/, '')
    .trim()
    .slice(0, 150);
  return clean || fallback;
}

export interface ListFile {
  name: string;
  size: number;
  mtimeMs: number;
}

/**
 * The files that a library list reads: the newest first, at most `maxFiles`,
 * and at most `maxBytes` together. Each print adds a history file with the
 * full label, so without the total limit a large history could fill the
 * memory. Older files that do not fit are left out. Files over `maxFileBytes`
 * are left out, because the app does not read them.
 */
export function pickListFiles(files: ListFile[], maxFiles: number, maxBytes: number, maxFileBytes: number): string[] {
  const picked: string[] = [];
  let total = 0;
  for (const f of [...files].sort((a, b) => b.mtimeMs - a.mtimeMs)) {
    if (picked.length >= maxFiles) break;
    if (f.size > maxFileBytes) continue;
    if (total + f.size > maxBytes) break;
    total += f.size;
    picked.push(f.name);
  }
  return picked;
}

/** Reads a file of at most `max` bytes. Returns null if the file is larger, also if it grows while the app reads it. */
export async function readLimited(path: string, max: number): Promise<Buffer | null> {
  const handle = await open(path, 'r');
  try {
    const chunks: Buffer[] = [];
    let total = 0;
    for (;;) {
      const chunk = Buffer.alloc(1024 * 1024);
      const { bytesRead } = await handle.read(chunk, 0, chunk.length, null);
      if (bytesRead === 0) return Buffer.concat(chunks, total);
      total += bytesRead;
      if (total > max) return null;
      chunks.push(chunk.subarray(0, bytesRead));
    }
  } finally {
    await handle.close();
  }
}
