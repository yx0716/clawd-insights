"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  createConnectionTestDeduper,
  evaluateConnectionTest,
  runConnectionTest,
  scanFileMtimeActivity,
} = require("../src/doctor-hook-activity");

describe("doctor hook activity connection test", () => {
  it("passes when any HTTP event was accepted", () => {
    const result = evaluateConnectionTest({
      events: [{ agentId: "codex", route: "state", outcome: "accepted" }],
    });

    assert.strictEqual(result.status, "http-verified");
    assert.strictEqual(result.level, null);
    assert.match(result.detail, /codex/);
  });

  it("warns when HTTP works but events are dropped by gates", () => {
    const result = evaluateConnectionTest({
      events: [
        { agentId: "claude-code", route: "state", outcome: "dropped-by-dnd" },
        { agentId: "codex", route: "permission", outcome: "dropped-by-disabled" },
      ],
    });

    assert.strictEqual(result.status, "http-dropped");
    assert.strictEqual(result.level, "warning");
    assert.match(result.detail, /dropped-by-disabled/);
    assert.match(result.detail, /dropped-by-dnd/);
  });

  it("warns when Codex fallback files changed but no HTTP event arrived", () => {
    const result = evaluateConnectionTest({
      fileActivity: [{ agentId: "codex", source: "file-mtime", count: 1 }],
    });

    assert.strictEqual(result.status, "http-blocked");
    assert.strictEqual(result.level, "warning");
    assert.match(result.detail, /codex/);
  });

  it("warns when nothing changed during the window", () => {
    const result = evaluateConnectionTest({});

    assert.strictEqual(result.status, "no-activity");
    assert.strictEqual(result.level, "warning");
  });

  it("scans only Codex fallback mtime activity without collecting file names in the summary", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clawd-doctor-activity-"));
    const since = Date.now() - 1000;
    const codexDir = path.join(tmp, ".codex", "sessions", "2026", "04", "28");
    const geminiDir = path.join(tmp, ".gemini", "tmp", "project", "chats");
    fs.mkdirSync(codexDir, { recursive: true });
    fs.mkdirSync(geminiDir, { recursive: true });
    fs.writeFileSync(path.join(codexDir, "rollout-2026-04-28T00-00-00-11111111-2222-3333-4444-555555555555.jsonl"), "{}\n");
    fs.writeFileSync(path.join(geminiDir, "session-abc.json"), "{}");

    const activity = scanFileMtimeActivity({ homeDir: tmp, since });

    assert.deepStrictEqual(activity.map((entry) => entry.agentId).sort(), ["codex"]);
    assert.ok(activity.every((entry) => !Object.prototype.hasOwnProperty.call(entry, "path")));
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("waits for the requested window and then evaluates server events", async () => {
    let waited = 0;
    const result = await runConnectionTest({
      durationMs: 1000,
      startedAt: Date.now() - 1,
      setTimeout: (fn, ms) => {
        waited = ms;
        fn();
      },
      server: {
        getRecentHookEvents: () => [{ agentId: "codex", route: "state", outcome: "accepted" }],
      },
      fileActivity: [],
    });

    assert.strictEqual(waited, 1000);
    assert.strictEqual(result.status, "http-verified");
    assert.strictEqual(result.events.length, 1);
  });

  it("deduplicates concurrent connection tests and resets after completion", async () => {
    let calls = 0;
    const resolvers = [];
    const completed = [];
    const runGuarded = createConnectionTestDeduper((input) => {
      calls++;
      return new Promise((resolve) => {
        resolvers.push(() => resolve({ status: "ok", marker: input.marker }));
      });
    }, {
      onResult: (result) => completed.push(result.marker),
    });

    const first = runGuarded({ marker: "first" });
    const second = runGuarded({ marker: "second" });
    assert.strictEqual(first, second);
    assert.strictEqual(calls, 1);

    resolvers.shift()();
    assert.deepStrictEqual(await second, { status: "ok", marker: "first" });
    assert.deepStrictEqual(completed, ["first"]);

    const third = runGuarded({ marker: "third" });
    assert.notStrictEqual(third, first);
    assert.strictEqual(calls, 2);
    resolvers.shift()();
    assert.deepStrictEqual(await third, { status: "ok", marker: "third" });
    assert.deepStrictEqual(completed, ["first", "third"]);
  });
});
