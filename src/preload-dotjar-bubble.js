"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dotjarBubble", {
  onShow: (callback) => ipcRenderer.on("dotjar-bubble-show", (_event, payload) => callback(payload)),
  onHide: (callback) => ipcRenderer.on("dotjar-bubble-hide", () => callback()),
  open: () => ipcRenderer.send("dotjar-bubble-open"),
  close: () => ipcRenderer.send("dotjar-bubble-close"),
  height: (value) => ipcRenderer.send("dotjar-bubble-height", value),
});
