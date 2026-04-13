"use strict";

// Unit tests for the per-agent permission-bubble sub-gate decision helper.
//
// Full HTTP integration isn't exercised here — the permission handler is
// inlined in server.js's req/res closure. This file covers the branch matrix
// that decides WHETHER a bubble should be suppressed; the actual side effects
// (res.destroy for CC, silent return for opencode) stay in the caller and
// are reviewed by reading the route code.
//
// Critical regression guards:
//  - ExitPlanMode must NEVER be suppressed — Plan Review would break
//  - AskUserQuestion must NEVER be suppressed — elicitations would hang
//  - PASSTHROUGH tools aren't covered here because they return BEFORE the
//    sub-gate even runs (see server.js /permission branch), so the sub-gate
//    helper is structurally never asked about them.

const { describe, it } = require("node:test");
const assert = require("node:assert");

const { shouldBypassBubbleForSubGate } = require("../src/server").__test;

function makeCtx({ enabled = true } = {}) {
  return {
    isAgentPermissionsEnabled: () => enabled,
  };
}

describe("shouldBypassBubbleForSubGate — cc branch", () => {
  it("returns false when the sub-gate is on (default install)", () => {
    const ctx = makeCtx({ enabled: true });
    assert.strictEqual(
      shouldBypassBubbleForSubGate(ctx, { toolName: "Bash", agentId: "claude-code", branch: "cc" }),
      false
    );
  });

  it("returns true when the sub-gate is off for a normal permission tool", () => {
    const ctx = makeCtx({ enabled: false });
    assert.strictEqual(
      shouldBypassBubbleForSubGate(ctx, { toolName: "Bash", agentId: "claude-code", branch: "cc" }),
      true
    );
    // Also covers codebuddy — same branch, different agentId.
    assert.strictEqual(
      shouldBypassBubbleForSubGate(ctx, { toolName: "Edit", agentId: "codebuddy", branch: "cc" }),
      true
    );
  });

  it("NEVER suppresses ExitPlanMode — Plan Review is a UX flow, not a perm bubble", () => {
    // Even with the sub-gate forcibly off, ExitPlanMode must pass through.
    const ctx = makeCtx({ enabled: false });
    assert.strictEqual(
      shouldBypassBubbleForSubGate(ctx, { toolName: "ExitPlanMode", agentId: "claude-code", branch: "cc" }),
      false
    );
  });

  it("NEVER suppresses AskUserQuestion — elicitations would hang CC", () => {
    const ctx = makeCtx({ enabled: false });
    assert.strictEqual(
      shouldBypassBubbleForSubGate(ctx, { toolName: "AskUserQuestion", agentId: "claude-code", branch: "cc" }),
      false
    );
  });

  it("treats missing isAgentPermissionsEnabled as default-on (no suppress)", () => {
    // If the ctx predates the sub-gate wiring, fall through rather than
    // silently suppressing — matches the default-true gate semantics.
    assert.strictEqual(
      shouldBypassBubbleForSubGate({}, { toolName: "Bash", agentId: "claude-code", branch: "cc" }),
      false
    );
  });
});

describe("shouldBypassBubbleForSubGate — opencode branch", () => {
  it("returns false when the sub-gate is on", () => {
    const ctx = makeCtx({ enabled: true });
    assert.strictEqual(
      shouldBypassBubbleForSubGate(ctx, { toolName: "bash", agentId: "opencode", branch: "opencode" }),
      false
    );
  });

  it("returns true when the sub-gate is off (silent drop → TUI fallback)", () => {
    const ctx = makeCtx({ enabled: false });
    assert.strictEqual(
      shouldBypassBubbleForSubGate(ctx, { toolName: "bash", agentId: "opencode", branch: "opencode" }),
      true
    );
  });

  it("opencode branch ignores the passed agentId — always asks about 'opencode'", () => {
    // The opencode /permission path hard-codes agentId="opencode" because
    // the POST body always comes from the opencode plugin. Passing a bogus
    // id must not accidentally consult another agent's sub-gate.
    const calls = [];
    const ctx = {
      isAgentPermissionsEnabled: (id) => {
        calls.push(id);
        return false;
      },
    };
    shouldBypassBubbleForSubGate(ctx, { toolName: "bash", agentId: "totally-wrong", branch: "opencode" });
    assert.deepStrictEqual(calls, ["opencode"]);
  });

  it("treats missing isAgentPermissionsEnabled as default-on", () => {
    assert.strictEqual(
      shouldBypassBubbleForSubGate({}, { toolName: "bash", agentId: "opencode", branch: "opencode" }),
      false
    );
  });
});

describe("shouldBypassBubbleForSubGate — unknown branch", () => {
  it("returns false for unrecognized branch names (fail-open)", () => {
    // Future agent types that plug into /permission but don't update the
    // helper should NOT be silently suppressed — the default stance is
    // "don't interfere", and the route-layer code review will catch the
    // missing branch before it ships.
    const ctx = makeCtx({ enabled: false });
    assert.strictEqual(
      shouldBypassBubbleForSubGate(ctx, { toolName: "Bash", agentId: "future", branch: "future" }),
      false
    );
  });
});
