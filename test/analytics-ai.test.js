const { describe, it } = require("node:test");
const assert = require("node:assert");

const analyticsAI = require("../src/analytics-ai");

describe("analytics AI session context", () => {
  it("builds prompt context from conversation including assistant replies", () => {
    const detail = {
      agent: "codex",
      title: "Fix dashboard",
      cwd: "/tmp/project-alpha",
      timestamps: [
        new Date("2026-04-06T11:44:03.000Z").getTime(),
        new Date("2026-04-06T11:49:03.000Z").getTime(),
      ],
      conversation: [
        { role: "user", text: "时间线有漏抓吗" },
        { role: "assistant", text: "有两个漏点 一个是短会话 一个是 Cursor 时间戳粗粒度" },
      ],
      userMessages: [{ text: "时间线有漏抓吗" }],
    };

    const text = analyticsAI.__test.buildSessionContext(detail);

    assert.match(text, /## Conversation/);
    assert.match(text, /- 用户: 时间线有漏抓吗/);
    assert.match(text, /- 助手: 有两个漏点 一个是短会话 一个是 Cursor 时间戳粗粒度/);
    assert.doesNotMatch(text, /## Activity types/);
  });

  it("counts conversation entries for cache invalidation", () => {
    const detail = {
      conversation: [
        { role: "user", text: "a" },
        { role: "assistant", text: "b" },
        { role: "user", text: "c" },
      ],
      userMessages: [{ text: "a" }],
    };

    assert.strictEqual(analyticsAI.__test.getDetailContextEntryCount(detail), 3);
  });

  it("prefers the saved default analysis provider when available", () => {
    const picked = analyticsAI.__test.resolvePreferredAnalysisProvider(
      [
        { id: "claude-code", label: "Claude Code" },
        { id: "codex", label: "Codex" },
      ],
      { defaultAnalysisProvider: "codex" }
    );

    assert.strictEqual(picked.id, "codex");
  });

  it("falls back to the first available analysis provider when the saved one is missing", () => {
    const picked = analyticsAI.__test.resolvePreferredAnalysisProvider(
      [
        { id: "claude-code", label: "Claude Code" },
        { id: "codex", label: "Codex" },
      ],
      { defaultAnalysisProvider: "api:openai" }
    );

    assert.strictEqual(picked.id, "claude-code");
  });
});
