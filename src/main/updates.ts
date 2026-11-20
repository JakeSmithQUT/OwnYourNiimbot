// Checks the GitHub releases of this project for a newer version. On systems
// where the app can replace itself (the Windows installer and the Linux
// AppImage), it downloads the update, checks its SHA-512 hash and installs it
// on the next restart. Elsewhere it shows a link to the release page.

import { app } from 'electron';
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { releaseUrl, updateMode, type UpdateMode } from './updateRules';

/** Wait after start-up before the check, so that it does not slow down the start. */
const LAUNCH_DELAY_MS = 5000;

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'none' | 'available' | 'downloading' | 'ready' | 'error';
  mode: UpdateMode;
  checkOnLaunch: boolean;
  current: string;
  /** The new version. */
  version?: string;
  /** Download progress, 0 to 100. */
  percent?: number;
  /** Release page of the new version. */
  url?: string;
  message?: string;
  checkedAt?: number;
}

interface UpdateConfig {
  checkOnLaunch: boolean;
}

const configPath = () => join(app.getPath('userData'), 'updates.json');

async function loadConfig(): Promise<UpdateConfig> {
  try {
    const raw = JSON.parse(await readFile(configPath(), 'utf8')) as Partial<UpdateConfig>;
    return { checkOnLaunch: raw.checkOnLaunch !== false };
  } catch {
    return { checkOnLaunch: true };
  }
}

let config: UpdateConfig = { checkOnLaunch: true };
let status: UpdateStatus = { state: 'idle', mode: 'none', checkOnLaunch: true, current: app.getVersion() };
let send: (s: UpdateStatus) => void = () => undefined;
let checking: Promise<void> | undefined;

function set(patch: Partial<UpdateStatus>): void {
  status = { ...status, ...patch };
  send(status);
}

export function updateStatus(): UpdateStatus {
  return status;
}

/** Sets up the updater. Call one time when the app is ready. `notify` sends status changes to the window. */
export async function startUpdates(notify: (s: UpdateStatus) => void): Promise<void> {
  send = notify;
  config = await loadConfig();
  // Development and tests only: a local update feed. The installed app ignores this variable.
  const testFeed = app.isPackaged ? undefined : process.env.OYN_UPDATE_FEED;
  const mode = updateMode({
    packaged: app.isPackaged,
    platform: process.platform,
    portable: process.env.PORTABLE_EXECUTABLE_FILE,
    appImage: process.env.APPIMAGE,
    testFeed,
  });
  status = { state: 'idle', mode, checkOnLaunch: config.checkOnLaunch, current: app.getVersion() };
  if (mode === 'none') return;

  if (testFeed) {
    // A separate download folder, so that a test never leaves an update for the installed app.
    const file = join(app.getPath('temp'), 'oyn-test-app-update.yml');
    await writeFile(file, `provider: generic\nurl: ${JSON.stringify(testFeed)}\nupdaterCacheDirName: ownyourniimbot-updater-test\n`, 'utf8');
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.updateConfigPath = file;
  } else {
    // Set the feed here too. The portable app has no app-update.yml file, but it still checks for updates.
    autoUpdater.setFeedURL({ provider: 'github', owner: 'JakeSmithQUT', repo: 'OwnYourNiimbot', releaseType: 'release' });
  }
  autoUpdater.logger = null;
  autoUpdater.autoDownload = mode === 'install';
  autoUpdater.autoInstallOnAppQuit = mode === 'install';
  autoUpdater.allowPrerelease = false;
  autoUpdater.allowDowngrade = false;

  autoUpdater.on('checking-for-update', () => set({ state: 'checking', message: undefined }));
  autoUpdater.on('update-not-available', () => set({ state: 'none', version: undefined, url: undefined, checkedAt: Date.now() }));
  autoUpdater.on('update-available', (info: UpdateInfo) =>
    set({ state: mode === 'install' ? 'downloading' : 'available', version: info.version, url: releaseUrl(info.version), percent: 0, checkedAt: Date.now() }),
  );
  autoUpdater.on('download-progress', (p: ProgressInfo) => set({ state: 'downloading', percent: Math.round(p.percent) }));
  autoUpdater.on('update-downloaded', (info: UpdateInfo) => set({ state: 'ready', version: info.version, url: releaseUrl(info.version), percent: 100 }));
  autoUpdater.on('error', (err: Error) => {
    console.error('Update check failed:', err.message);
    // Releases before 1.3.0 have no update files.
    const noFiles = (err as Error & { code?: string }).code === 'ERR_UPDATER_CHANNEL_FILE_NOT_FOUND';
    set({
      state: 'error',
      message: noFiles
        ? 'The latest release has no update information. Look for a new version on the release page.'
        : 'The app could not check for updates. Make sure that the computer is connected to the internet, then try again.',
      url: noFiles ? releaseUrl(undefined) : status.url,
      checkedAt: Date.now(),
    });
  });

  if (config.checkOnLaunch) setTimeout(() => void checkForUpdates(), LAUNCH_DELAY_MS);
}

/** Checks for a new version. A check that is already running is not started again. */
export function checkForUpdates(): Promise<void> {
  if (status.mode === 'none' || status.state === 'downloading' || status.state === 'ready') return Promise.resolve();
  checking ??= autoUpdater
    .checkForUpdates()
    .then(() => undefined)
    .catch(() => undefined) // The error event reports the failure.
    .finally(() => {
      checking = undefined;
    });
  return checking;
}

export async function setCheckOnLaunch(value: boolean): Promise<UpdateStatus> {
  config = { checkOnLaunch: value };
  await writeFile(configPath(), JSON.stringify(config, null, 2), 'utf8');
  set({ checkOnLaunch: value });
  return status;
}

/** Closes the app and installs the downloaded update. The app starts again after the install. */
export function installUpdate(): void {
  if (status.mode === 'install' && status.state === 'ready') autoUpdater.quitAndInstall(true, true);
}
