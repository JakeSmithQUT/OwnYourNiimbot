// The versions of the app and their release notes, newest first. Each note is
// a text in src/i18n/en/changelog.ts. Add the version and its notes before a
// release: a test checks that the version in package.json has notes.

import type { MessageKey } from './en';

export interface Release {
  version: string;
  /** Date of the release, YYYY-MM-DD. */
  date: string;
  notes: MessageKey[];
}

export const RELEASES: Release[] = [
  { version: '1.10.0', date: '2026-11-22', notes: ['changelog.1.10.0.whatsnew', 'changelog.1.10.0.settings', 'changelog.1.10.0.round'] },
  { version: '1.9.2', date: '2026-11-22', notes: ['changelog.1.9.2.round', 'changelog.1.9.2.sizes'] },
  { version: '1.9.1', date: '2026-11-22', notes: ['changelog.1.9.1.layout', 'changelog.1.9.1.codes', 'changelog.1.9.1.codabar'] },
  { version: '1.9.0', date: '2026-11-21', notes: ['changelog.1.9.0.animals', 'changelog.1.9.0.japanese'] },
  { version: '1.8.1', date: '2026-11-21', notes: ['changelog.1.8.1.language'] },
  { version: '1.8.0', date: '2026-11-21', notes: ['changelog.1.8.0.vietnamese', 'changelog.1.8.0.name'] },
  { version: '1.7.0', date: '2026-11-21', notes: ['changelog.1.7.0.languages'] },
  { version: '1.6.1', date: '2026-11-20', notes: ['changelog.1.6.1.printer'] },
  { version: '1.6.0', date: '2026-11-20', notes: ['changelog.1.6.0.progress'] },
  { version: '1.5.3', date: '2026-11-20', notes: ['changelog.1.5.3.rename'] },
  { version: '1.5.2', date: '2026-11-20', notes: ['changelog.1.5.2.windows'] },
  { version: '1.5.0', date: '2026-11-20', notes: ['changelog.1.5.0.update'] },
  { version: '1.4.0', date: '2026-11-20', notes: ['changelog.1.4.0.area', 'changelog.1.4.0.assistants'] },
  { version: '1.3.1', date: '2026-11-20', notes: ['changelog.1.3.1.files'] },
  { version: '1.3.0', date: '2026-11-20', notes: ['changelog.1.3.0.templates', 'changelog.1.3.0.symbols', 'changelog.1.3.0.updates'] },
  { version: '1.2.0', date: '2026-11-20', notes: ['changelog.1.2.0.decorative', 'changelog.1.2.0.fonts', 'changelog.1.2.0.assistants', 'changelog.1.2.0.replace'] },
  { version: '1.1.0', date: '2026-11-20', notes: ['changelog.1.1.0.templates', 'changelog.1.1.0.rolls'] },
  { version: '1.0.0', date: '2026-11-20', notes: ['changelog.1.0.0.first'] },
];

/** Compares two versions such as 1.9.2 and 1.10.0, part by part. Negative when a is older. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return 0;
}

/**
 * The releases to show for the version that is running: the ones that are new
 * since `from` (the version before an update), or else the running version,
 * and the earlier ones.
 */
export function releasesFor(current: string, from?: string): { recent: Release[]; earlier: Release[] } {
  // A development build has no version number, so it shows every release.
  const known = /^\d+(\.\d+)*$/.test(current) ? RELEASES.filter((r) => compareVersions(r.version, current) <= 0) : RELEASES;
  const recent = from ? known.filter((r) => compareVersions(r.version, from) > 0) : known.slice(0, 1);
  const shown = recent.length ? recent : known.slice(0, 1);
  return { recent: shown, earlier: known.filter((r) => !shown.includes(r)) };
}
