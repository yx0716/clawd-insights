// src/analytics-watcher.js — filesystem change detector for analytics dashboard
//
// Polls the three session-log roots (Claude / Codex / Cursor) every 5s and
// fires a callback when it detects that new JSONL files appeared, existing
// files grew, or files were removed. Uses a coarse fingerprint
// (count + max mtime + total size) — cheap to compute, catches all three
// shapes of change without maintaining a per-file map.
//
// Why polling instead of fs.watch: fs.watch on macOS doesn't reliably fire
// for deep-nested writes, and chokidar is a heavy dep. The existing codex
// log monitor uses the same polling approach (see agents/codex-log-monitor.js).

const fs = require("fs");
const path = require("path");
const os = require("os");

const POLL_INTERVAL_MS = 5000;
const MAX_WALK_DEPTH = 5; // codex goes YYYY/MM/DD/*.jsonl (depth 4 from root)

module.exports = function initAnalyticsWatcher() {
  const home = os.homedir();
  const isLinux = process.platform === "linux";
  const xdgData = isLinux
    ? (process.env.XDG_DATA_HOME || path.join(home, ".local", "share"))
    : null;
  const xdgConfig = isLinux
    ? (process.env.XDG_CONFIG_HOME || path.join(home, ".config"))
    : null;

  const candidates = [
    path.join(home, ".claude", "projects"),
    xdgConfig ? path.join(xdgConfig, "claude", "projects") : null,
    path.join(home, ".codex", "sessions"),
    xdgData ? path.join(xdgData, "codex", "sessions") : null,
    path.join(home, ".cursor", "projects"),
    xdgConfig ? path.join(xdgConfig, "cursor", "projects") : null,
  ].filter(Boolean);

  let timer = null;
  let lastFingerprint = null;
  let userCallback = null;
  let roots = [];

  function resolveRoots() {
    return candidates.filter(p => {
      try { return fs.statSync(p).isDirectory(); } catch { return false; }
    });
  }

  function collectJsonlStats(root, results, depth) {
    if (depth > MAX_WALK_DEPTH) return;
    let entries;
    try {
      entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(root, e.name);
      if (e.isDirectory()) {
        collectJsonlStats(full, results, depth + 1);
      } else if (e.isFile() && full.endsWith(".jsonl")) {
        try {
          const st = fs.statSync(full);
          results.push({ mtime: st.mtimeMs, size: st.size });
        } catch { /* ignore transient */ }
      }
    }
  }

  function computeFingerprint() {
    const stats = [];
    for (const root of roots) collectJsonlStats(root, stats, 0);
    let maxMtime = 0;
    let totalSize = 0;
    for (const f of stats) {
      if (f.mtime > maxMtime) maxMtime = f.mtime;
      totalSize += f.size;
    }
    return `${stats.length}:${maxMtime}:${totalSize}`;
  }

  function poll() {
    let fp;
    try {
      fp = computeFingerprint();
    } catch (e) {
      console.warn("[analytics-watcher] poll error:", e.message);
      return;
    }
    if (lastFingerprint !== null && fp !== lastFingerprint && typeof userCallback === "function") {
      try { userCallback(); } catch (e) {
        console.warn("[analytics-watcher] callback error:", e.message);
      }
    }
    lastFingerprint = fp;
  }

  function start(onChange) {
    if (timer) return;
    userCallback = typeof onChange === "function" ? onChange : null;
    roots = resolveRoots();
    if (!roots.length) return;
    lastFingerprint = null; // first poll sets baseline, no fire
    poll();
    timer = setInterval(poll, POLL_INTERVAL_MS);
    if (timer.unref) timer.unref();
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    userCallback = null;
    lastFingerprint = null;
  }

  return { start, stop };
};
