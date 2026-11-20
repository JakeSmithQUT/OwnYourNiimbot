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

/** Release page for a version, or the list of releases if the version is not a plain version number. */
export function releaseUrl(version: string | undefined): string {
  return version && /^\d+\.\d+\.\d+$/.test(version) ? `${RELEASES}/tag/v${version}` : RELEASES;
}
