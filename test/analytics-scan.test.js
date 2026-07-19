const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ANALYTICS_SCAN_PATH = require.resolve("../src/analytics-scan");
const INTERNAL_ANALYTICS_SUMMARY_MARKER = "[clawd-analytics-internal-summary-task]";

function writeCodexSession(homeDir, sessionId, cwd, prompts = ["first prompt", "second prompt", "third prompt"], timestamps = null) {
  const dateDir = path.join(homeDir, ".codex", "sessions", "2026", "04", "06");
  fs.mkdirSync(dateDir, { recursive: true });

  const filePath = path.join(
    dateDir,
    `rollout-2026-04-06T19-44-02-${sessionId}.jsonl`
  );
  const ts = timestamps || [
    "2026-04-06T11:44:02.000Z",
    "2026-04-06T11:44:03.000Z",
    "2026-04-06T11:44:04.000Z",
    "2026-04-06T11:44:05.000Z",
    "2026-04-06T11:44:06.000Z",
    "2026-04-06T11:44:07.000Z",
    "2026-04-06T11:44:08.000Z",
  ];
  const lines = [
    {
      timestamp: ts[0],
      type: "session_meta",
      payload: {
        id: sessionId,
        timestamp: ts[0],
        cwd,
      },
    },
    {
      timestamp: ts[1],
      type: "response_item",
      payload: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: prompts[0] }],
      },
    },
    {
      timestamp: ts[2],
      type: "response_item",
      payload: {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "first reply" }],
      },
    },
    {
      timestamp: ts[3],
      type: "response_item",
      payload: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: prompts[1] }],
      },
    },
    {
      timestamp: ts[4],
      type: "response_item",
      payload: {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "second reply" }],
      },
    },
    {
      timestamp: ts[5],
      type: "response_item",
      payload: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: prompts[2] }],
      },
    },
    {
      timestamp: ts[6],
      type: "response_item",
      payload: {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "third reply" }],
      },
    },
  ];

  fs.writeFileSync(filePath, lines.map(line => JSON.stringify(line)).join("\n") + "\n");
}

