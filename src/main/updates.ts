// Checks the GitHub releases of this project for a newer version. On systems
// where the app can replace itself (the Windows installer and the Linux
// AppImage), the check runs in a small update window before the main window
// opens, like Discord and Steam: the window shows the download progress, then
// the app closes, installs the update and opens again. Elsewhere the app shows
// a link to the release page.

import { app, Notification } from 'electron';
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { inProgramFiles, installAtLaunch, isNewerVersion, releaseUrl, updateMode, type UpdateMode } from './updateRules';

/** Time for the check before the app opens. A slow or missing connection must not keep the app closed. */
const LAUNCH_CHECK_MS = 6000;
/** Time between checks while the app is open. */
const PERIODIC_CHECK_MS = 6 * 60 * 60 * 1000;
/** Wait after start-up before the first check, when there is no update window. */
const BACKGROUND_DELAY_MS = 5000;

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'none' | 'available' | 'downloading' | 'ready' | 'error';
  mode: UpdateMode;
  checkOnLaunch: boolean;
  current: string;
  /** The new version. */
  version?: string;
  /** Download progress, 0 to 100. */
  percent?: number;
  /** Downloaded bytes, total bytes and speed of the download. */
  transferred?: number;
  total?: number;
  bytesPerSecond?: number;
  /** Release page of the new version. */
  url?: string;
  message?: string;
  checkedAt?: number;
  /** The version before the update that was installed when the app started. */
  updatedFrom?: string;
}

interface UpdateConfig {
  checkOnLaunch: boolean;
  /** The version that last ran, to see when an update was installed. */
  lastVersion?: string;
  /** The version that the app last closed to install. */
  installTried?: string;
}

const configPath = () => join(app.getPath('userData'), 'updates.json');

async function loadConfig(): Promise<UpdateConfig> {
  try {
    const raw = JSON.parse(await readFile(configPath(), 'utf8')) as Partial<UpdateConfig>;
    return {
      checkOnLaunch: raw.checkOnLaunch !== false,
      lastVersion: typeof raw.lastVersion === 'string' ? raw.lastVersion : undefined,
      installTried: typeof raw.installTried === 'string' ? raw.installTried : undefined,
    };
  } catch {
    return { checkOnLaunch: true };
  }
}

const saveConfig = () => writeFile(configPath(), JSON.stringify(config, null, 2), 'utf8');

let config: UpdateConfig = { checkOnLaunch: true };
let status: UpdateStatus = { state: 'idle', mode: 'none', checkOnLaunch: true, current: app.getVersion() };
let send: (s: UpdateStatus) => void = () => undefined;
let checking: Promise<void> | undefined;
let testFeed: string | undefined;
const waiters = new Set<() => void>();

function set(patch: Partial<UpdateStatus>): void {
  status = { ...status, ...patch };
  send(status);
  for (const check of [...waiters]) check();
}

/** Waits until the status meets a condition. Resolves false if `ms` runs out first. */
function waitFor(test: (s: UpdateStatus) => boolean, ms?: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (test(status)) {
      resolve(true);
      return;
    }
    const timer = ms === undefined ? undefined : setTimeout(() => finish(false), ms);
    const check = () => {
      if (test(status)) finish(true);
    };
    function finish(result: boolean) {
      if (timer) clearTimeout(timer);
      waiters.delete(check);
      resolve(result);
    }
    waiters.add(check);
  });
}

export function updateStatus(): UpdateStatus {
  return status;
}

