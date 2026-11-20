import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

export interface DeviceEntry {
  id: string;
  name: string;
}

export interface SerialEntry {
  id: string;
  name: string;
  portName: string;
  vendorId?: string;
  productId?: string;
}

export interface McpPublicConfig {
  enabled: boolean;
  confirmPrint: boolean;
  token: string;
  port?: number;
  running: boolean;
  url: string;
  command: string;
  bridge: string;
  configFile: string;
  packaged: boolean;
}

function listen<T>(channel: string, cb: (value: T) => void): () => void {
  const handler = (_event: IpcRendererEvent, value: T) => cb(value);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

const api = {
  bluetooth: {
    onDevices: (cb: (devices: DeviceEntry[]) => void) => listen('bluetooth:devices', cb),
    select: (deviceId: string) => ipcRenderer.send('bluetooth:select', deviceId),
  },
  serial: {
    onPorts: (cb: (ports: SerialEntry[]) => void) => listen('serial:ports', cb),
    select: (portId: string) => ipcRenderer.send('serial:select', portId),
  },
  store: {
    list: <T>(collection: string): Promise<T[]> => ipcRenderer.invoke('store:list', collection),
    get: <T>(collection: string, id: string): Promise<T | null> => ipcRenderer.invoke('store:get', collection, id),
    put: (collection: string, id: string, value: unknown): Promise<boolean> => ipcRenderer.invoke('store:put', collection, id, value),
    delete: (collection: string, id: string): Promise<boolean> => ipcRenderer.invoke('store:delete', collection, id),
  },
  files: {
    open: (opts: { filters?: { name: string; extensions: string[] }[]; binary?: boolean }): Promise<{ name: string; data: string } | null> =>
      ipcRenderer.invoke('file:open', opts),
    save: (opts: { defaultName: string; filters?: { name: string; extensions: string[] }[]; data: string; encoding?: 'utf8' | 'base64' }): Promise<boolean> =>
      ipcRenderer.invoke('file:save', opts),
  },
  mcp: {
    /** Tool calls from AI assistants, run by the app window. */
    onCall: (cb: (call: { id: string; tool: string; args: unknown }) => void) => listen('mcp:call', cb),
    reply: (id: string, payload: { ok: boolean; result?: unknown; error?: string }) => ipcRenderer.send('mcp:reply', { id, ...payload }),
    ready: () => ipcRenderer.send('mcp:ready'),
    getConfig: (): Promise<McpPublicConfig> => ipcRenderer.invoke('mcp:getConfig'),
    setConfig: (patch: { enabled?: boolean; confirmPrint?: boolean }): Promise<McpPublicConfig> => ipcRenderer.invoke('mcp:setConfig', patch),
    newToken: (): Promise<McpPublicConfig> => ipcRenderer.invoke('mcp:newToken'),
  },
  app: {
    info: (): Promise<{ version: string; platform: string; arch: string; electron: string; chrome: string }> => ipcRenderer.invoke('app:info'),
    openDataFolder: (): Promise<void> => ipcRenderer.invoke('app:openDataFolder'),
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('app:openExternal', url),
  },
};

export type DesktopApi = typeof api;

contextBridge.exposeInMainWorld('oyn', api);
