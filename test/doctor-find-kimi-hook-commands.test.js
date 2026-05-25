const { describe, it } = require("node:test");
const assert = require("node:assert");
const { findKimiHookCommands } = require("../hooks/kimi-install");

describe("findKimiHookCommands", () => {
  it("finds a single-quoted command containing the marker", () => {
    const text = `
[[hooks]]
event = "PreToolUse"
command = 'CLAWD_KIMI_PERMISSION_MODE=suspect "/usr/local/bin/node" "/app/hooks/kimi-hook.js"'
`;

    assert.deepStrictEqual(
      findKimiHookCommands(text, "kimi-hook.js"),
      ['CLAWD_KIMI_PERMISSION_MODE=suspect "/usr/local/bin/node" "/app/hooks/kimi-hook.js"']
    );
  });

  it("returns multiple matching hook commands", () => {
    const text = `
[[hooks]]
event = "SessionStart"
command = '"/node-a" "/app/hooks/kimi-hook.js"'

[[hooks]]
event = "Stop"
command = '"/node-b" "/app/hooks/kimi-hook.js"'
`;

    assert.deepStrictEqual(
      findKimiHookCommands(text, "kimi-hook.js"),
      [
        '"/node-a" "/app/hooks/kimi-hook.js"',
        '"/node-b" "/app/hooks/kimi-hook.js"',
      ]
    );
  });

  it("ignores hook commands without the marker", () => {
    const text = `
[[hooks]]
event = "Stop"
command = 'echo done'
`;

    assert.deepStrictEqual(findKimiHookCommands(text, "kimi-hook.js"), []);
  });

  it("supports double-quoted command values with escaped quotes", () => {
    const text = `
[[hooks]]
event = "PreToolUse"
command = "CLAWD_KIMI_PERMISSION_MODE=suspect \\"/usr/local/bin/node\\" \\"/app/hooks/kimi-hook.js\\""
`;

    assert.deepStrictEqual(
      findKimiHookCommands(text, "kimi-hook.js"),
      ['CLAWD_KIMI_PERMISSION_MODE=suspect "/usr/local/bin/node" "/app/hooks/kimi-hook.js"']
    );
  });

  it("does not match marker text outside command values", () => {
    const text = `
[[hooks]]
event = "kimi-hook.js"
command = 'echo no-marker'
`;

    assert.deepStrictEqual(findKimiHookCommands(text, "kimi-hook.js"), []);
  });
});
