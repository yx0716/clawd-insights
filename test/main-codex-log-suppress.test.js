"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const createAgentRuntimeMain = require("../src/agent-runtime-main");

describe("main Codex official hook JSONL suppression", () => {
  it("suppresses guardian_assessment for hook-active Codex sessions", () => {
    assert.ok(
      createAgentRuntimeMain.CODEX_LOG_EVENTS_COVERED_BY_OFFICIAL_HOOKS.has("event_msg:guardian_assessment"),
      "guardian_assessment should not re-drive hook-active Codex sessions from JSONL"
    );
  });
});
