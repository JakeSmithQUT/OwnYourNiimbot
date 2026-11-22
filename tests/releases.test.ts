import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en';
import { RELEASES, compareVersions, releasesFor } from '../src/i18n/releases';

const version = (JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as { version: string }).version;

describe('release notes', () => {
  it('has notes for the version in package.json', () => {
    const release = RELEASES.find((r) => r.version === version);
    expect(release, `Add the release notes for ${version} to src/i18n/releases.ts and src/i18n/en/changelog.ts.`).toBeDefined();
    expect(release?.notes.length).toBeGreaterThan(0);
  });

  it('lists each version one time, newest first, with a date', () => {
    for (let i = 1; i < RELEASES.length; i++) {
      expect(compareVersions(RELEASES[i - 1].version, RELEASES[i].version), RELEASES[i].version).toBeGreaterThan(0);
      expect(RELEASES[i - 1].date >= RELEASES[i].date, RELEASES[i].version).toBe(true);
    }
    for (const r of RELEASES) expect(r.date, r.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('has an English text for each note', () => {
    for (const r of RELEASES) for (const key of r.notes) expect(en[key], key).toBeTypeOf('string');
  });

  it('compares versions part by part', () => {
    expect(compareVersions('1.10.0', '1.9.2')).toBeGreaterThan(0);
    expect(compareVersions('1.9.2', '1.9.2')).toBe(0);
    expect(compareVersions('1.9', '1.9.1')).toBeLessThan(0);
  });

  it('shows the versions since an update, and the earlier versions under them', () => {
    const after = releasesFor('1.9.2', '1.8.1');
    expect(after.recent.map((r) => r.version)).toEqual(['1.9.2', '1.9.1', '1.9.0']);
    expect(after.earlier[0].version).toBe('1.8.1');
    const plain = releasesFor('1.9.1');
    expect(plain.recent.map((r) => r.version)).toEqual(['1.9.1']);
    expect(plain.earlier.map((r) => r.version)).not.toContain('1.9.2');
    expect(releasesFor('dev').recent[0].version).toBe(RELEASES[0].version);
  });
});
