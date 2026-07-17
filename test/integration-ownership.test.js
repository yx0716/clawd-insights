// test/integration-ownership.test.js — claim-if-vacant ownership policy (fork).
//
// See src/integration-ownership.js. The stakes per row:
//   source-only user  → must claim, or `npm start` ships a dead integration
//   live install      → must defer, or dev runs steal hooks (the ping-pong bug)
//   stale install     → must claim, doubling as self-repair for dead hook paths

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

const { resolveIntegrationOwnership } = require("../src/integration-ownership");

const HOOK_CMD = (p) => `"/usr/local/bin/node" "${p}" PreToolUse`;

function settingsWithHook(scriptPath) {
  return JSON.stringify({
    hooks: {
      PreToolUse: [
        { matcher: "*", hooks: [{ type: "command", command: HOOK_CMD(scriptPath) }] },
      ],
    },
  });
}

function resolve({ isPackaged = false, env = {}, raw, exists = () => true } = {}) {
  return resolveIntegrationOwnership({
    isPackaged,
    env,
    settingsPath: "/fake/settings.json",
    readFileSync: () => {
      if (raw === undefined) { const e = new Error("ENOENT"); e.code = "ENOENT"; throw e; }
      return raw;
    },
    existsSync: exists,
  });
}

describe("integration ownership — claim-if-vacant", () => {
  it("packaged builds always own", () => {
    assert.deepStrictEqual(resolve({ isPackaged: true }), { owner: true, reason: "packaged" });
  });

  it("CLAWD_DEV_TAKE_HOOKS=1 forces ownership over a live install", () => {
    const r = resolve({
      env: { CLAWD_DEV_TAKE_HOOKS: "1" },
      raw: settingsWithHook("/Applications/Clawd Insights.app/x/clawd-hook.js"),
    });
    assert.deepStrictEqual(r, { owner: true, reason: "env-override" });
  });

  it("no settings.json → vacant → source-only run claims and installs hooks", () => {
    assert.deepStrictEqual(resolve({}), { owner: true, reason: "vacant" });
  });

  it("settings.json without clawd hooks → vacant → claims", () => {
    const r = resolve({ raw: JSON.stringify({ hooks: { PreToolUse: [] }, model: "opus" }) });
    assert.deepStrictEqual(r, { owner: true, reason: "vacant" });
  });

  it("hooks pointing at an existing script → deferred, dev run stays passive", () => {
    const p = "/Applications/Clawd Insights.app/Contents/Resources/app.asar.unpacked/hooks/clawd-hook.js";
    const r = resolve({ raw: settingsWithHook(p), exists: (q) => q === p });
    assert.deepStrictEqual(r, { owner: false, reason: "deferred" });
  });

  it("hooks pointing at a deleted build → vacant → claims (self-repair)", () => {
    const r = resolve({
      raw: settingsWithHook("/old/deleted/dist/clawd-hook.js"),
      exists: () => false,
    });
    assert.deepStrictEqual(r, { owner: true, reason: "vacant" });
  });

  it("unparseable settings.json → vacant (installer owns rewriting it safely)", () => {
    assert.deepStrictEqual(resolve({ raw: "{not json" }), { owner: true, reason: "vacant" });
  });

  it("tolerates unquoted command variants", () => {
    const p = "/some/dir/clawd-hook.js";
    const raw = JSON.stringify({
      hooks: { SessionStart: [{ hooks: [{ type: "command", command: `node ${p} SessionStart` }] }] },
    });
    const r = resolve({ raw, exists: (q) => q === p });
    assert.deepStrictEqual(r, { owner: false, reason: "deferred" });
  });
});
