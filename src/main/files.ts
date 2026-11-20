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
