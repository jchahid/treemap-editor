const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  googleOauth: (clientId) => ipcRenderer.invoke('google-oauth', { clientId })
});
