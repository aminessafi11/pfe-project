const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close:    () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onWindowStateChange: (cb) => ipcRenderer.on('window-state-change', (_, data) => cb(data)),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  callGroq: (payload) => ipcRenderer.invoke('groq-call', payload),
});