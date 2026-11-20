import { app, BrowserWindow, dialog, ipcMain, Menu, session, shell, type MenuItemConstructorOptions } from 'electron';
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

// The dev server URL is used only in development. A packaged app always loads its own files.
const DEV_URL = app.isPackaged ? undefined : process.env.VITE_DEV_SERVER_URL;
const APP_URL = pathToFileURL(join(__dirname, '../renderer/index.html')).href;
/** Largest file that the open dialog reads. */
const MAX_OPEN_BYTES = 50 * 1024 * 1024;
/** Largest value that the store writes. */
const MAX_STORE_BYTES = 25 * 1024 * 1024;
const COLLECTIONS = new Set(['templates', 'history', 'settings', 'labels', 'rolls']);
const ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;
const ALLOWED_PERMISSIONS = new Set(['local-fonts', 'clipboard-sanitized-write', 'clipboard-read', 'fullscreen', 'serial', 'bluetooth']);

// Web Bluetooth is behind this switch in Chromium on Linux.
if (process.platform === 'linux') app.commandLine.appendSwitch('enable-experimental-web-platform-features');

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let bluetoothCallback: ((deviceId: string) => void) | null = null;
let serialCallback: ((portId: string) => void) | null = null;
let lastSerialPorts: Electron.SerialPort[] = [];

function libraryDir(...parts: string[]): string {
  return join(app.getPath('userData'), 'library', ...parts);
}

function checkCollection(collection: unknown): string {
  if (typeof collection !== 'string' || !COLLECTIONS.has(collection)) throw new Error('Unknown collection');
  return collection;
}

function checkId(id: unknown): string {
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) throw new Error('Invalid ID');
  return id;
}

/** True for the app's own page: the bundled index.html, or the dev server in development. */
function isAppUrl(url: string): boolean {
  if (DEV_URL) return url.startsWith(DEV_URL);
  return url.split(/[?#]/)[0] === APP_URL;
}

function isAppOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  if (DEV_URL) return origin === new URL(DEV_URL).origin;
  return origin === 'file://' || origin === 'file:///';
}

function isAppContents(wc: Electron.WebContents | null | undefined): boolean {
  return Boolean(wc && mainWindow && wc.id === mainWindow.webContents.id);
}

function sendSerialPorts(): void {
  mainWindow?.webContents.send(
    'serial:ports',
    lastSerialPorts.map((p) => ({
      id: p.portId,
      name: p.displayName || p.portName,
      portName: p.portName,
      vendorId: p.vendorId,
      productId: p.productId,
    })),
  );
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: 'OwnYourNiimbot',
    backgroundColor: '#f4f5f7',
    show: false,
    autoHideMenuBar: process.platform !== 'darwin',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
      devTools: !app.isPackaged,
    },
  });

  const win = mainWindow;
  win.once('ready-to-show', () => win.show());
  win.on('closed', () => {
    mainWindow = null;
  });

  // Bluetooth device picker. Chromium calls this again each time it finds a
  // device, so the renderer gets the full list every time.
  win.webContents.on('select-bluetooth-device', (event, devices, callback) => {
    event.preventDefault();
    bluetoothCallback = callback;
    win.webContents.send(
      'bluetooth:devices',
      devices.map((d) => ({ id: d.deviceId, name: d.deviceName })),
    );
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  // The window shows only the app page. Links to websites open in the browser.
  const guardNavigation = (event: Electron.Event, url: string) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    if (url.startsWith('https://')) void shell.openExternal(url);
  };
  win.webContents.on('will-navigate', guardNavigation);
  win.webContents.on('will-redirect', guardNavigation);

  if (process.env.OYN_SMOKE_TEST) runSmokeTest(win, process.env.OYN_SMOKE_TEST);

  if (DEV_URL) {
    void win.loadURL(DEV_URL);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

/**
 * Start-up check for CI and for scripts/install-local.mjs. Loads the app,
 * saves a screenshot and exits with code 1 if the page logs an error or does
 * not render. A packaged app writes the screenshot only to the temp folder.
 */
function runSmokeTest(win: BrowserWindow, screenshotPath: string): void {
  const errors: string[] = [];
  win.webContents.on('console-message', (event) => {
    const e = event as unknown as { level?: string | number; message?: string };
    if (e.level === 'error' || e.level === 3) errors.push(String(e.message));
  });
  win.webContents.on('render-process-gone', (_e, details) => {
    errors.push(`Renderer stopped: ${details.reason}`);
  });
  win.webContents.once('did-finish-load', () => {
    win.show();
    setTimeout(async () => {
      let rendered = false;
      try {
        rendered = await win.webContents.executeJavaScript(
          "Boolean(document.querySelector('.rail') && document.querySelector('.label-frame canvas'))",
        );
      } catch (err) {
        errors.push(String(err));
      }
      // A screenshot is not possible on a display without a GPU. That is not an app fault.
      try {
        const target = resolve(screenshotPath);
        const inTemp = target.startsWith(resolve(tmpdir()) + sep) && target.toLowerCase().endsWith('.png');
        if (app.isPackaged && !inTemp) throw new Error('the screenshot path is not a PNG file in the temp folder');
        const image = await win.webContents.capturePage();
        await writeFile(target, image.toPNG());
      } catch (err) {
        console.warn(`Screenshot not saved: ${String(err)}`);
      }
      console.log(JSON.stringify({ rendered, errors }));
      app.exit(rendered && errors.length === 0 ? 0 : 1);
    }, 3000);
  });
}

function configureSession(): void {
  const ses = session.defaultSession;

  // Permissions go only to the app page in the main window.
  ses.setPermissionCheckHandler((wc, permission, requestingOrigin) =>
    ALLOWED_PERMISSIONS.has(permission) && (wc ? isAppContents(wc) : isAppOrigin(requestingOrigin)),
  );
  ses.setPermissionRequestHandler((wc, permission, callback) => callback(ALLOWED_PERMISSIONS.has(permission) && isAppContents(wc)));
  ses.setDevicePermissionHandler(
    (details) => (details.deviceType === 'serial' || (details.deviceType as string) === 'bluetooth') && isAppOrigin(details.origin),
  );

  ses.on('select-serial-port', (event, portList, _wc, callback) => {
    event.preventDefault();
    serialCallback = callback;
    lastSerialPorts = portList;
    sendSerialPorts();
  });
  ses.on('serial-port-added', (_event, port) => {
    lastSerialPorts = [...lastSerialPorts.filter((p) => p.portId !== port.portId), port];
    sendSerialPorts();
  });
  ses.on('serial-port-removed', (_event, port) => {
    lastSerialPorts = lastSerialPorts.filter((p) => p.portId !== port.portId);
    sendSerialPorts();
  });

  // NIIMBOT printers do not pair. If a device asks to pair, the user decides.
  ses.setBluetoothPairingHandler((details, callback) => {
    if (!mainWindow || (details.pairingKind !== 'confirm' && details.pairingKind !== 'confirmPin')) {
      callback({ confirmed: false });
      return;
    }
    const pin = details.pairingKind === 'confirmPin' ? `\n\nPIN: ${details.pin ?? ''}` : '';
    void dialog
      .showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['Pair', 'Cancel'],
        defaultId: 1,
        cancelId: 1,
        message: 'A Bluetooth device asks to pair with this computer.',
        detail: `NIIMBOT printers do not need pairing. Pair only if you expect this request.${pin}`,
      })
      .then((r) => callback({ confirmed: r.response === 0 }));
  });
}

