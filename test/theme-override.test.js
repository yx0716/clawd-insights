// test/theme-override.test.js — Phase 3b: disable-only oneshot override
//
// Covers two layers:
//   1. state.js applyState() gate：oneshot state 被 ctx.isOneshotDisabled(state)
//      标记为禁用时，visual + sound 都被跳过，回落到 resolveDisplayState
//   2. settings-actions setThemeOverrideDisabled / resetThemeOverrides 的白名单
//      校验 + commit 计算

"use strict";

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const path = require("path");

const themeLoader = require("../src/theme-loader");
themeLoader.init(path.join(__dirname, "..", "src"));
const _defaultTheme = themeLoader.loadTheme("clawd");

const {
  commandRegistry,
  ONESHOT_OVERRIDE_STATES,
} = require("../src/settings-actions");
const prefs = require("../src/prefs");

// ── state.js gate tests ────────────────────────────────────────────────────

function makeCtx(overrides = {}) {
  const stateChanges = [];
  const sounds = [];
  const ctx = {
    theme: _defaultTheme,
    doNotDisturb: false,
    miniTransitioning: false,
    miniMode: false,
    mouseOverPet: false,
    idlePaused: false,
    forceEyeResend: false,
    eyePauseUntil: 0,
    mouseStillSince: Date.now(),
    miniSleepPeeked: false,
    playSound: (name) => sounds.push(name),
    sendToRenderer: (ch, ...args) => {
      if (ch === "state-change") stateChanges.push(args);
    },
    syncHitWin: () => {},
    sendToHitWin: () => {},
    miniPeekIn: () => {},
    miniPeekOut: () => {},
    buildContextMenu: () => {},
    buildTrayMenu: () => {},
    pendingPermissions: [],
    resolvePermissionEntry: () => {},
    t: (k) => k,
    showSessionId: false,
    focusTerminalWindow: () => {},
    processKill: () => { const e = new Error("ESRCH"); e.code = "ESRCH"; throw e; },
    getCursorScreenPoint: () => ({ x: 100, y: 100 }),
    isOneshotDisabled: () => false,
    ...overrides,
  };
  ctx._stateChanges = stateChanges;
  ctx._sounds = sounds;
  return ctx;
}

// 返回仅当 disabled 集合包含该 state 时 true 的辅助
function disabledSet(set) {
  return (stateKey) => set.has(stateKey);
}

