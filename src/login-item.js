"use strict";

// ── OS login item helpers ──
//
// Cross-platform "open at login" / "start on boot" plumbing.
//
//   - macOS / Windows: Electron's app.setLoginItemSettings handles it; we just
//     compute the right shape via getLoginItemSettings().
//   - Linux: Electron has no API, so we drop a .desktop file into
//     ~/.config/autostart/ ourselves (linuxGetOpenAtLogin / linuxSetOpenAtLogin).
//
// Both menu.js and main.js's settings effect/hydration paths used to inline
// these helpers. They were extracted so the new settings-actions effect for
// `openAtLogin` and `hydrateSystemBackedSettings()` in main.js can share one
// implementation. test/menu-autostart.test.js imports getLoginItemSettings
// from here.

const fs = require("fs");
const os = require("os");
const path = require("path");

const AUTOSTART_DIR = path.join(os.homedir(), ".config", "autostart");
const AUTOSTART_FILE = path.join(AUTOSTART_DIR, "clawd-insights.desktop");
// Fork builds up to v0.4.0 (and upstream) wrote this filename; keep removing
// it so the rename never leaves a second, stale autostart entry behind.
const LEGACY_AUTOSTART_FILE = path.join(AUTOSTART_DIR, "clawd-on-desk.desktop");

function getLoginItemSettings({ isPackaged, openAtLogin, execPath, appPath }) {
  if (isPackaged) return { openAtLogin };
  return {
    openAtLogin,
    path: execPath,
    args: [appPath],
  };
}

function linuxGetOpenAtLogin() {
  try {
    return fs.existsSync(AUTOSTART_FILE) || fs.existsSync(LEGACY_AUTOSTART_FILE);
  } catch {
    return false;
  }
}

function linuxSetOpenAtLogin(enable, { execCmd } = {}) {
  if (enable) {
    if (!execCmd) {
      throw new Error("linuxSetOpenAtLogin: execCmd is required when enabling");
    }
    const desktop =
      [
        "[Desktop Entry]",
        "Type=Application",
        "Name=Clawd Insights",
        `Exec=${execCmd}`,
        "Hidden=false",
        "NoDisplay=false",
        "X-GNOME-Autostart-enabled=true",
      ].join("\n") + "\n";
    fs.mkdirSync(AUTOSTART_DIR, { recursive: true });
    fs.writeFileSync(AUTOSTART_FILE, desktop);
    try {
      fs.unlinkSync(LEGACY_AUTOSTART_FILE);
    } catch (err) {
      if (err && err.code !== "ENOENT") throw err;
    }
  } else {
    for (const file of [AUTOSTART_FILE, LEGACY_AUTOSTART_FILE]) {
      try {
        fs.unlinkSync(file);
      } catch (err) {
        if (err && err.code !== "ENOENT") throw err;
      }
    }
  }
}

module.exports = {
  AUTOSTART_FILE,
  getLoginItemSettings,
  linuxGetOpenAtLogin,
  linuxSetOpenAtLogin,
};
