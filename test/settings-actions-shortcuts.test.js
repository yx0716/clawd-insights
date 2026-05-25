"use strict";

const test = require("node:test");
const assert = require("node:assert");

const prefs = require("../src/prefs");
const shortcutCommands = require("../src/settings-actions-shortcuts");

function makeDeps(overrides = {}) {
  const snapshot = overrides.snapshot || prefs.getDefaults();
  const registered = new Set(overrides.registered || []);
  const calls = { register: [], unregister: [] };
  const globalShortcut = {
    register(accelerator, handler) {
      calls.register.push({ accelerator, handler });
      if (overrides.failRegister && overrides.failRegister.has(accelerator)) return false;
      registered.add(accelerator);
      return true;
    },
    unregister(accelerator) {
      calls.unregister.push(accelerator);
      registered.delete(accelerator);
    },
    isRegistered(accelerator) {
      return registered.has(accelerator);
    },
  };
  return {
    deps: {
      snapshot,
      globalShortcut,
      shortcutHandlers: {
        togglePet: () => {},
      },
    },
    calls,
    registered,
  };
}

test("settings shortcut actions expose the command surface", () => {
  assert.deepStrictEqual(Object.keys(shortcutCommands).sort(), [
    "registerShortcut",
    "resetAllShortcuts",
    "resetShortcut",
  ]);
});

test("settings shortcut actions register persistent shortcuts with rollback-safe ordering", () => {
  const snapshot = prefs.validate({
    shortcuts: {
      togglePet: "Ctrl+J",
    },
  });
  const { deps, calls, registered } = makeDeps({
    snapshot,
    registered: [snapshot.shortcuts.togglePet],
  });

  const result = shortcutCommands.registerShortcut({
    actionId: "togglePet",
    accelerator: "Ctrl+K",
  }, deps);

  assert.strictEqual(result.status, "ok");
  assert.deepStrictEqual(result.commit.shortcuts.togglePet, "CommandOrControl+K");
  assert.deepStrictEqual(calls.register.map((call) => call.accelerator), ["CommandOrControl+K"]);
  assert.deepStrictEqual(calls.unregister, ["CommandOrControl+J"]);
  assert.deepStrictEqual([...registered].sort(), ["CommandOrControl+K"]);
});

test("settings shortcut actions reject contextual conflicts before touching globalShortcut", () => {
  const snapshot = prefs.getDefaults();
  const { deps, calls } = makeDeps({ snapshot });

  const result = shortcutCommands.registerShortcut({
    actionId: "permissionAllow",
    accelerator: snapshot.shortcuts.permissionDeny,
  }, deps);

  assert.strictEqual(result.status, "error");
  assert.match(result.message, /already bound to permissionDeny/);
  assert.deepStrictEqual(calls.register, []);
  assert.deepStrictEqual(calls.unregister, []);
});
