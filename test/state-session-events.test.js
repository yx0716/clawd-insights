"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

const {
  RECENT_EVENT_LIMIT,
  pushRecentEvent,
  pickDisplayHint,
} = require("../src/state-session-events");

describe("state session events", () => {
  it("pushes a rolling recent event history capped at RECENT_EVENT_LIMIT", () => {
    const sourceEvents = Array.from({ length: 10 }, (_, index) => ({
      at: index,
      event: `Event${index}`,
      state: "working",
    }));
    const existing = { recentEvents: sourceEvents };
    const result = pushRecentEvent(existing, "thinking", "NextEvent", { now: () => 99 });

    assert.strictEqual(result.length, RECENT_EVENT_LIMIT);
    assert.deepStrictEqual(
      result.map((entry) => entry.event),
      ["Event3", "Event4", "Event5", "Event6", "Event7", "Event8", "Event9", "NextEvent"]
    );
    assert.strictEqual(sourceEvents.length, 10);
    assert.notStrictEqual(result, sourceEvents);
  });

  it("records event, state, timestamp, and no persisted label", () => {
    const result = pushRecentEvent(null, null, null, { now: () => 1234 });

    assert.deepStrictEqual(result, [{
      at: 1234,
      event: null,
      state: "idle",
    }]);
    assert.ok(!("label" in result[0]));
  });

  it("picks only allowlisted hints for live display states", () => {
    const existing = { displayHint: "old.svg" };
    const displayHintMap = {
      "new.svg": "new.svg",
      "blank-but-valid.svg": "",
    };

    assert.strictEqual(pickDisplayHint("working", existing, "new.svg", displayHintMap), "new.svg");
    assert.strictEqual(pickDisplayHint("thinking", existing, "blank-but-valid.svg", displayHintMap), "blank-but-valid.svg");
    assert.strictEqual(pickDisplayHint("juggling", existing, "evil.svg", displayHintMap), "old.svg");
    assert.strictEqual(pickDisplayHint("idle", existing, "new.svg", displayHintMap), null);
  });

  it("preserves, clears, or drops display hints using the original incoming semantics", () => {
    const existing = { displayHint: "old.svg" };
    const displayHintMap = { "new.svg": "new.svg" };

    assert.strictEqual(pickDisplayHint("working", existing, undefined, displayHintMap), "old.svg");
    assert.strictEqual(pickDisplayHint("working", existing, null, displayHintMap), null);
    assert.strictEqual(pickDisplayHint("working", existing, "", displayHintMap), null);
    assert.strictEqual(pickDisplayHint("working", null, undefined, displayHintMap), null);
    assert.strictEqual(pickDisplayHint("working", { displayHint: null }, "evil.svg", displayHintMap), null);
  });
});