/** Sets up the updater. Call one time when the app is ready. `notify` sends status changes to the windows. */
export async function startUpdates(notify: (s: UpdateStatus) => void): Promise<void> {
  send = notify;
  config = await loadConfig();
  // Development and tests only: a local update feed. The installed app ignores this variable.
  testFeed = app.isPackaged ? undefined : process.env.OYN_UPDATE_FEED;
  const mode = updateMode({
    packaged: app.isPackaged,
    platform: process.platform,
    portable: process.env.PORTABLE_EXECUTABLE_FILE,
    appImage: process.env.APPIMAGE,
    testFeed,
    allUsers:
      process.platform === 'win32' &&
      inProgramFiles(process.execPath, [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.ProgramW6432]),
  });
  const current = app.getVersion();
  const updatedFrom = config.lastVersion && isNewerVersion(current, config.lastVersion) ? config.lastVersion : undefined;
  // An install that worked: this version is the same as or newer than the one the app tried to install.
  const installed = config.installTried !== undefined && !isNewerVersion(config.installTried, current);
  if (config.lastVersion !== current || installed) {
    config.lastVersion = current;
    if (installed) config.installTried = undefined;
    await saveConfig().catch(() => undefined);
  }
  status = { state: 'idle', mode, checkOnLaunch: config.checkOnLaunch, current, updatedFrom };
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
    set({
      state: mode === 'install' ? 'downloading' : 'available',
      version: info.version,
      url: releaseUrl(info.version),
      percent: 0,
      transferred: 0,
      total: undefined,
      bytesPerSecond: undefined,
      checkedAt: Date.now(),
    }),
  );
  autoUpdater.on('download-progress', (p: ProgressInfo) =>
    set({ state: 'downloading', percent: Math.floor(p.percent), transferred: p.transferred, total: p.total, bytesPerSecond: p.bytesPerSecond }),
  );
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

  // Check again from time to time while the app is open, like Discord. The
  // setting can change while the app is open, so read it at each check.
  setInterval(() => {
    if (status.checkOnLaunch) void checkForUpdates();
  }, PERIODIC_CHECK_MS).unref();
}

/** True when the update window shows at start-up: the app can install updates itself and the check is on. */
export function updateAtLaunch(): boolean {
  return status.mode === 'install' && status.checkOnLaunch;
}

/** Starts a check soon after start-up, for versions of the app that do not show the update window. */
export function checkSoon(): void {
  if (status.mode !== 'none' && status.checkOnLaunch) setTimeout(() => void checkForUpdates(), BACKGROUND_DELAY_MS).unref();
}

/**
 * The check before the main window opens. Resolves "download" when a new
 * version downloads or is ready, and "open" when the app can open: no update,
 * no connection, an error, or no answer in time.
 */
export async function checkAtLaunch(): Promise<'download' | 'open'> {
  void checkForUpdates();
  await waitFor((s) => ['none', 'error', 'available', 'downloading', 'ready'].includes(s.state), LAUNCH_CHECK_MS);
  return status.state === 'downloading' || status.state === 'ready' ? 'download' : 'open';
}

/**
 * True when the app can install the downloaded update at start-up. False when
 * an earlier install of the same version failed. Then the app opens, and the
 * user can try again with "Restart to update".
 */
export function canInstallAtLaunch(): boolean {
  return installAtLaunch(status.version, config.installTried);
}

/** Waits for the download. Resolves true when the update is ready to install. */
export async function downloadFinished(): Promise<boolean> {
  await waitFor((s) => s.state === 'ready' || s.state === 'error');
  return status.state === 'ready';
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
  config = { ...config, checkOnLaunch: value };
  await saveConfig();
  set({ checkOnLaunch: value });
  return status;
}

/**
 * Closes the app and installs the downloaded update. The app opens again after
 * the install. On Windows the one-click installer shows a small window with
 * the install progress until it starts the app again. The AppImage has no
 * window, so a notification says what happens. Returns false when there is
 * nothing to install. A test feed never installs anything.
 */
export function installUpdate(): boolean {
  if (status.mode !== 'install' || status.state !== 'ready') return false;
  if (testFeed) {
    console.log(`Test feed: version ${status.version} is ready. A test does not install it.`);
    return false;
  }
  const windows = process.platform === 'win32';
  if (!windows && Notification.isSupported()) {
    new Notification({
      title: `Installing OwnYourNiimbot ${status.version}`,
      body: 'OwnYourNiimbot opens again when the update is installed.',
      silent: true,
    }).show();
  }
  // Record the attempt, so that a failed install does not start again at each start of the app.
  config = { ...config, installTried: status.version };
  const saved = saveConfig().catch(() => undefined);
  // Give the update window a moment to show "Installing". Not silent on Windows, so that the installer shows its progress.
  setTimeout(() => void saved.then(() => autoUpdater.quitAndInstall(!windows, true)), 1200);
  return true;
}
