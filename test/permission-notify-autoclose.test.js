"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const Module = require("node:module");
const os = require("node:os");
const path = require("node:path");
const { describe, it, afterEach, mock } = require("node:test");

const PERMISSION_MODULE_PATH = require.resolve("../src/permission");
const tempLogPaths = new Set();

function loadPermissionWithElectron(fakeElectron) {
  delete require.cache[PERMISSION_MODULE_PATH];
  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === "electron") return fakeElectron;
    return originalLoad.apply(this, arguments);
  };
  try {
    return require("../src/permission");
  } finally {
    Module._load = originalLoad;
  }
}

function createTempLogPath() {
  const logPath = path.join(
    os.tmpdir(),
    `clawd-permission-debug-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.log`
  );
  tempLogPaths.add(logPath);
  return logPath;
}

function createPermissionHarness({ logPath = null } = {}) {
  class FakeBrowserWindow {
    constructor() {
      this.destroyed = false;
      this.bounds = null;
      this._closedHandler = null;
      this._didFinishLoad = null;
      this.webContents = {
        once: (event, cb) => {
          if (event === "did-finish-load") this._didFinishLoad = cb;
        },
        send: (...args) => {
          this.sentEvents.push(args);
        },
      };
      this.sentEvents = [];
    }

    setAlwaysOnTop() {}
    setBounds(bounds) { this.bounds = bounds; }
    loadFile() {
      if (typeof this._didFinishLoad === "function") this._didFinishLoad();
    }
    showInactive() {}
    setSkipTaskbar() {}
    on(event, cb) {
      if (event === "closed") this._closedHandler = cb;
    }
    isDestroyed() { return this.destroyed; }
    destroy() {
      this.destroyed = true;
      if (typeof this._closedHandler === "function") this._closedHandler();
    }
  }

  const fakeElectron = {
    BrowserWindow: Object.assign(FakeBrowserWindow, {
      fromWebContents() { return null; },
    }),
    globalShortcut: {
      register() { return true; },
      unregister() {},
      isRegistered() { return false; },
    },
  };
  const permissionFactory = loadPermissionWithElectron(fakeElectron);
  let notificationAutoCloseMs = 10_000;
  const api = permissionFactory({
    win: { isDestroyed() { return false; } },
    permDebugLog: logPath,
    hideBubbles: false,
    doNotDisturb: false,
    bubbleFollowPet: false,
    sessions: new Map(),
    getBubblePolicy(kind) {
      if (kind === "notification") {
        return { enabled: notificationAutoCloseMs > 0, autoCloseMs: notificationAutoCloseMs };
      }
      return { enabled: true, autoCloseMs: null };
    },
    getSettingsSnapshot: () => ({ shortcuts: {} }),
    subscribeShortcuts: () => () => {},
    clearShortcutFailure: () => {},
    reportShortcutFailure: () => {},
    getPetWindowBounds: () => ({ x: 200, y: 200, width: 128, height: 128 }),
    getNearestWorkArea: () => ({ x: 0, y: 0, width: 1920, height: 1080 }),
    getHitRectScreen: () => null,
    getHudReservedOffset: () => 0,
    repositionUpdateBubble: () => {},
    focusTerminalForSession: () => {},
    guardAlwaysOnTop: () => {},
    reapplyMacVisibility: () => {},
  });

  return {
    api,
    setNotificationAutoCloseMs(value) {
      notificationAutoCloseMs = value;
    },
  };
}

