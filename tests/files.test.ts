import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readLimited } from '../src/main/files';

describe('reading files with a size limit', () => {
  let dir = '';
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'oyn-files-'));
  });
  afterAll(() => rm(dir, { recursive: true, force: true }));

  it('reads a file that is at most the limit', async () => {
    const file = join(dir, 'small.json');
    await writeFile(file, '{"a":1}');
    expect((await readLimited(file, 7))?.toString()).toBe('{"a":1}');
    expect((await readLimited(file, 100))?.toString()).toBe('{"a":1}');
  });

  it('refuses a file that is larger than the limit', async () => {
    const file = join(dir, 'large.bin');
    await writeFile(file, Buffer.alloc(3 * 1024 * 1024, 1));
    expect(await readLimited(file, 2 * 1024 * 1024)).toBeNull();
    expect((await readLimited(file, 3 * 1024 * 1024))?.length).toBe(3 * 1024 * 1024);
  });

  it('reads an empty file', async () => {
    const file = join(dir, 'empty.json');
    await writeFile(file, '');
    expect((await readLimited(file, 10))?.length).toBe(0);
  });
});