function registerIpc(): void {
  ipcMain.on('bluetooth:select', (_event, deviceId: unknown) => {
    const cb = bluetoothCallback;
    bluetoothCallback = null;
    cb?.(typeof deviceId === 'string' ? deviceId : '');
  });

  ipcMain.on('serial:select', (_event, portId: unknown) => {
    const cb = serialCallback;
    serialCallback = null;
    cb?.(typeof portId === 'string' ? portId : '');
  });

  ipcMain.handle('store:list', async (_event, collection: unknown) => {
    const dir = libraryDir(checkCollection(collection));
    await mkdir(dir, { recursive: true });
    const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
    const items = await Promise.all(
      files.map(async (f) => {
        try {
          return JSON.parse(await readFile(join(dir, f), 'utf8'));
        } catch {
          return null;
        }
      }),
    );
    return items.filter((i) => i !== null);
  });

  ipcMain.handle('store:get', async (_event, collection: unknown, id: unknown) => {
    const file = libraryDir(checkCollection(collection), `${checkId(id)}.json`);
    try {
      return JSON.parse(await readFile(file, 'utf8'));
    } catch {
      return null;
    }
  });

  ipcMain.handle('store:put', async (_event, collection: unknown, id: unknown, value: unknown) => {
    const dir = libraryDir(checkCollection(collection));
    await mkdir(dir, { recursive: true });
    const file = join(dir, `${checkId(id)}.json`);
    const json = JSON.stringify(value);
    if (json === undefined || json.length > MAX_STORE_BYTES) throw new Error('The data is too large to save.');
    const tmp = `${file}.tmp`;
    await writeFile(tmp, json, 'utf8');
    await rename(tmp, file);
    return true;
  });

  ipcMain.handle('store:delete', async (_event, collection: unknown, id: unknown) => {
    await rm(libraryDir(checkCollection(collection), `${checkId(id)}.json`), { force: true });
    return true;
  });

  ipcMain.handle('file:open', async (_event, opts: { filters?: Electron.FileFilter[]; binary?: boolean }) => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: Array.isArray(opts?.filters) ? opts.filters : undefined,
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const path = result.filePaths[0];
    const { size } = await stat(path);
    if (size > MAX_OPEN_BYTES) throw new Error(`The file is larger than ${MAX_OPEN_BYTES / 1024 / 1024} MB.`);
    const buffer = await readFile(path);
    return {
      name: basename(path),
      data: opts?.binary ? buffer.toString('base64') : buffer.toString('utf8'),
    };
  });

  ipcMain.handle(
    'file:save',
    async (_event, opts: { defaultName: string; filters?: Electron.FileFilter[]; data: string; encoding?: 'utf8' | 'base64' }) => {
      if (!mainWindow) return false;
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: typeof opts?.defaultName === 'string' ? opts.defaultName : 'label.json',
        filters: Array.isArray(opts?.filters) ? opts.filters : undefined,
      });
      if (result.canceled || !result.filePath) return false;
      if (String(opts.data ?? '').length > MAX_OPEN_BYTES * 2) throw new Error('The data is too large to save.');
      const encoding = opts.encoding === 'base64' ? 'base64' : 'utf8';
      await writeFile(result.filePath, Buffer.from(String(opts.data ?? ''), encoding));
      return true;
    },
  );

  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  }));

  ipcMain.handle('app:openDataFolder', async () => {
    const dir = libraryDir();
    await mkdir(dir, { recursive: true });
    await shell.openPath(dir);
  });

  ipcMain.handle('app:openExternal', async (_event, url: unknown) => {
    if (typeof url === 'string' && url.startsWith('https://')) await shell.openExternal(url);
  });
}

function buildMenu(): void {
  const isMac = process.platform === 'darwin';
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        // Reload and developer tools are for development only.
        ...(app.isPackaged ? [] : [{ role: 'reload' as const }, { role: 'toggleDevTools' as const }, { type: 'separator' as const }]),
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  configureSession();
  registerIpc();
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
