"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  isAllowedLogBasename,
  openClawdLog,
  resolveClawdLogTarget,
} = require("../src/doctor-logs");

describe("doctor log opener", () => {
  it("accepts only bare .log file names", () => {
    assert.strictEqual(isAllowedLogBasename("permission-debug.log"), true);
    assert.strictEqual(isAllowedLogBasename("codex-hook-debug.jsonl"), false);
    assert.strictEqual(isAllowedLogBasename("../permission-debug.log"), false);
    assert.strictEqual(isAllowedLogBasename("nested/permission-debug.log"), false);
  });

  it("resolves the newest allowed log across ~/.clawd and userData", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clawd-doctor-logs-"));
    const homeDir = path.join(tmp, "home");
    const userDataDir = path.join(tmp, "userData");
    const clawdDir = path.join(homeDir, ".clawd");
    fs.mkdirSync(clawdDir, { recursive: true });
    fs.mkdirSync(userDataDir, { recursive: true });
    const oldLog = path.join(clawdDir, "gemini-debug.log");
    const newLog = path.join(userDataDir, "permission-debug.log");
    fs.writeFileSync(oldLog, "old");
    fs.writeFileSync(newLog, "new");
    const oldTime = new Date(Date.now() - 10_000);
    const newTime = new Date();
    fs.utimesSync(oldLog, oldTime, oldTime);
    fs.utimesSync(newLog, newTime, newTime);

    const target = resolveClawdLogTarget({ homeDir, userDataDir });

    assert.strictEqual(target.status, "file");
    assert.strictEqual(target.path, newLog);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("includes focus-debug.log in default log discovery", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clawd-doctor-focus-log-"));
    const userDataDir = path.join(tmp, "userData");
    fs.mkdirSync(userDataDir, { recursive: true });
    const focusLog = path.join(userDataDir, "focus-debug.log");
    fs.writeFileSync(focusLog, "focus");

    const target = resolveClawdLogTarget({ homeDir: tmp, userDataDir });

    assert.strictEqual(target.status, "file");
    assert.strictEqual(target.path, focusLog);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("rejects path traversal requests", () => {
    const target = resolveClawdLogTarget({
      requested: "../permission-debug.log",
      homeDir: os.tmpdir(),
    });

    assert.deepStrictEqual(target, { status: "error", reason: "invalid-log-name" });
  });

  it("opens the fallback ~/.clawd directory when no log exists", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clawd-doctor-log-open-"));
    const opened = [];
    const result = await openClawdLog({
      homeDir: tmp,
      shell: {
        openPath: async (target) => {
          opened.push(target);
          return "";
        },
      },
    });

    assert.strictEqual(result.status, "ok");
    assert.strictEqual(result.opened, "directory");
    assert.strictEqual(opened[0], path.join(tmp, ".clawd"));
    assert.strictEqual(fs.existsSync(opened[0]), true);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