describe("state.js applyState() gate", () => {
  let api;
  let ctx;
  afterEach(() => { if (api) api.cleanup(); api = null; });

  it("non-disabled oneshot: attention 正常播放", () => {
    ctx = makeCtx({ isOneshotDisabled: () => false });
    api = require("../src/state")(ctx);
    ctx._stateChanges.length = 0;
    ctx._sounds.length = 0;
    api.applyState("attention");
    const played = ctx._stateChanges.map((a) => a[0]);
    assert.ok(played.includes("attention"), "attention 应该播放");
    assert.ok(ctx._sounds.includes("complete"), "attention 应该响 complete 音");
  });

  it("disabled attention: 不播 visual、不响音、回落到 idle", () => {
    ctx = makeCtx({ isOneshotDisabled: disabledSet(new Set(["attention"])) });
    api = require("../src/state")(ctx);
    ctx._stateChanges.length = 0;
    ctx._sounds.length = 0;
    api.applyState("attention");
    const played = ctx._stateChanges.map((a) => a[0]);
    assert.ok(!played.includes("attention"), "不应该播 attention");
    assert.ok(!ctx._sounds.includes("complete"), "不应该响 complete");
  });

  it("disabled notification: mini-mode 下也不播 mini-alert（gate 在 mini 映射之前）", () => {
    ctx = makeCtx({
      miniMode: true,
      isOneshotDisabled: disabledSet(new Set(["notification"])),
    });
    api = require("../src/state")(ctx);
    ctx._stateChanges.length = 0;
    ctx._sounds.length = 0;
    api.applyState("notification");
    const played = ctx._stateChanges.map((a) => a[0]);
    assert.ok(!played.includes("notification"), "不播 notification");
    assert.ok(!played.includes("mini-alert"), "也不播 mini-alert");
    assert.ok(!ctx._sounds.includes("confirm"), "不响 confirm");
  });

  it("disabled attention: mini-mode 下不映射 mini-happy", () => {
    ctx = makeCtx({
      miniMode: true,
      isOneshotDisabled: disabledSet(new Set(["attention"])),
    });
    api = require("../src/state")(ctx);
    ctx._stateChanges.length = 0;
    api.applyState("attention");
    const played = ctx._stateChanges.map((a) => a[0]);
    assert.ok(!played.includes("mini-happy"), "不应该出现 mini-happy");
  });

  it("PermissionRequest path (updateSession) 被 gate 拦住", () => {
    ctx = makeCtx({ isOneshotDisabled: disabledSet(new Set(["notification"])) });
    api = require("../src/state")(ctx);
    ctx._stateChanges.length = 0;
    ctx._sounds.length = 0;
    api.updateSession(
      "s1", "any", "PermissionRequest",
      null, "/tmp", null, null, null, "claude-code", null, false, undefined,
    );
    const played = ctx._stateChanges.map((a) => a[0]);
    assert.ok(!played.includes("notification"), "PermissionRequest 路径不该播 notification");
    assert.ok(!ctx._sounds.includes("confirm"), "不响 confirm");
  });

  it("non-oneshot state 不受 gate 影响（即便 ctx.isOneshotDisabled 错报 true）", () => {
    // 模拟有 bug 的 ctx：对所有 state 都返回 true
    ctx = makeCtx({ isOneshotDisabled: () => true });
    api = require("../src/state")(ctx);
    ctx._stateChanges.length = 0;
    api.applyState("working");
    const played = ctx._stateChanges.map((a) => a[0]);
    assert.ok(played.includes("working"), "working 非 oneshot，gate 不应该消费");
  });

  it("全部 5 个 oneshot 禁用：applyState(attention) 回落到 idle（无 session）", () => {
    ctx = makeCtx({
      isOneshotDisabled: disabledSet(new Set([
        "attention", "error", "sweeping", "notification", "carrying",
      ])),
    });
    api = require("../src/state")(ctx);
    ctx._stateChanges.length = 0;
    api.applyState("attention");
    const played = ctx._stateChanges.map((a) => a[0]);
    // gate fallback 到 resolveDisplayState() → sessions 空 → "idle"
    // initial state 本身也是 idle，可能 sameState 导致 0 次 emit；只要不出现 attention 就对
    assert.ok(!played.includes("attention"));
    assert.ok(!played.includes("error"));
    assert.ok(!played.includes("sweeping"));
    assert.ok(!played.includes("notification"));
    assert.ok(!played.includes("carrying"));
  });

  it("attention disabled + working session: 回落到 working 而不是 attention", () => {
    ctx = makeCtx({ isOneshotDisabled: disabledSet(new Set(["attention"])) });
    api = require("../src/state")(ctx);
    // 先触发 working session 让 resolveDisplayState 返回 working
    api.updateSession(
      "s1", "working", "PreToolUse",
      null, "/tmp", null, null, null, "claude-code", null, false, undefined,
    );
    ctx._stateChanges.length = 0;
    ctx._sounds.length = 0;
    api.applyState("attention");
    const played = ctx._stateChanges.map((a) => a[0]);
    assert.ok(!played.includes("attention"));
    // 回落目标是 working 或 sameState 不 emit，两者都合法
    if (played.length > 0) {
      assert.strictEqual(played[0], "working");
    }
  });
});

// ── settings-actions: setThemeOverrideDisabled / resetThemeOverrides ──────

