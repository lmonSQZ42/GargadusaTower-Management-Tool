// Preload script for safe context isolation
const { contextBridge, ipcRenderer } = require("electron");

// Expose safe, selected desktop APIs to the renderer process
contextBridge.exposeInMainWorld("desktopAPI", {
  platform: process.platform,
  sendNotification: (title, body) => {
    ipcRenderer.send("desktop-notify", { title, body });
  }
});
