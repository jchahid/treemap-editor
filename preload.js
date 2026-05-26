/**
 * preload.js — s'exécute dans le contexte renderer AVANT Angular.
 * Expose ipcRenderer sur window pour que le code Angular bundlé
 * puisse l'appeler sans passer par require() (qui est intercepté par esbuild).
 */
const { ipcRenderer } = require('electron');
window.ipcRenderer = ipcRenderer;
