import type { DesktopApi } from '../main/preload';

declare global {
  interface Window {
    oyn?: DesktopApi;
  }
}

/**
 * Stand-in for the desktop API when the interface runs in a plain browser,
 * for example during development with `vite`. Data goes to localStorage.
 */
const NO_UPDATES = { state: 'idle' as const, mode: 'none' as const, checkOnLaunch: true, current: 'dev' };
const NO_MCP = { enabled: false, confirmPrint: true, running: false, url: '', command: '', bridge: '', configFile: '', packaged: false, bridgeAvailable: false };

function browserApi(): DesktopApi {
  const key = (c: string, id: string) => `oyn:${c}:${id}`;
  const noop = () => () => undefined;
  const pickFile = (accept: string, binary: boolean) =>
    new Promise<{ name: string; data: string } | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result);
          resolve({ name: file.name, data: binary ? result.split(',')[1] ?? '' : result });
        };
        if (binary) reader.readAsDataURL(file);
        else reader.readAsText(file);
      };
      input.click();
    });
  return {
    bluetooth: { onDevices: noop, select: () => undefined },
    serial: { onPorts: noop, select: () => undefined },
    store: {
      list: async <T,>(c: string) =>
        Object.keys(localStorage)
          .filter((k) => k.startsWith(`oyn:${c}:`))
          .map((k) => JSON.parse(localStorage.getItem(k) ?? 'null') as T)
          .filter(Boolean),
      get: async <T,>(c: string, id: string) => JSON.parse(localStorage.getItem(key(c, id)) ?? 'null') as T | null,
      put: async (c: string, id: string, v: unknown) => {
        localStorage.setItem(key(c, id), JSON.stringify(v));
        return true;
      },
      delete: async (c: string, id: string) => {
        localStorage.removeItem(key(c, id));
        return true;
      },
    },
    files: {
      open: (opts) => pickFile((opts.filters ?? []).flatMap((f) => f.extensions.map((e) => (e === '*' ? '' : `.${e}`))).join(','), Boolean(opts.binary)),
      save: async (opts) => {
        const a = document.createElement('a');
        a.href = opts.encoding === 'base64' ? `data:application/octet-stream;base64,${opts.data}` : URL.createObjectURL(new Blob([opts.data]));
        a.download = opts.defaultName;
        a.click();
        return true;
      },
    },
    mcp: {
      onCall: noop,
      reply: () => undefined,
      ready: () => undefined,
      getConfig: async () => NO_MCP,
      getToken: async () => '',
      setConfig: async () => NO_MCP,
      newToken: async () => NO_MCP,
    },
    clipboard: {
      readText: () => navigator.clipboard.readText(),
    },
    updates: {
      getStatus: async () => NO_UPDATES,
      check: async () => NO_UPDATES,
      setCheckOnLaunch: async () => NO_UPDATES,
      install: async () => false,
      openRelease: async () => undefined,
      onStatus: () => () => undefined,
    },
    app: {
      info: async () => ({ version: 'dev', platform: 'browser', arch: '', electron: '', chrome: '' }),
      openDataFolder: async () => undefined,
      openExternal: async (url: string) => {
        window.open(url, '_blank', 'noopener');
      },
    },
  };
}

export const api: DesktopApi = window.oyn ?? browserApi();

export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 16);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
