// Preload script of the update window. The window can only read the update
// status and ask to start the app without the update.

import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { UpdateStatus } from './preload';

contextBridge.exposeInMainWorld('oynUpdater', {
  onStatus: (cb: (status: UpdateStatus) => void) => {
    const handler = (_event: IpcRendererEvent, status: UpdateStatus) => cb(status);
    ipcRenderer.on('updater:status', handler);
    return () => ipcRenderer.off('updater:status', handler);
  },
  ready: () => ipcRenderer.send('updater:ready'),
  skip: () => ipcRenderer.send('updater:skip'),
});
