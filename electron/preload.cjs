const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  elevate: () => ipcRenderer.send('elevate-admin'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  selectFile: () => ipcRenderer.invoke('select-file'),
  isAdmin: () => ipcRenderer.sendSync('is-admin-sync')
});
