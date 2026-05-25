const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  CODEX_DEBUG_HOOK_EVENTS,
  __test,
  buildCodexDebugHookCommand,
  ensureCodexHooksFeature,
  registerCodexDebugHooks,
  timeoutForEvent,
  unregisterCodexDebugHooks,
} = require("../hooks/codex-debug-install");

const MARKER = "codex-debug-hook.js";
const tempDirs = [];

function makeTempCodexDir(initialHooks = null, configText = null) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clawd-codex-debug-"));
  const codexDir = path.join(tmpDir, ".codex");
  fs.mkdirSync(codexDir, { recursive: true });
  if (initialHooks !== null) {
    fs.writeFileSync(path.join(codexDir, "hooks.json"), JSON.stringify(initialHooks, null, 2), "utf8");
  }
  if (configText !== null) {
    fs.writeFileSync(path.join(codexDir, "config.toml"), configText, "utf8");
  }
  tempDirs.push(tmpDir);
  return codexDir;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

afterEach(() => {
  while (tempDirs.length) {
    fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
  }
});

describe("Codex debug hook installer", () => {
  it("registers all official hook events on fresh install", () => {
    const codexDir = makeTempCodexDir({});
    const result = registerCodexDebugHooks({
      silent: true,
      codexDir,
      nodeBin: "/usr/local/bin/node",
      platform: "linux",
    });

    assert.strictEqual(result.added, CODEX_DEBUG_HOOK_EVENTS.length);
    assert.strictEqual(result.updated, 0);
    assert.strictEqual(result.skipped, 0);
    assert.strictEqual(result.configChanged, true);

    const settings = readJson(path.join(codexDir, "hooks.json"));
    for (const event of CODEX_DEBUG_HOOK_EVENTS) {
      assert.ok(Array.isArray(settings.hooks[event]), `missing ${event}`);
      assert.strictEqual(settings.hooks[event].length, 1);
      const entry = settings.hooks[event][0];
      assert.strictEqual(Object.prototype.hasOwnProperty.call(entry, "matcher"), false);
      const hook = entry.hooks[0];
      assert.strictEqual(hook.type, "command");
      assert.strictEqual(hook.timeout, timeoutForEvent(event));
      assert.ok(hook.command.includes(MARKER));
      assert.ok(hook.command.includes("/usr/local/bin/node"));
    }

    const configText = fs.readFileSync(path.join(codexDir, "config.toml"), "utf8");
    assert.match(configText, /\[features\]\s+hooks = true/);
  });

  it("is idempotent on second run", () => {
    const codexDir = makeTempCodexDir({});
    registerCodexDebugHooks({ silent: true, codexDir, nodeBin: "/usr/local/bin/node", platform: "linux" });
    const before = fs.readFileSync(path.join(codexDir, "hooks.json"), "utf8");

    const result = registerCodexDebugHooks({ silent: true, codexDir, nodeBin: "/usr/local/bin/node", platform: "linux" });

    assert.strictEqual(result.added, 0);
    assert.strictEqual(result.updated, 0);
    assert.strictEqual(result.skipped, CODEX_DEBUG_HOOK_EVENTS.length);
    assert.strictEqual(fs.readFileSync(path.join(codexDir, "hooks.json"), "utf8"), before);
  });

  it("preserves third-party hooks", () => {
    const thirdParty = { hooks: [{ type: "command", command: "third-party" }] };
    const codexDir = makeTempCodexDir({
      hooks: {
        Stop: [thirdParty],
      },
    });

    registerCodexDebugHooks({ silent: true, codexDir, nodeBin: "/usr/local/bin/node", platform: "linux" });

    const settings = readJson(path.join(codexDir, "hooks.json"));
    assert.strictEqual(settings.hooks.Stop.length, 2);
    assert.deepStrictEqual(settings.hooks.Stop[0], thirdParty);
    assert.ok(settings.hooks.Stop[1].hooks[0].command.includes(MARKER));
  });

  it("updates stale debug hook command and timeout", () => {
    const codexDir = makeTempCodexDir({
      hooks: {
        PermissionRequest: [{
          hooks: [{ type: "command", command: '"/old/node" "/old/codex-debug-hook.js"', timeout: 30 }],
        }],
      },
    });

    const result = registerCodexDebugHooks({
      silent: true,
      codexDir,
      nodeBin: "/usr/local/bin/node",
      platform: "linux",
    });

    assert.ok(result.updated >= 1);
    const hook = readJson(path.join(codexDir, "hooks.json")).hooks.PermissionRequest[0].hooks[0];
    assert.ok(hook.command.includes("/usr/local/bin/node"));
    assert.ok(!hook.command.includes("/old/"));
    assert.strictEqual(hook.timeout, 600);
  });

  it("preserves existing node path when detection fails", () => {
    const codexDir = makeTempCodexDir({
      hooks: {
        Stop: [{
          hooks: [{ type: "command", command: '"/home/user/.volta/bin/node" "/old/codex-debug-hook.js"', timeout: 30 }],
        }],
      },
    });

    registerCodexDebugHooks({ silent: true, codexDir, nodeBin: null, platform: "linux" });

    const hook = readJson(path.join(codexDir, "hooks.json")).hooks.Stop[0].hooks[0];
    assert.ok(hook.command.includes("/home/user/.volta/bin/node"));
  });

  it("does not flip an explicit hooks=false", () => {
    const codexDir = makeTempCodexDir({}, "[features]\nhooks = false\n");
    const result = registerCodexDebugHooks({
      silent: true,
      codexDir,
      nodeBin: "/usr/local/bin/node",
      platform: "linux",
    });

    assert.strictEqual(result.configChanged, false);
    assert.match(result.warnings[0], /hooks = false/);
    assert.strictEqual(
      fs.readFileSync(path.join(codexDir, "config.toml"), "utf8"),
      "[features]\nhooks = false\n"
    );
  });

  it("inserts hooks=true into an existing features section", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clawd-codex-config-"));
    tempDirs.push(tmpDir);
    const configPath = path.join(tmpDir, "config.toml");
    fs.writeFileSync(configPath, "[features]\nfoo = true\n[model]\nname = \"x\"\n", "utf8");

    const result = ensureCodexHooksFeature(configPath);

    assert.strictEqual(result.changed, true);
    assert.strictEqual(
      fs.readFileSync(configPath, "utf8"),
      "[features]\nhooks = true\nfoo = true\n[model]\nname = \"x\"\n"
    );
  });

  it("handles TOML table headers with trailing comments", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clawd-codex-config-"));
    tempDirs.push(tmpDir);
    const configPath = path.join(tmpDir, "config.toml");
    fs.writeFileSync(
      configPath,
      "[features] # user feature flags\nfoo = true\n\n# comment about model\n[model] # model config\nname = \"x\"\n",
      "utf8"
    );

    const result = ensureCodexHooksFeature(configPath);

    assert.strictEqual(result.changed, true);
    assert.strictEqual(
      fs.readFileSync(configPath, "utf8"),
      "[features] # user feature flags\nhooks = true\nfoo = true\n\n# comment about model\n[model] # model config\nname = \"x\"\n"
    );
  });

  it("migrates legacy codex_hooks=false under a commented header without enabling it", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clawd-codex-config-"));
    tempDirs.push(tmpDir);
    const configPath = path.join(tmpDir, "config.toml");
    const original = "[features] # user feature flags\ncodex_hooks = false\n";
    fs.writeFileSync(configPath, original, "utf8");

    const result = ensureCodexHooksFeature(configPath);

    assert.strictEqual(result.changed, true);
    assert.match(result.warning, /hooks = false/);
    assert.strictEqual(fs.readFileSync(configPath, "utf8"), "[features] # user feature flags\nhooks = false\n");
  });

  it("parses TOML table headers without treating quoted # as a comment", () => {
    assert.deepStrictEqual(
      __test.parseTomlTableHeader('[features] # user feature flags'),
      { name: "features", array: false }
    );
    assert.deepStrictEqual(
      __test.parseTomlTableHeader('[foo."bar#baz"] # comment'),
      { name: 'foo."bar#baz"', array: false }
    );
    assert.strictEqual(__test.parseTomlTableHeader("[features] trailing"), null);
  });

  it("formats Windows commands for PowerShell execution", () => {
    const command = buildCodexDebugHookCommand(
      "C:\\Program Files\\nodejs\\node.exe",
      "D:/animation/hooks/codex-debug-hook.js",
      "win32"
    );

    assert.strictEqual(
      command,
      '& "C:\\Program Files\\nodejs\\node.exe" "D:/animation/hooks/codex-debug-hook.js"'
    );
  });

  it("unregisters only Codex debug hooks", () => {
    const thirdParty = { hooks: [{ type: "command", command: "third-party" }] };
    const codexDir = makeTempCodexDir({});
    registerCodexDebugHooks({ silent: true, codexDir, nodeBin: "/usr/local/bin/node", platform: "linux" });
    const settings = readJson(path.join(codexDir, "hooks.json"));
    settings.hooks.Stop.unshift(thirdParty);
    fs.writeFileSync(path.join(codexDir, "hooks.json"), JSON.stringify(settings, null, 2), "utf8");

    const result = unregisterCodexDebugHooks({ silent: true, codexDir });

    assert.strictEqual(result.removed, CODEX_DEBUG_HOOK_EVENTS.length);
    const next = readJson(path.join(codexDir, "hooks.json"));
    assert.deepStrictEqual(next.hooks.Stop, [thirdParty]);
  });
});
