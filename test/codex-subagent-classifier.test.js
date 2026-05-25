"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

const CodexSubagentClassifier = require("../agents/codex-subagent-classifier");

describe("CodexSubagentClassifier", () => {
  it("registers root and subagent sessions from session metadata", () => {
    const classifier = new CodexSubagentClassifier();

    assert.strictEqual(classifier.registerSession("codex:root", {
      sessionMeta: { source: "cli" },
    }), "root");
    assert.strictEqual(classifier.classify("codex:root"), "root");

    assert.strictEqual(classifier.registerSession("codex:sub", {
      sessionMeta: { source: { subagent: { thread_spawn: { agent_role: "explorer" } } } },
    }), "subagent");
    assert.strictEqual(classifier.classify("codex:sub"), "subagent");
  });

  it("keeps unknown sessions unknown", () => {
    const classifier = new CodexSubagentClassifier();
    assert.strictEqual(classifier.registerSession("codex:unknown", { sessionMeta: {} }), "unknown");
    assert.strictEqual(classifier.classify("codex:unknown"), "unknown");
  });

  it("allows unknown to upgrade and root to upgrade to subagent", () => {
    const classifier = new CodexSubagentClassifier();

    classifier.registerSession("codex:s1", { sessionMeta: {} });
    assert.strictEqual(classifier.registerSession("codex:s1", {
      sessionMeta: { source: "cli" },
    }), "root");
    assert.strictEqual(classifier.registerSession("codex:s1", {
      hookRole: "subagent",
    }), "subagent");
  });

  it("does not downgrade subagent sessions to root", () => {
    const classifier = new CodexSubagentClassifier();

    classifier.registerSession("codex:s1", { hookRole: "subagent" });
    assert.strictEqual(classifier.registerSession("codex:s1", {
      sessionMeta: { source: "cli" },
    }), "subagent");
    assert.strictEqual(classifier.classify("codex:s1"), "subagent");
  });

  it("evicts least-recently-used entries over capacity", () => {
    const classifier = new CodexSubagentClassifier({ capacity: 2 });

    classifier.registerSession("a", { hookRole: "root" });
    classifier.registerSession("b", { hookRole: "root" });
    assert.strictEqual(classifier.classify("a"), "root");
    classifier.registerSession("c", { hookRole: "root" });

    assert.strictEqual(classifier.classify("b"), "unknown");
    assert.strictEqual(classifier.classify("a"), "root");
    assert.strictEqual(classifier.classify("c"), "root");
  });

  it("clears a session", () => {
    const classifier = new CodexSubagentClassifier();
    classifier.registerSession("codex:s1", { hookRole: "subagent" });
    classifier.clear("codex:s1");
    assert.strictEqual(classifier.classify("codex:s1"), "unknown");
  });
});
