const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const bubbleCss = fs.readFileSync(path.join(__dirname, "..", "src", "bubble.css"), "utf8");
const bubbleRenderer = fs.readFileSync(path.join(__dirname, "..", "src", "bubble-renderer.js"), "utf8");

describe("AskUserQuestion bubble Other option", () => {
  it("defines Other copy and textarea placeholders for all supported bubble locales", () => {
    assert.match(bubbleRenderer, /other: "Other",/);
    assert.match(bubbleRenderer, /otherPlaceholder: "Type your answer…",/);
    assert.match(bubbleRenderer, /other: "\\u5176\\u4ED6",/);
    assert.match(bubbleRenderer, /otherPlaceholder: "\\u8F93\\u5165\\u4F60\\u7684\\u56DE\\u7B54\\u2026",/);
    assert.match(bubbleRenderer, /other: "\\uAE30\\uD0C0",/);
    assert.match(bubbleRenderer, /otherPlaceholder: "\\uC9C1\\uC811 \\uC785\\uB825\\u2026",/);
    assert.match(bubbleRenderer, /other: "その他",/);
    assert.match(bubbleRenderer, /otherPlaceholder: "回答を入力…",/);
  });

  it("renders a client-side Other option with a folding textarea", () => {
    assert.match(bubbleCss, /\.option-item-other \{ align-items: center; \}/);
    assert.match(bubbleCss, /\.option-item-textarea \{/);
    assert.match(bubbleRenderer, /const otherInput = document\.createElement\("input"\);/);
    assert.match(bubbleRenderer, /otherInput\.setAttribute\("data-other", "true"\);/);
    assert.match(bubbleRenderer, /const otherTextarea = document\.createElement\("textarea"\);/);
    assert.match(bubbleRenderer, /otherTextarea\.setAttribute\("data-other-textarea", "true"\);/);
    assert.match(bubbleRenderer, /otherTextarea\.addEventListener\("input", \(\) => \{/);
    assert.match(bubbleRenderer, /ensureElicitationAnswer\(questionIndex\)\.otherText = otherTextarea\.value;/);
  });

  it("requires non-empty custom text when Other is selected and disables textareas during submit", () => {
    assert.match(bubbleRenderer, /const ELICITATION_OTHER_KEY = "__other__";/);
    assert.match(bubbleRenderer, /if \(optionKey === ELICITATION_OTHER_KEY\) \{/);
    assert.match(bubbleRenderer, /const otherText = answer\.otherText\.trim\(\);/);
    assert.match(bubbleRenderer, /if \(!otherText\) return "";/);
    assert.match(bubbleRenderer, /for \(const el of elicitationForm\.querySelectorAll\("input, textarea, button"\)\) el\.disabled = true;/);
  });

  it("keeps Other arrow navigation narrow and avoids checkbox toggles", () => {
    assert.match(bubbleRenderer, /if \(e\.key === "ArrowUp" && !e\.shiftKey && !e\.isComposing\) \{/);
    assert.match(bubbleRenderer, /const shouldEscape = isEmpty \|\| atStart;/);
    assert.match(bubbleRenderer, /if \(!question\.multiSelect\) target\.click\(\);/);
    assert.match(
      bubbleRenderer,
      /otherInput\.addEventListener\("keydown", \(e\) => \{[\s\S]*?e\.key === "ArrowDown"[\s\S]*?ta\.focus\(\);/
    );
    assert.doesNotMatch(bubbleRenderer, /if \(target\) \{ target\.focus\(\); target\.click\(\); \}/);
    assert.doesNotMatch(bubbleRenderer, /const atEnd = otherTextarea\.selectionStart === otherTextarea\.value\.length/);
  });
});