describe("setThemeOverrideDisabled", () => {
  const action = commandRegistry.setThemeOverrideDisabled;
  const baseSnap = () => ({ ...prefs.getDefaults(), themeOverrides: {} });

  it("enable (disabled:true) 首次写入生成 {disabled:true}", () => {
    const r = action(
      { themeId: "clawd", stateKey: "attention", disabled: true },
      { snapshot: baseSnap() },
    );
    assert.strictEqual(r.status, "ok");
    assert.deepStrictEqual(r.commit.themeOverrides, {
      clawd: { attention: { disabled: true } },
    });
  });

  it("同值 noop 不产生 commit", () => {
    const snap = baseSnap();
    snap.themeOverrides = { clawd: { attention: { disabled: true } } };
    const r = action(
      { themeId: "clawd", stateKey: "attention", disabled: true },
      { snapshot: snap },
    );
    assert.strictEqual(r.status, "ok");
    assert.strictEqual(r.noop, true);
    assert.ok(!r.commit);
  });

  it("disabled:false 清理 key 且整个 theme map 空后删除 theme 条目", () => {
    const snap = baseSnap();
    snap.themeOverrides = { clawd: { attention: { disabled: true } } };
    const r = action(
      { themeId: "clawd", stateKey: "attention", disabled: false },
      { snapshot: snap },
    );
    assert.strictEqual(r.status, "ok");
    assert.deepStrictEqual(r.commit.themeOverrides, {});
  });

  it("disabled:false 保留其他被禁用的 state", () => {
    const snap = baseSnap();
    snap.themeOverrides = {
      clawd: {
        attention: { disabled: true },
        sweeping:  { disabled: true },
      },
    };
    const r = action(
      { themeId: "clawd", stateKey: "attention", disabled: false },
      { snapshot: snap },
    );
    assert.deepStrictEqual(r.commit.themeOverrides, {
      clawd: { sweeping: { disabled: true } },
    });
  });

  it("disabled:false 遇到 file-form 条目时保留 file 字段（forward-compat）", () => {
    const snap = baseSnap();
    snap.themeOverrides = {
      clawd: {
        attention: { disabled: true, sourceThemeId: "clawd", file: "clawd-happy.svg" },
      },
    };
    const r = action(
      { themeId: "clawd", stateKey: "attention", disabled: false },
      { snapshot: snap },
    );
    assert.deepStrictEqual(r.commit.themeOverrides, {
      clawd: { attention: { sourceThemeId: "clawd", file: "clawd-happy.svg" } },
    });
  });

  it("主题隔离：themeA 的禁用不影响 themeB", () => {
    const snap = baseSnap();
    snap.themeOverrides = { calico: { attention: { disabled: true } } };
    const r = action(
      { themeId: "clawd", stateKey: "attention", disabled: true },
      { snapshot: snap },
    );
    assert.deepStrictEqual(r.commit.themeOverrides, {
      calico: { attention: { disabled: true } },
      clawd:  { attention: { disabled: true } },
    });
  });

  it("非白名单 stateKey 被拒绝", () => {
    for (const badKey of ["idle", "working", "juggling", "thinking", "sleeping", "waking"]) {
      const r = action(
        { themeId: "clawd", stateKey: badKey, disabled: true },
        { snapshot: baseSnap() },
      );
      assert.strictEqual(r.status, "error", `${badKey} 应该被拒绝`);
    }
  });

  it("白名单 stateKey 全部接受", () => {
    for (const key of ONESHOT_OVERRIDE_STATES) {
      const r = action(
        { themeId: "clawd", stateKey: key, disabled: true },
        { snapshot: baseSnap() },
      );
      assert.strictEqual(r.status, "ok", `${key} 应该被接受`);
    }
  });

  it("disabled 必须是 boolean", () => {
    const r = action(
      { themeId: "clawd", stateKey: "attention", disabled: "yes" },
      { snapshot: baseSnap() },
    );
    assert.strictEqual(r.status, "error");
  });

  it("themeId 必须非空字符串", () => {
    const r1 = action(
      { themeId: "", stateKey: "attention", disabled: true },
      { snapshot: baseSnap() },
    );
    const r2 = action(
      { themeId: null, stateKey: "attention", disabled: true },
      { snapshot: baseSnap() },
    );
    assert.strictEqual(r1.status, "error");
    assert.strictEqual(r2.status, "error");
  });

  it("payload 非 object 报错", () => {
    assert.strictEqual(action(null, { snapshot: baseSnap() }).status, "error");
    assert.strictEqual(action("clawd", { snapshot: baseSnap() }).status, "error");
  });
});

describe("resetThemeOverrides", () => {
  const action = commandRegistry.resetThemeOverrides;
  const baseSnap = () => ({ ...prefs.getDefaults(), themeOverrides: {} });

  it("清空当前主题的所有 overrides", () => {
    const snap = baseSnap();
    snap.themeOverrides = {
      clawd: {
        attention: { disabled: true },
        notification: { disabled: true },
      },
      calico: { error: { disabled: true } },
    };
    const r = action({ themeId: "clawd" }, { snapshot: snap });
    assert.strictEqual(r.status, "ok");
    // clawd 整条清掉，calico 保留
    assert.deepStrictEqual(r.commit.themeOverrides, {
      calico: { error: { disabled: true } },
    });
  });

  it("该主题没有 override 时 noop", () => {
    const r = action({ themeId: "clawd" }, { snapshot: baseSnap() });
    assert.strictEqual(r.status, "ok");
    assert.strictEqual(r.noop, true);
    assert.ok(!r.commit);
  });

  it("接受字符串 payload 简写", () => {
    const snap = baseSnap();
    snap.themeOverrides = { clawd: { attention: { disabled: true } } };
    const r = action("clawd", { snapshot: snap });
    assert.strictEqual(r.status, "ok");
    assert.deepStrictEqual(r.commit.themeOverrides, {});
  });

  it("空 themeId 报错", () => {
    const r = action({ themeId: "" }, { snapshot: baseSnap() });
    assert.strictEqual(r.status, "error");
  });
});