describe("permission passive notify auto-close refresh", () => {
  afterEach(() => {
    mock.timers.reset();
    delete require.cache[PERMISSION_MODULE_PATH];
    for (const logPath of tempLogPaths) {
      try { fs.unlinkSync(logPath); } catch {}
    }
    tempLogPaths.clear();
  });

  it("recomputes the remaining lifetime for visible notify bubbles", () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"] });
    mock.timers.setTime(100_000);
    const harness = createPermissionHarness();
    const { api } = harness;

    const permEntry = {
      isCodexNotify: true,
      isKimiNotify: false,
      sessionId: "codex-a",
      bubble: null,
      hideTimer: null,
      autoExpireTimer: null,
      createdAt: Date.now() - 4_000,
    };
    api.pendingPermissions.push(permEntry);

    permEntry.autoExpireTimer = setTimeout(() => {}, 10_000);
    harness.setNotificationAutoCloseMs(3_000);

    api.refreshPassiveNotifyAutoClose();

    assert.strictEqual(api.pendingPermissions.length, 0);
  });

  it("uses the remaining lifetime instead of restarting the full countdown", () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"] });
    mock.timers.setTime(100_000);
    const harness = createPermissionHarness();
    const { api } = harness;

    const permEntry = {
      isCodexNotify: true,
      isKimiNotify: false,
      sessionId: "codex-a",
      bubble: null,
      hideTimer: null,
      autoExpireTimer: null,
      createdAt: Date.now() - 4_000,
    };
    api.pendingPermissions.push(permEntry);

    permEntry.autoExpireTimer = setTimeout(() => {}, 10_000);
    harness.setNotificationAutoCloseMs(7_000);

    api.refreshPassiveNotifyAutoClose();
    assert.strictEqual(api.pendingPermissions.length, 1);

    mock.timers.tick(2_999);
    assert.strictEqual(api.pendingPermissions.length, 1);

    mock.timers.tick(1);
    assert.strictEqual(api.pendingPermissions.length, 0);
  });

  it("ignores interactive permission bubbles when refreshing notify auto-close", () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"] });
    mock.timers.setTime(100_000);
    const harness = createPermissionHarness();
    const { api } = harness;

    const interactiveEntry = {
      isCodexNotify: false,
      isKimiNotify: false,
      sessionId: "claude-a",
      bubble: null,
      hideTimer: null,
      autoExpireTimer: null,
      createdAt: Date.now(),
    };
    api.pendingPermissions.push(interactiveEntry);
    harness.setNotificationAutoCloseMs(1_000);

    api.refreshPassiveNotifyAutoClose();
    mock.timers.tick(5_000);

    assert.deepStrictEqual(api.pendingPermissions, [interactiveEntry]);
  });

  it("logs an explicit reason when Codex passive notifications are actively cleared", () => {
    const logPath = createTempLogPath();
    const harness = createPermissionHarness({ logPath });
    const { api } = harness;

    api.pendingPermissions.push({
      isCodexNotify: true,
      isKimiNotify: false,
      sessionId: "codex-a",
      bubble: null,
      hideTimer: null,
      autoExpireTimer: null,
      createdAt: Date.now(),
    });

    api.clearCodexNotifyBubbles("codex-a", "codex-state-transition");
    const logContent = fs.readFileSync(logPath, "utf8");

    assert.ok(
      logContent.includes("passive notify dismiss: agent=codex session=codex-a reason=codex-state-transition"),
      "clearing a Codex passive notification should log the active-dismiss reason"
    );
  });

  it("logs an explicit reason when Kimi passive notifications are actively cleared", () => {
    const logPath = createTempLogPath();
    const harness = createPermissionHarness({ logPath });
    const { api } = harness;

    api.pendingPermissions.push({
      isCodexNotify: false,
      isKimiNotify: true,
      sessionId: "kimi-a",
      bubble: null,
      hideTimer: null,
      autoExpireTimer: null,
      createdAt: Date.now(),
    });

    api.clearKimiNotifyBubbles("kimi-a", "kimi-stop-session");
    const logContent = fs.readFileSync(logPath, "utf8");

    assert.ok(
      logContent.includes("passive notify dismiss: agent=kimi-cli session=kimi-a reason=kimi-stop-session"),
      "clearing a Kimi passive notification should log the active-dismiss reason"
    );
  });

  it("logs when a passive notification expires immediately after policy shrink", () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"] });
    mock.timers.setTime(100_000);
    const logPath = createTempLogPath();
    const harness = createPermissionHarness({ logPath });
    const { api } = harness;

    const permEntry = {
      isCodexNotify: true,
      isKimiNotify: false,
      sessionId: "codex-a",
      bubble: null,
      hideTimer: null,
      autoExpireTimer: null,
      createdAt: Date.now() - 4_000,
    };
    api.pendingPermissions.push(permEntry);

    harness.setNotificationAutoCloseMs(3_000);
    api.refreshPassiveNotifyAutoClose();
    const logContent = fs.readFileSync(logPath, "utf8");

    assert.ok(
      logContent.includes("passive notify dismiss: agent=codex session=codex-a reason=auto-expire-immediate"),
      "refreshing a notify bubble past its new lifetime should log the immediate-expire reason"
    );
  });

  it("deduplicates Codex passive notifications by session and refreshes the existing entry", () => {
    mock.timers.enable({ apis: ["setTimeout", "Date"] });
    mock.timers.setTime(100_000);
    const harness = createPermissionHarness();
    const { api } = harness;

    api.showCodexNotifyBubble({ sessionId: "codex-a", command: "first" });
    assert.strictEqual(api.pendingPermissions.length, 1);

    const existing = api.pendingPermissions[0];
    const originalBubble = existing.bubble;
    const firstCreatedAt = existing.createdAt;

    mock.timers.tick(500);
    api.showCodexNotifyBubble({ sessionId: "codex-a", command: "second" });

    assert.strictEqual(api.pendingPermissions.length, 1);
    assert.strictEqual(api.pendingPermissions[0], existing);
    assert.strictEqual(existing.bubble, originalBubble);
    assert.strictEqual(existing.toolInput.command, "second");
    assert.ok(existing.createdAt > firstCreatedAt);

    mock.timers.tick(9_999);
    assert.strictEqual(api.pendingPermissions.length, 1);

    mock.timers.tick(1);
    assert.strictEqual(api.pendingPermissions.length, 0);
  });
});
