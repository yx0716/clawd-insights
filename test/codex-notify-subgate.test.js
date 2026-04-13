"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

const { shouldSuppressCodexNotifyBubble } = require("../src/permission").__test;

describe("shouldSuppressCodexNotifyBubble", () => {
  it("returns false for the default live path", () => {
    assert.strictEqual(
      shouldSuppressCodexNotifyBubble({
        doNotDisturb: false,
        hideBubbles: false,
        isAgentPermissionsEnabled: () => true,
      }),
      false
    );
  });

  it("returns true when the Codex per-agent bubble sub-gate is off", () => {
    const calls = [];
    assert.strictEqual(
      shouldSuppressCodexNotifyBubble({
        doNotDisturb: false,
        hideBubbles: false,
        isAgentPermissionsEnabled: (id) => {
          calls.push(id);
          return false;
        },
      }),
      true
    );
    assert.deepStrictEqual(calls, ["codex"]);
  });

  it("returns true when global bubble hiding is on", () => {
    assert.strictEqual(
      shouldSuppressCodexNotifyBubble({
        doNotDisturb: false,
        hideBubbles: true,
        isAgentPermissionsEnabled: () => true,
      }),
      true
    );
  });

  it("returns true during DND", () => {
    assert.strictEqual(
      shouldSuppressCodexNotifyBubble({
        doNotDisturb: true,
        hideBubbles: false,
        isAgentPermissionsEnabled: () => true,
      }),
      true
    );
  });

  it("fails open when isAgentPermissionsEnabled is absent", () => {
    assert.strictEqual(
      shouldSuppressCodexNotifyBubble({
        doNotDisturb: false,
        hideBubbles: false,
      }),
      false
    );
  });
});
