const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

describe("main Gemini hook-only integration", () => {
  it("does not start a Gemini JSON session monitor", () => {
    const mainSource = fs.readFileSync(path.resolve(__dirname, "..", "src", "main.js"), "utf8");

    assert.ok(!mainSource.includes("GeminiLogMonitor"));
    assert.ok(!mainSource.includes("_geminiMonitor"));
    assert.ok(!mainSource.includes("Gemini log monitor"));
  });
});
