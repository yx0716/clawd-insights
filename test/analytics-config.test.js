const { describe, it } = require("node:test");
const assert = require("node:assert");

const { mergeAIConfig } = require("../src/analytics-config");

describe("mergeAIConfig", () => {
  it("preserves the saved key when the provider stays the same and key is blank", () => {
    const merged = mergeAIConfig(
      { provider: "claude", apiKey: "sk-old", baseUrl: "https://api.anthropic.com", model: "claude-sonnet" },
      { provider: "claude", baseUrl: "https://api.anthropic.com", model: "claude-sonnet" }
    );

    assert.strictEqual(merged.apiKey, "sk-old");
    assert.strictEqual(merged.provider, "claude");
  });

  it("clears the saved key when the provider changes and no new key is supplied", () => {
    const merged = mergeAIConfig(
      { provider: "openai", apiKey: "sk-openai", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
      { provider: "claude" }
    );

    assert.strictEqual(merged.provider, "claude");
    assert.ok(!("apiKey" in merged));
    assert.ok(!("baseUrl" in merged));
    assert.ok(!("model" in merged));
  });

  it("clears baseUrl and model when explicitly set to null", () => {
    const merged = mergeAIConfig(
      { provider: "claude", apiKey: "sk-old", baseUrl: "https://example.com", model: "custom-model" },
      { provider: "claude", baseUrl: null, model: null }
    );

    assert.strictEqual(merged.apiKey, "sk-old");
    assert.ok(!("baseUrl" in merged));
    assert.ok(!("model" in merged));
  });
});
