// Rules for the update check that do not need Electron, so that tests can use them.

const RELEASES = 'https://github.com/JakeSmithQUT/OwnYourNiimbot/releases';

/** What the app can do with an update on this system. */
export type UpdateMode = 'install' | 'notify' | 'none';

/**
 * The Windows installer and the AppImage can install an update. macOS cannot,
 * because the app is not code signed. The portable Windows app and the .deb
 * package cannot replace themselves, so they show a link to the release.
 * A development build checks only when a test feed is set.
 */
export function updateMode(o: { packaged: boolean; platform: string; portable?: string; appImage?: string; testFeed?: string }): UpdateMode {
  if (!o.packaged) return o.testFeed ? 'install' : 'none';
  if (o.platform === 'win32') return o.portable ? 'notify' : 'install';
  if (o.platform === 'linux') return o.appImage ? 'install' : 'notify';
  return 'notify';
}

/** True when version `a` is newer than version `b`, for plain x.y.z version numbers. */
export function isNewerVersion(a: string, b: string): boolean {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  }
  return false;
}

/** A size in bytes as megabytes, for example "52 MB" or "4.6 MB". */
export function formatMegabytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/** A download speed, for example "6.1 MB/s" or "850 KB/s". */
export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024 * 1024) return `${Math.max(1, Math.round(bytesPerSecond / 1024))} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
}

/** Release page for a version, or the list of releases if the version is not a plain version number. */
export function releaseUrl(version: string | undefined): string {
  return version && /^\d+\.\d+\.\d+$/.test(version) ? `${RELEASES}/tag/v${version}` : RELEASES;
}
