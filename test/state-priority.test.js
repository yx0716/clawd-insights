"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

const {
  SLEEP_SEQUENCE,
  STATE_PRIORITY,
  ONESHOT_STATES,
  createStatePriorityConstants,
  getStatePriority,
  resolveDominantSessionState,
  resolveDisplayStateFromSessions,
} = require("../src/state-priority");

function session(state, overrides = {}) {
  return { state, updatedAt: 1000, headless: false, ...overrides };
}

describe("state-priority constants", () => {
  it("defines the public priority and state sets", () => {
    assert.deepStrictEqual(STATE_PRIORITY, {
      error: 8,
      notification: 7,
      sweeping: 6,
      attention: 5,
      carrying: 4,
      juggling: 4,
      working: 3,
      thinking: 2,
      idle: 1,
      sleeping: 0,
    });
    assert.deepStrictEqual([...SLEEP_SEQUENCE], ["yawning", "dozing", "collapsing", "sleeping", "waking"]);
    assert.deepStrictEqual([...ONESHOT_STATES], ["attention", "error", "sweeping", "notification", "carrying"]);
    assert.strictEqual(Object.isFrozen(STATE_PRIORITY), true);
    assert.strictEqual(getStatePriority("working"), 3);
    assert.strictEqual(getStatePriority("unknown"), 0);
  });

  it("creates fresh mutable constant copies for each state runtime", () => {
    const first = createStatePriorityConstants();
    const second = createStatePriorityConstants();

    first.STATE_PRIORITY.error = 1;
    first.ONESHOT_STATES.delete("error");
    first.SLEEP_SEQUENCE.delete("sleeping");

    assert.strictEqual(second.STATE_PRIORITY.error, 8);
    assert.strictEqual(second.ONESHOT_STATES.has("error"), true);
    assert.strictEqual(second.SLEEP_SEQUENCE.has("sleeping"), true);
  });
});

describe("state-priority display selection", () => {
  it("picks idle for no sessions or all-headless sessions", () => {
    assert.strictEqual(resolveDominantSessionState(new Map()), "idle");
    assert.strictEqual(resolveDominantSessionState(new Map([
      ["h1", session("error", { headless: true })],
      ["h2", session("working", { headless: true })],
    ])), "idle");
  });

  it("picks the highest non-headless session priority and preserves tie order", () => {
    assert.strictEqual(resolveDominantSessionState(new Map([
      ["s1", session("working")],
      ["s2", session("error")],
    ])), "error");

    assert.strictEqual(resolveDominantSessionState(new Map([
      ["s1", session("carrying")],
      ["s2", session("juggling")],
    ])), "carrying");
  });

  it("applies permission locks and update overlays with strict priority comparison", () => {
    const sessions = new Map([["s1", session("working")]]);
    assert.strictEqual(resolveDisplayStateFromSessions(sessions), "working");
    assert.strictEqual(resolveDisplayStateFromSessions(sessions, {
      permissionLocked: true,
    }), "notification");
    assert.strictEqual(resolveDisplayStateFromSessions(sessions, {
      updateVisualState: "thinking",
      updateVisualPriority: STATE_PRIORITY.notification,
    }), "thinking");
    assert.strictEqual(resolveDisplayStateFromSessions(new Map([["s1", session("notification")]]), {
      updateVisualState: "thinking",
      updateVisualPriority: STATE_PRIORITY.notification,
    }), "notification");
    assert.strictEqual(resolveDisplayStateFromSessions(new Map([["s1", session("error")]]), {
      updateVisualState: "thinking",
      updateVisualPriority: STATE_PRIORITY.notification,
    }), "error");
  });

  it("keeps equal-priority update overlays below permission locks", () => {
    assert.strictEqual(resolveDisplayStateFromSessions(new Map(), {
      permissionLocked: true,
      updateVisualState: "thinking",
      updateVisualPriority: STATE_PRIORITY.notification,
    }), "notification");
  });
});
