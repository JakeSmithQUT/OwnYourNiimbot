import { open } from 'node:fs/promises';

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
