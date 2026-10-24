"use strict";

// The dotjar bubble (clawd-insights fork): a small card beside Clawd showing
// the coloured dots the day just turned up, or the one just kept. It sits
// where the update bubble would, makes way for permission bubbles and the
// session HUD the same way, follows Clawd while it is up, and goes away by
// itself. Clicking it opens dotjar.

const { BrowserWindow } = require("electron");
const path = require("path");
const { keepOutOfTaskbar } = require("./taskbar");
const { clampTextScale, scaleWidth, scaleHeight, applyZoomToWindow } = require("./text-scale");
const { computeUpdateBubbleBounds } = require("./update-bubble");

const isLinux = process.platform === "linux";
const isMac = process.platform === "darwin";
const isWin = process.platform === "win32";
const WIDTH = 300;
const ESTIMATED_HEIGHT = 112;
const EDGE_MARGIN = 8;
const GAP = 6;
const SHOW_FOR_MS = 9000;
const FOLLOW_EVERY_MS = 200;

module.exports = function initDotjarBubble(ctx, options = {}) {
  const ipcMain = options.ipcMain;
  let bubble = null;
  let payload = null;
  let measuredHeight = 0;
  let hideTimer = null;
  let followTimer = null;

  const scale = () => clampTextScale(typeof ctx.getTextScale === "function" ? ctx.getTextScale() : 1);

  function permissionStackHeight(s) {
    const pending = typeof ctx.getPendingPermissions === "function" ? ctx.getPendingPermissions() : [];
    let total = 0;
    for (const perm of pending) {
      if (!perm || !perm.bubble || perm.bubble.isDestroyed() || !perm.bubble.isVisible()) continue;
      total += scaleHeight(perm.measuredHeight || 200, s) + Math.round(GAP * s);
    }
    return total;
  }

  function ensure() {
    if (bubble && !bubble.isDestroyed()) return bubble;
    const s = scale();
    bubble = new BrowserWindow({
      width: scaleWidth(WIDTH, s),
      height: scaleHeight(ESTIMATED_HEIGHT, s),
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: !isMac,
      resizable: false,
      skipTaskbar: true,
      hasShadow: false,
      focusable: false,
      ...(isLinux ? { type: "toolbar" } : {}),
      ...(isMac ? { type: "panel" } : {}),
      webPreferences: {
        preload: path.join(__dirname, "preload-dotjar-bubble.js"),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    if (isWin) bubble.setAlwaysOnTop(true, "pop-up-menu");
    bubble.loadFile(path.join(__dirname, "dotjar-bubble.html"));
    bubble.on("closed", () => {
      bubble = null;
      measuredHeight = 0;
    });
    bubble.webContents.once("did-finish-load", () => {
      applyZoomToWindow(bubble, scale());
      if (payload) bubble.webContents.send("dotjar-bubble-show", payload);
    });
    if (typeof ctx.guardAlwaysOnTop === "function") ctx.guardAlwaysOnTop(bubble);
    return bubble;
  }

  function bounds(s) {
    if (!ctx.win || ctx.win.isDestroyed()) return null;
    const petBounds = ctx.getPetWindowBounds();
    const wa = ctx.getNearestWorkArea(petBounds.x + petBounds.width / 2, petBounds.y + petBounds.height / 2);
    return computeUpdateBubbleBounds({
      bubbleFollowPet: ctx.bubbleFollowPet,
      width: Math.min(scaleWidth(WIDTH, s), Math.floor(wa.width * 0.9)),
      edgeMargin: Math.round(EDGE_MARGIN * s),
      gap: Math.round(GAP * s),
      height: scaleHeight(measuredHeight || ESTIMATED_HEIGHT, s),
      reservedHeight: permissionStackHeight(s),
      hudReservedOffset: typeof ctx.getHudReservedOffset === "function" ? ctx.getHudReservedOffset() : 0,
      workArea: wa,
      petBounds,
      anchorRect: ctx.bubbleFollowPet && typeof ctx.getUpdateBubbleAnchorRect === "function" ? ctx.getUpdateBubbleAnchorRect(petBounds) : null,
      hitRect: ctx.bubbleFollowPet ? ctx.getHitRectScreen(petBounds) : null,
    });
  }

  function reposition() {
    if (!bubble || bubble.isDestroyed()) return;
    const s = scale();
    applyZoomToWindow(bubble, s);
    const next = bounds(s);
    if (next) bubble.setBounds(next);
  }

  function hide() {
    if (hideTimer) clearTimeout(hideTimer);
    if (followTimer) clearInterval(followTimer);
    hideTimer = followTimer = null;
    if (!bubble || bubble.isDestroyed()) return;
    bubble.webContents.send("dotjar-bubble-hide");
    setTimeout(() => {
      if (bubble && !bubble.isDestroyed()) bubble.hide();
    }, 250);
  }

  function show(next) {
    // The update prompt takes precedence; Clawd's own reaction still plays.
    const updateWin = typeof options.getUpdateBubbleWindow === "function" ? options.getUpdateBubbleWindow() : null;
    if (updateWin && !updateWin.isDestroyed() && updateWin.isVisible()) return false;
    if (ctx.petHidden) return false;
    payload = next;
    const win = ensure();
    const send = () => {
      measuredHeight = 0;
      reposition();
      win.webContents.send("dotjar-bubble-show", payload);
      win.showInactive();
      keepOutOfTaskbar(win);
      if (typeof ctx.reapplyMacVisibility === "function") ctx.reapplyMacVisibility();
    };
    if (win.webContents.isLoading()) win.webContents.once("did-finish-load", send);
    else send();
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, SHOW_FOR_MS);
    if (!followTimer) followTimer = setInterval(reposition, FOLLOW_EVERY_MS);
    return true;
  }

  const fromBubble = (event) => bubble && !bubble.isDestroyed() && BrowserWindow.fromWebContents(event.sender) === bubble;
  const listeners = {
    "dotjar-bubble-open": (event) => {
      if (!fromBubble(event)) return;
      hide();
      if (typeof options.onOpen === "function") options.onOpen();
    },
    "dotjar-bubble-close": (event) => {
      if (fromBubble(event)) hide();
    },
    "dotjar-bubble-height": (event, height) => {
      if (!fromBubble(event) || typeof height !== "number" || !(height > 0)) return;
      measuredHeight = Math.ceil(height);
      reposition();
    },
  };
  if (ipcMain) for (const [channel, listener] of Object.entries(listeners)) ipcMain.on(channel, listener);

  function cleanup() {
    if (ipcMain) for (const [channel, listener] of Object.entries(listeners)) ipcMain.removeListener(channel, listener);
    if (hideTimer) clearTimeout(hideTimer);
    if (followTimer) clearInterval(followTimer);
    if (bubble && !bubble.isDestroyed()) bubble.destroy();
    bubble = null;
  }

  return { show, hide, reposition, cleanup, getWindow: () => bubble };
};
