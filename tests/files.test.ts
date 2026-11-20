import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pickListFiles, readLimited } from '../src/main/files';

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

describe('library lists', () => {
  const file = (name: string, size: number, mtimeMs: number) => ({ name, size, mtimeMs });

  it('reads the newest files first and stops at the total size limit', () => {
    const files = [file('old.json', 40, 1), file('new.json', 40, 3), file('mid.json', 40, 2)];
    expect(pickListFiles(files, 10, 1000, 100)).toEqual(['new.json', 'mid.json', 'old.json']);
    expect(pickListFiles(files, 10, 100, 100)).toEqual(['new.json', 'mid.json']);
    expect(pickListFiles(files, 1, 1000, 100)).toEqual(['new.json']);
  });

  it('leaves out files that are larger than the file limit', () => {
    const files = [file('huge.json', 500, 3), file('small.json', 10, 1)];
    expect(pickListFiles(files, 10, 1000, 100)).toEqual(['small.json']);
  });
});