describe("analytics scan", () => {
  let tempHome;
  let previousHome;
  let previousUserProfile;

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), "analytics-scan-"));
    previousHome = process.env.HOME;
    previousUserProfile = process.env.USERPROFILE;
    process.env.HOME = tempHome;
    process.env.USERPROFILE = tempHome;
    delete require.cache[ANALYTICS_SCAN_PATH];
  });

  afterEach(() => {
    if (previousHome === undefined) delete process.env.HOME;
    else process.env.HOME = previousHome;

    if (previousUserProfile === undefined) delete process.env.USERPROFILE;
    else process.env.USERPROFILE = previousUserProfile;

    delete require.cache[ANALYTICS_SCAN_PATH];
    fs.rmSync(tempHome, { recursive: true, force: true });
  });

  it("includes codex sessions from non-hidden projects in analytics results", () => {
    const sessionId = "019d629b-5f09-73f1-b73c-7fd96130faca";
    const cwd = "/Users/jyx/Documents/1_explore/project-alpha";
    writeCodexSession(tempHome, sessionId, cwd);

    const initAnalyticsScan = require("../src/analytics-scan");
    const analyticsScan = initAnalyticsScan({});
    const startTs = new Date("2026-04-06T00:00:00+08:00").getTime();
    const endTs = new Date("2026-04-07T00:00:00+08:00").getTime();
    const data = analyticsScan.scanRange(startTs, endTs);

    assert.strictEqual(data.sessionCount, 1);
    assert.strictEqual(data.sessions[0].agent, "codex");
    assert.strictEqual(data.sessions[0].project, "project-alpha");
    assert.strictEqual(data.sessions[0].cwd, cwd);
    assert.strictEqual(data.sessions[0].messages, 6);
  });

  it("buckets session counts by latest active date", () => {
    const sessionId = "019d629b-5f09-73f1-b73c-7fd96130fad1";
    const cwd = "/Users/jyx/Documents/1_explore/project-alpha";
    const base = new Date(2026, 3, 6, 23, 55).getTime();
    const timestamps = [0, 1, 2, 10, 11, 12, 13].map(offset =>
      new Date(base + offset * 60_000).toISOString()
    );
    writeCodexSession(tempHome, sessionId, cwd, undefined, timestamps);

    const initAnalyticsScan = require("../src/analytics-scan");
    const analyticsScan = initAnalyticsScan({});
    const startTs = new Date(2026, 3, 6).getTime();
    const endTs = new Date(2026, 3, 8).getTime();
    const data = analyticsScan.scanRange(startTs, endTs);

    assert.strictEqual(data.sessionCount, 1);
    assert.strictEqual(data.dailySessions["2026-04-06"] || 0, 0);
    assert.strictEqual(data.dailySessions["2026-04-07"], 1);
  });

  it("filters out on-desk self-project sessions from analytics results", () => {
    writeCodexSession(
      tempHome,
      "019d629b-5f09-73f1-b73c-7fd96130fac1",
      "/Users/jyx/Documents/1_explore/clawd-on-desk"
    );
    writeCodexSession(
      tempHome,
      "019d629b-5f09-73f1-b73c-7fd96130fac2",
      "/Users/jyx/Documents/1_explore/on-desk"
    );
    writeCodexSession(
      tempHome,
      "019d629b-5f09-73f1-b73c-7fd96130fac4",
      "/Users/jyx/Documents/1_explore/clawd-insights"
    );
    writeCodexSession(
      tempHome,
      "019d629b-5f09-73f1-b73c-7fd96130fac3",
      "/Users/jyx/Documents/1_explore/cache-revolution"
    );

    const initAnalyticsScan = require("../src/analytics-scan");
    const analyticsScan = initAnalyticsScan({});
    const startTs = new Date("2026-04-06T00:00:00+08:00").getTime();
    const endTs = new Date("2026-04-07T00:00:00+08:00").getTime();
    const data = analyticsScan.scanRange(startTs, endTs);

    assert.strictEqual(data.sessionCount, 1);
    assert.strictEqual(data.sessions[0].project, "cache-revolution");
  });

  it("filters out internal analytics summary sessions regardless of cwd", () => {
    writeCodexSession(
      tempHome,
      "019d629b-5f09-73f1-b73c-7fd96130fac8",
      "/Users/jyx/Documents/1_explore/project-alpha",
      [
        `${INTERNAL_ANALYTICS_SUMMARY_MARKER}\nIgnore this marker.\nSummarize the session.`,
        "second prompt",
        "third prompt",
      ]
    );
    writeCodexSession(
      tempHome,
      "019d629b-5f09-73f1-b73c-7fd96130fac7",
      "/Users/jyx/Documents/1_explore/project-beta"
    );

    const initAnalyticsScan = require("../src/analytics-scan");
    const analyticsScan = initAnalyticsScan({});
    const startTs = new Date("2026-04-06T00:00:00+08:00").getTime();
    const endTs = new Date("2026-04-07T00:00:00+08:00").getTime();
    const data = analyticsScan.scanRange(startTs, endTs);

    assert.strictEqual(data.sessionCount, 1);
    assert.strictEqual(data.sessions[0].project, "project-beta");
  });

  it("captures assistant replies in codex session detail conversation", () => {
    const sessionId = "019d629b-5f09-73f1-b73c-7fd96130fac9";
    const cwd = "/Users/jyx/Documents/1_explore/project-alpha";
    writeCodexSession(tempHome, sessionId, cwd);

    const initAnalyticsScan = require("../src/analytics-scan");
    const analyticsScan = initAnalyticsScan({});
    const detail = analyticsScan.getSessionDetail(
      `rollout-2026-04-06T19-44-02-${sessionId}`,
      "codex"
    );

    assert.ok(detail);
    assert.deepStrictEqual(
      detail.conversation.map(entry => [entry.role, entry.text]),
      [
        ["user", "first prompt"],
        ["assistant", "first reply"],
        ["user", "second prompt"],
        ["assistant", "second reply"],
        ["user", "third prompt"],
        ["assistant", "third reply"],
      ]
    );
  });

  it("can scope codex session detail to a selected time range", () => {
    const sessionId = "019d629b-5f09-73f1-b73c-7fd96130fad0";
    const rolloutId = `rollout-2026-04-06T19-44-02-${sessionId}`;
    const cwd = "/Users/jyx/Documents/1_explore/project-alpha";
    writeCodexSession(tempHome, sessionId, cwd);

    const initAnalyticsScan = require("../src/analytics-scan");
    const analyticsScan = initAnalyticsScan({});
    const start = new Date("2026-04-06T11:44:05.000Z").getTime();
    const end = new Date("2026-04-06T11:44:06.000Z").getTime();
    const detail = analyticsScan.getSessionDetail(rolloutId, "codex", { start, end });

    assert.ok(detail);
    assert.strictEqual(detail.analysisId, `${rolloutId}@${start}-${end}`);
    assert.deepStrictEqual(detail.scope, { start, end });
    assert.deepStrictEqual(
      detail.conversation.map(entry => [entry.role, entry.text]),
      [
        ["user", "second prompt"],
        ["assistant", "second reply"],
      ]
    );
    assert.deepStrictEqual(detail.userMessages.map(entry => entry.text), ["second prompt"]);
    assert.deepStrictEqual(detail.timestamps, [start, end]);
  });

  // ── New source readers: openclaw / opencode / gemini-family ──

  function writeOpenclawSession(homeDir, sessionId, cwd) {
    const sessDir = path.join(homeDir, ".openclaw", "agents", "main", "sessions");
    fs.mkdirSync(sessDir, { recursive: true });
    const ts = (i) => `2026-04-06T11:44:0${i}.000Z`;
    const userMsg = (i, text) => ({
      type: "message", id: `u${i}`, timestamp: ts(i),
      message: { role: "user", content: [{ type: "text", text }] },
    });
    const assistantMsg = (i, text, tool) => ({
      type: "message", id: `a${i}`, timestamp: ts(i),
      message: {
        role: "assistant",
        content: [
          { type: "text", text },
          ...(tool ? [{ type: "toolCall", id: `t${i}`, name: tool, arguments: { file_path: "/x" } }] : []),
        ],
      },
    });
    const lines = [
      { type: "session", version: 3, id: sessionId, timestamp: ts(0), cwd },
      { type: "custom", customType: "model-snapshot", id: "c1", timestamp: ts(0), data: {} },
      userMsg(1, "openclaw first prompt"),
      assistantMsg(2, "openclaw first reply", "read"),
      { type: "message", id: "tr1", timestamp: ts(2), message: { role: "toolResult", content: [{ type: "text", text: "tool output noise" }] } },
      userMsg(3, "openclaw second prompt"),
      assistantMsg(4, "openclaw second reply"),
      userMsg(5, "openclaw third prompt"),
      assistantMsg(6, "openclaw third reply"),
    ];
    fs.writeFileSync(path.join(sessDir, `${sessionId}.jsonl`), lines.map(l => JSON.stringify(l)).join("\n") + "\n");
  }

  it("scans openclaw sessions and reads their detail", () => {
    const sessionId = "0798157f-aaaa-bbbb-cccc-000000000001";
    writeOpenclawSession(tempHome, sessionId, "/Users/jyx/.openclaw/workspace");

    const initAnalyticsScan = require("../src/analytics-scan");
    const analyticsScan = initAnalyticsScan({});
    const startTs = new Date("2026-04-06T00:00:00+08:00").getTime();
    const endTs = new Date("2026-04-07T00:00:00+08:00").getTime();
    const data = analyticsScan.scanRange(startTs, endTs);

    assert.strictEqual(data.sessionCount, 1);
    const sess = data.sessions[0];
    assert.strictEqual(sess.agent, "openclaw");
    assert.strictEqual(sess.project, "workspace");
    assert.strictEqual(sess.messages, 6); // 3 user + 3 assistant; toolResult not counted
    assert.strictEqual(sess.turns, 3);
    assert.strictEqual(sess.toolCalls.read, 1);
    assert.strictEqual(sess.firstUserMsg, "openclaw first prompt");

    const detail = analyticsScan.getSessionDetail(sessionId, "openclaw", null);
    assert.ok(detail);
    assert.strictEqual(detail.cwd, "/Users/jyx/.openclaw/workspace");
    assert.deepStrictEqual(
      detail.conversation.slice(0, 2).map(e => [e.role, e.text]),
      [["user", "openclaw first prompt"], ["assistant", "openclaw first reply"]]
    );
    // toolResult text must not leak into the conversation
    assert.ok(!detail.conversation.some(e => e.text.includes("tool output noise")));
    assert.strictEqual(detail.toolCalls.length, 1);
    assert.strictEqual(detail.toolCalls[0].name, "read");
  });

  function writeOpencodeSession(homeDir, sessionId, directory, title) {
    const storage = path.join(homeDir, ".local", "share", "opencode", "storage");
    const base = new Date("2026-04-06T11:44:00.000Z").getTime();
    fs.mkdirSync(path.join(storage, "session", "proj1"), { recursive: true });
    fs.writeFileSync(
      path.join(storage, "session", "proj1", `${sessionId}.json`),
      JSON.stringify({ id: sessionId, projectID: "proj1", directory, title, time: { created: base, updated: base + 6000 } })
    );
    const msgDir = path.join(storage, "message", sessionId);
    fs.mkdirSync(msgDir, { recursive: true });
    const writeMsg = (msgId, role, offsetMs) => {
      fs.writeFileSync(path.join(msgDir, `${msgId}.json`), JSON.stringify({
        id: msgId, sessionID: sessionId, role, time: { created: base + offsetMs },
      }));
    };
    const writePart = (msgId, partId, part) => {
      const partDir = path.join(storage, "part", msgId);
      fs.mkdirSync(partDir, { recursive: true });
      fs.writeFileSync(path.join(partDir, `${partId}.json`), JSON.stringify({
        id: partId, sessionID: sessionId, messageID: msgId, ...part,
      }));
    };
    for (let i = 0; i < 3; i++) {
      const u = `msg_u${i}`, a = `msg_a${i}`;
      writeMsg(u, "user", i * 2000);
      writePart(u, `prt_u${i}`, { type: "text", text: `opencode prompt ${i}` });
      writeMsg(a, "assistant", i * 2000 + 1000);
      writePart(a, `prt_a${i}0`, { type: "reasoning", text: "hidden reasoning" });
      writePart(a, `prt_a${i}1`, { type: "text", text: `opencode reply ${i}` });
      if (i === 0) writePart(a, `prt_a${i}2`, { type: "tool", callID: "c1", tool: "bash", state: { status: "completed", input: { command: "ls" } } });
    }
  }

  it("scans opencode sessions and reads their detail", () => {
    const sessionId = "ses_test0000000000000000000001";
    writeOpencodeSession(tempHome, sessionId, "/Users/jyx/repos/proj-beta", "Beta setup");

    const initAnalyticsScan = require("../src/analytics-scan");
    const analyticsScan = initAnalyticsScan({});
    const startTs = new Date("2026-04-06T00:00:00+08:00").getTime();
    const endTs = new Date("2026-04-07T00:00:00+08:00").getTime();
    const data = analyticsScan.scanRange(startTs, endTs);

    assert.strictEqual(data.sessionCount, 1);
    const sess = data.sessions[0];
    assert.strictEqual(sess.agent, "opencode");
    assert.strictEqual(sess.project, "proj-beta");
    assert.strictEqual(sess.title, "Beta setup");
    assert.strictEqual(sess.messages, 6);
    assert.strictEqual(sess.turns, 3);
    assert.strictEqual(sess.toolCalls.bash, 1);
    assert.strictEqual(sess.firstUserMsg, "opencode prompt 0");

    const detail = analyticsScan.getSessionDetail(sessionId, "opencode", null);
    assert.ok(detail);
    assert.strictEqual(detail.title, "Beta setup");
    assert.strictEqual(detail.cwd, "/Users/jyx/repos/proj-beta");
    assert.deepStrictEqual(
      detail.conversation.slice(0, 2).map(e => [e.role, e.text]),
      [["user", "opencode prompt 0"], ["assistant", "opencode reply 0"]]
    );
    // reasoning parts stay out of the conversation
    assert.ok(!detail.conversation.some(e => e.text.includes("hidden reasoning")));
    assert.strictEqual(detail.toolCalls.length, 1);
    assert.strictEqual(detail.toolCalls[0].name, "bash");
  });

  function writeGeminiFamilySession(homeDir, rootName, cwd) {
    const root = path.join(homeDir, rootName);
    const chatsDir = path.join(root, "tmp", "hash1234", "chats");
    fs.mkdirSync(chatsDir, { recursive: true });
    fs.writeFileSync(path.join(root, "projects.json"), JSON.stringify({ projects: { [cwd]: "hash1234" } }));
    const ts = (i) => `2026-04-06T11:44:0${i}.000Z`;
    const messages = [];
    for (let i = 0; i < 3; i++) {
      messages.push({ id: `u${i}`, type: "user", content: `gemini prompt ${i}`, timestamp: ts(i * 2) });
      messages.push({
        id: `g${i}`, type: "gemini", content: `gemini reply ${i}`, timestamp: ts(i * 2 + 1),
        ...(i === 0 ? { toolCalls: [{ name: "run_shell_command", status: "success", args: { command: "ls" } }] } : {}),
      });
    }
    fs.writeFileSync(
      path.join(chatsDir, "session-2026-04-06-abc.json"),
      JSON.stringify({ sessionId: "abc", startTime: ts(0), lastUpdated: ts(5), messages })
    );
  }

  it("scans gemini and qwen sessions with shared reader", () => {
    writeGeminiFamilySession(tempHome, ".gemini", "/Users/jyx/repos/proj-gamma");
    writeGeminiFamilySession(tempHome, ".qwen", "/Users/jyx/repos/proj-delta");

    const initAnalyticsScan = require("../src/analytics-scan");
    const analyticsScan = initAnalyticsScan({});
    const startTs = new Date("2026-04-06T00:00:00+08:00").getTime();
    const endTs = new Date("2026-04-07T00:00:00+08:00").getTime();
    const data = analyticsScan.scanRange(startTs, endTs);

    assert.strictEqual(data.sessionCount, 2);
    const gem = data.sessions.find(s => s.agent === "gemini-cli");
    const qwen = data.sessions.find(s => s.agent === "qwen-code");
    assert.ok(gem && qwen);
    assert.strictEqual(gem.project, "proj-gamma");
    assert.strictEqual(qwen.project, "proj-delta");
    assert.strictEqual(gem.messages, 6);
    assert.strictEqual(gem.turns, 3);
    assert.strictEqual(gem.toolCalls.run_shell_command, 1);
    assert.strictEqual(gem.firstUserMsg, "gemini prompt 0");

    const detail = analyticsScan.getSessionDetail("session-2026-04-06-abc", "gemini-cli", null);
    assert.ok(detail);
    assert.strictEqual(detail.cwd, "/Users/jyx/repos/proj-gamma");
    assert.deepStrictEqual(
      detail.conversation.slice(0, 2).map(e => [e.role, e.text]),
      [["user", "gemini prompt 0"], ["assistant", "gemini reply 0"]]
    );
    assert.strictEqual(detail.toolCalls.length, 1);
    assert.strictEqual(detail.toolCalls[0].name, "run_shell_command");
  });
});
