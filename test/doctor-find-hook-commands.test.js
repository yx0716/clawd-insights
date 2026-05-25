const { describe, it } = require("node:test");
const assert = require("node:assert");
const { findHookCommands } = require("../hooks/json-utils");

describe("findHookCommands", () => {
  it("finds flat command hooks containing the marker", () => {
    const settings = {
      hooks: {
        stop: [
          { command: '"/usr/local/bin/node" "/app/hooks/cursor-hook.js"' },
          { command: '"/usr/local/bin/node" "/app/hooks/other-hook.js"' },
        ],
      },
    };

    assert.deepStrictEqual(
      findHookCommands(settings, "cursor-hook.js"),
      ['"/usr/local/bin/node" "/app/hooks/cursor-hook.js"']
    );
  });

  it("finds nested command hooks only when requested", () => {
    const settings = {
      hooks: {
        Stop: [{
          matcher: "",
          hooks: [
            { type: "command", command: '"/opt/node" "/app/hooks/codebuddy-hook.js"' },
          ],
        }],
      },
    };

    assert.deepStrictEqual(findHookCommands(settings, "codebuddy-hook.js"), []);
    assert.deepStrictEqual(
      findHookCommands(settings, "codebuddy-hook.js", { nested: true }),
      ['"/opt/node" "/app/hooks/codebuddy-hook.js"']
    );
  });

  it("returns all matching commands across events", () => {
    const settings = {
      hooks: {
        SessionStart: [{ command: '"node" "/app/hooks/gemini-hook.js"' }],
        Stop: [{ command: '"/usr/bin/node" "/app/hooks/gemini-hook.js"' }],
      },
    };

    assert.deepStrictEqual(
      findHookCommands(settings, "gemini-hook.js"),
      [
        '"node" "/app/hooks/gemini-hook.js"',
        '"/usr/bin/node" "/app/hooks/gemini-hook.js"',
      ]
    );
  });

  it("ignores malformed entries and missing command fields", () => {
    const settings = {
      hooks: {
        Stop: [
          null,
          "bad",
          { type: "command" },
          { command: 123 },
          { hooks: [{ command: '"/node" "/app/hooks/kiro-hook.js"' }] },
        ],
      },
    };

    assert.deepStrictEqual(findHookCommands(settings, "kiro-hook.js"), []);
  });
});
