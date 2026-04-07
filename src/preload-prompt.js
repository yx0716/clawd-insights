const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("promptAPI", {
  submit: (val) => ipcRenderer.send("proportional-custom", val),
});
