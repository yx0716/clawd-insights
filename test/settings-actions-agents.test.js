"use strict";

const test = require("node:test");
const assert = require("node:assert");

const prefs = require("../src/prefs");
const agentCommands = require("../src/settings-actions-agents");

test("settings agent actions expose the command surface", () => {
  assert.deepStrictEqual(Object.keys(agentCommands).sort(), [
    "repairAgentIntegration",
    "setAgentFlag",
    "setAgentPermissionMode",
  ]);
});

test("settings agent actions enable an agent and preserve sibling flags", () => {
  const snapshot = prefs.getDefaults();
  snapshot.agents.codex = {
    enabled: false,
    permissionsEnabled: false,
    notificationHookEnabled: true,
    permissionMode: "intercept",
  };
  const calls = {
    syncIntegrationForAgent: [],
    startMonitorForAgent: [],
  };
  const deps = {
    snapshot,
    syncIntegrationForAgent: (agentId) => calls.syncIntegrationForAgent.push(agentId),
    startMonitorForAgent: (agentId) => calls.startMonitorForAgent.push(agentId),
  };

  const result = agentCommands.setAgentFlag(
    { agentId: "codex", flag: "enabled", value: true },
    deps
  );

  assert.strictEqual(result.status, "ok");
  assert.deepStrictEqual(calls.syncIntegrationForAgent, ["codex"]);
  assert.deepStrictEqual(calls.startMonitorForAgent, ["codex"]);
  assert.strictEqual(result.commit.agents.codex.enabled, true);
  assert.strictEqual(result.commit.agents.codex.permissionsEnabled, false);
  assert.strictEqual(result.commit.agents.codex.notificationHookEnabled, true);
  assert.strictEqual(result.commit.agents.codex.permissionMode, "intercept");
});

test("settings agent actions switch Codex permission mode and dismiss pending bubbles", () => {
  const snapshot = prefs.getDefaults();
  snapshot.agents.codex.permissionMode = "intercept";
  const calls = { dismissPermissionsByAgent: [] };
  const deps = {
    snapshot,
    dismissPermissionsByAgent: (agentId) => calls.dismissPermissionsByAgent.push(agentId),
  };

  const result = agentCommands.setAgentPermissionMode(
    { agentId: "codex", mode: "native" },
    deps
  );

  assert.strictEqual(result.status, "ok");
  assert.strictEqual(result.commit.agents.codex.permissionMode, "native");
  assert.strictEqual(result.commit.agents.codex.enabled, true);
  assert.deepStrictEqual(calls.dismissPermissionsByAgent, ["codex"]);
});

test("settings agent actions repair Codex with the forced hooks feature option", async () => {
  const snapshot = prefs.getDefaults();
  const calls = [];
  const deps = {
    snapshot,
    repairIntegrationForAgent: async (agentId, options) => {
      calls.push({ agentId, options });
      return { status: "ok", message: "codex repaired" };
    },
  };

  const result = await agentCommands.repairAgentIntegration(
    { agentId: "codex", forceCodexHooksFeature: true },
    deps
  );

  assert.strictEqual(result.status, "ok");
  assert.strictEqual(result.message, "codex repaired");
  assert.deepStrictEqual(calls, [
    { agentId: "codex", options: { forceCodexHooksFeature: true } },
  ]);
});

test("settings agent actions report repair payload errors with the repair command name", async () => {
  const result = await agentCommands.repairAgentIntegration({}, {
    snapshot: prefs.getDefaults(),
    repairIntegrationForAgent: async () => {
      throw new Error("should not run");
    },
  });

  assert.strictEqual(result.status, "error");
  assert.match(result.message, /repairAgentIntegration\.agentId/);
});
