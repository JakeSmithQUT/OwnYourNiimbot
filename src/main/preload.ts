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
  app: {
    info: (): Promise<{ version: string; platform: string; arch: string; electron: string; chrome: string }> => ipcRenderer.invoke('app:info'),
    openDataFolder: (): Promise<void> => ipcRenderer.invoke('app:openDataFolder'),
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('app:openExternal', url),
  },
};

export type DesktopApi = typeof api;

contextBridge.exposeInMainWorld('oyn', api);
