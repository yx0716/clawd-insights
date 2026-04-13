"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

const { isAgentEnabled } = require("../src/agent-gate");
const { commandRegistry } = require("../src/settings-actions");
const prefs = require("../src/prefs");

describe("isAgentEnabled", () => {
  it("returns true when snapshot is missing", () => {
    assert.strictEqual(isAgentEnabled(null, "codex"), true);
    assert.strictEqual(isAgentEnabled(undefined, "codex"), true);
    assert.strictEqual(isAgentEnabled({}, "codex"), true);
  });

  it("returns true when agentId is missing", () => {
    const snap = prefs.getDefaults();
    assert.strictEqual(isAgentEnabled(snap, null), true);
    assert.strictEqual(isAgentEnabled(snap, ""), true);
  });

  it("returns true when agents field is absent (legacy upgrade)", () => {
    assert.strictEqual(isAgentEnabled({ lang: "en" }, "codex"), true);
  });

  it("returns true when the agent id is not in the map", () => {
    // Unknown agent ids default-true so a freshly-added registry agent isn't
    // accidentally off for every existing install.
    const snap = prefs.getDefaults();
    assert.strictEqual(isAgentEnabled(snap, "future-agent-id"), true);
  });

  it("returns true when enabled is not false", () => {
    const snap = { agents: { codex: { enabled: true } } };
    assert.strictEqual(isAgentEnabled(snap, "codex"), true);
  });

  it("returns false only when enabled === false", () => {
    assert.strictEqual(
      isAgentEnabled({ agents: { codex: { enabled: false } } }, "codex"),
      false
    );
  });

  it("treats malformed agent entries as enabled", () => {
    assert.strictEqual(isAgentEnabled({ agents: { codex: "nope" } }, "codex"), true);
    assert.strictEqual(isAgentEnabled({ agents: { codex: null } }, "codex"), true);
  });
});

describe("setAgentEnabled command", () => {
  function makeDeps(overrides = {}) {
    const calls = {
      startMonitorForAgent: [],
      stopMonitorForAgent: [],
      clearSessionsByAgent: [],
      dismissPermissionsByAgent: [],
    };
    return {
      calls,
      deps: {
        snapshot: prefs.getDefaults(),
        startMonitorForAgent: (id) => calls.startMonitorForAgent.push(id),
        stopMonitorForAgent: (id) => calls.stopMonitorForAgent.push(id),
        clearSessionsByAgent: (id) => calls.clearSessionsByAgent.push(id),
        dismissPermissionsByAgent: (id) => calls.dismissPermissionsByAgent.push(id),
        ...overrides,
      },
    };
  }

  it("rejects missing agentId", () => {
    const { deps } = makeDeps();
    const r = commandRegistry.setAgentEnabled({ enabled: false }, deps);
    assert.strictEqual(r.status, "error");
  });

  it("rejects non-boolean enabled", () => {
    const { deps } = makeDeps();
    const r = commandRegistry.setAgentEnabled({ agentId: "codex", enabled: "off" }, deps);
    assert.strictEqual(r.status, "error");
  });

  it("is noop when value already matches current state", () => {
    const { deps, calls } = makeDeps();
    const r = commandRegistry.setAgentEnabled(
      { agentId: "codex", enabled: true },
      deps
    );
    assert.strictEqual(r.status, "ok");
    assert.strictEqual(r.noop, true);
    assert.strictEqual(calls.stopMonitorForAgent.length, 0);
    assert.strictEqual(calls.startMonitorForAgent.length, 0);
  });

  it("disabling runs stop + clear sessions + dismiss permissions (in that order)", () => {
    const { deps, calls } = makeDeps();
    const r = commandRegistry.setAgentEnabled(
      { agentId: "codex", enabled: false },
      deps
    );
    assert.strictEqual(r.status, "ok");
    assert.deepStrictEqual(calls.stopMonitorForAgent, ["codex"]);
    assert.deepStrictEqual(calls.clearSessionsByAgent, ["codex"]);
    assert.deepStrictEqual(calls.dismissPermissionsByAgent, ["codex"]);
    assert.strictEqual(calls.startMonitorForAgent.length, 0);
    // Commit must flip just this agent's enabled flag.
    assert.strictEqual(r.commit.agents.codex.enabled, false);
    assert.strictEqual(r.commit.agents["claude-code"].enabled, true);
  });

  it("enabling an already-disabled agent starts the monitor", () => {
    const seeded = prefs.getDefaults();
    seeded.agents.codex = { enabled: false };
    const { deps, calls } = makeDeps({ snapshot: seeded });
    const r = commandRegistry.setAgentEnabled(
      { agentId: "codex", enabled: true },
      deps
    );
    assert.strictEqual(r.status, "ok");
    assert.deepStrictEqual(calls.startMonitorForAgent, ["codex"]);
    assert.strictEqual(calls.stopMonitorForAgent.length, 0);
    assert.strictEqual(r.commit.agents.codex.enabled, true);
  });

  it("propagates an error if a side effect throws, without committing", () => {
    const { deps } = makeDeps({
      stopMonitorForAgent: () => {
        throw new Error("boom");
      },
    });
    const r = commandRegistry.setAgentEnabled(
      { agentId: "codex", enabled: false },
      deps
    );
    assert.strictEqual(r.status, "error");
    assert.ok(r.message.includes("boom"));
    assert.strictEqual(r.commit, undefined);
  });

  it("missing side-effect deps are tolerated (simulates hook-only agent)", () => {
    // Hook-based agents like Copilot / Cursor have no monitor — the command
    // should still succeed; the route layer enforces the gate.
    const { deps } = makeDeps();
    delete deps.startMonitorForAgent;
    delete deps.stopMonitorForAgent;
    const r = commandRegistry.setAgentEnabled(
      { agentId: "copilot-cli", enabled: false },
      deps
    );
    assert.strictEqual(r.status, "ok");
    assert.strictEqual(r.commit.agents["copilot-cli"].enabled, false);
  });
});
