"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

const {
  classifyHookPayload,
  classifySessionMeta,
  normalizeRole,
} = require("../hooks/codex-subagent-fields");

describe("codex-subagent-fields", () => {
  it("classifies root session_meta from current Codex CLI shape", () => {
    assert.strictEqual(classifySessionMeta({
      source: "cli",
      originator: "codex-tui",
    }), "root");
  });

  it("classifies subagent session_meta from source.subagent thread_spawn", () => {
    assert.strictEqual(classifySessionMeta({
      source: {
        subagent: {
          thread_spawn: {
            parent_thread_id: "parent-1",
            depth: 1,
            agent_role: "explorer",
          },
        },
      },
      agent_role: "explorer",
    }), "subagent");
  });

  it("classifies explicit hook roles and parent ids", () => {
    assert.strictEqual(classifyHookPayload({ codex_session_role: "subagent" }), "subagent");
    assert.strictEqual(classifyHookPayload({ codex_session_role: "root" }), "root");
    assert.strictEqual(classifyHookPayload({ parent_session_id: "root-session" }), "subagent");
  });

  it("uses known agent_role values without throwing on missing fields", () => {
    assert.strictEqual(classifySessionMeta({ agent_role: "worker" }), "subagent");
    assert.strictEqual(classifySessionMeta({ agent_role: "primary" }), "root");
    assert.strictEqual(classifySessionMeta({}), "unknown");
    assert.strictEqual(classifySessionMeta(null), "unknown");
  });

  it("normalizes unknown values conservatively", () => {
    assert.strictEqual(normalizeRole("explorer"), "subagent");
    assert.strictEqual(normalizeRole("main"), "root");
    assert.strictEqual(normalizeRole("default"), "unknown");
    assert.strictEqual(classifyHookPayload({ agent_type: "default" }), "unknown");
    assert.strictEqual(classifySessionMeta({ agent_type: "default" }), "unknown");
    assert.strictEqual(normalizeRole("unexpected-new-role"), "unknown");
  });
});
