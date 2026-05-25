const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
  checkCodexHookTrustText,
  checkCodexHooksFeatureText,
  collectTrustedCodexHookIds,
} = require("../src/doctor-detectors/codex-features-check");

describe("Codex hooks feature check", () => {
  it("returns enabled when [features].hooks is true", () => {
    assert.deepStrictEqual(
      checkCodexHooksFeatureText("[features]\nhooks = true\n"),
      { value: "enabled", detail: "hooks=true" }
    );
  });

  it("returns disabled when [features].hooks is false", () => {
    assert.deepStrictEqual(
      checkCodexHooksFeatureText("[features]\nhooks = false\n"),
      { value: "disabled", detail: "hooks=false" }
    );
  });

  it("falls back to deprecated codex_hooks when hooks is absent", () => {
    assert.deepStrictEqual(
      checkCodexHooksFeatureText("[features]\ncodex_hooks = true\n"),
      { value: "enabled", detail: "codex_hooks=true (deprecated)" }
    );
  });

  it("prefers hooks over deprecated codex_hooks", () => {
    assert.deepStrictEqual(
      checkCodexHooksFeatureText("[features]\ncodex_hooks = false\nhooks = true\n"),
      { value: "enabled", detail: "hooks=true" }
    );
  });

  it("ignores hooks outside the features table", () => {
    assert.deepStrictEqual(
      checkCodexHooksFeatureText("hooks = true\n[other]\nhooks = false\n"),
      { value: "uncertain", detail: "hooks not found" }
    );
  });

  it("stops scanning at the next table", () => {
    assert.deepStrictEqual(
      checkCodexHooksFeatureText("[features]\nfoo = true\n[model]\nhooks = true\n"),
      { value: "uncertain", detail: "hooks not found" }
    );
  });

  it("returns uncertain for non-boolean hooks values", () => {
    assert.deepStrictEqual(
      checkCodexHooksFeatureText("[features]\nhooks = \"true\"\n"),
      { value: "uncertain", detail: "hooks is not a boolean" }
    );
  });

  it("allows comments around the feature setting", () => {
    assert.deepStrictEqual(
      checkCodexHooksFeatureText("# top\n[features] # table\nhooks = true # enabled\n"),
      { value: "enabled", detail: "hooks=true" }
    );
  });

  it("collects Codex trusted hook ids without treating comments in strings as comments", () => {
    const ids = collectTrustedCodexHookIds([
      "[features]",
      "hooks = true",
      "[hooks.state.'C:\\\\Users\\\\Alice\\\\.codex\\\\hooks.json:stop:0:0'] # trailing comment",
      'trusted_hash = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"',
      '[hooks.state."C:\\\\Users\\\\Alice\\\\#codex\\\\hooks.json:permission_request:0:0"]',
      'trusted_hash = "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"',
    ].join("\n"));

    assert.ok(ids.has("C:\\\\Users\\\\Alice\\\\.codex\\\\hooks.json:stop:0:0"));
    assert.ok(ids.has("C:\\Users\\Alice\\#codex\\hooks.json:permission_request:0:0"));
  });

  it("reports missing Codex hook trust entries by event", () => {
    const settings = {
      hooks: {
        PermissionRequest: [{ hooks: [{ command: '"/node" "/app/hooks/codex-hook.js"' }] }],
        Stop: [{ hooks: [{ command: '"/node" "/app/hooks/codex-hook.js"' }] }],
      },
    };
    const trust = checkCodexHookTrustText(
      [
        "[features]",
        "hooks = true",
        "[hooks.state.'/home/alice/.codex/hooks.json:stop:0:0']",
        'trusted_hash = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"',
      ].join("\n"),
      settings,
      "/home/alice/.codex/hooks.json",
      { platform: "linux" }
    );

    assert.strictEqual(trust.value, "needs-review");
    assert.deepStrictEqual(trust.missingEvents, ["PermissionRequest"]);
    assert.strictEqual(trust.trustedCount, 1);
    assert.strictEqual(trust.totalCount, 2);
  });
});
