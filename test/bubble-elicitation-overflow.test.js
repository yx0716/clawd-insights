const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const bubbleCss = fs.readFileSync(path.join(__dirname, "..", "src", "bubble.css"), "utf8");
const bubbleRenderer = fs.readFileSync(path.join(__dirname, "..", "src", "bubble-renderer.js"), "utf8");

function functionBody(name) {
  const start = bubbleRenderer.indexOf(`function ${name}(`);
  assert.notStrictEqual(start, -1, `missing function ${name}`);
  const next = bubbleRenderer.indexOf("\nfunction ", start + 1);
  return next === -1 ? bubbleRenderer.slice(start) : bubbleRenderer.slice(start, next);
}

describe("AskUserQuestion bubble overflow", () => {
  it("documents applyElicitationViewport as a no-op until the overflow redesign lands", () => {
    const body = functionBody("applyElicitationViewport");

    assert.match(body, /Intentionally a no-op/);
    assert.match(body, /The correct approach: let the form grow to its natural height/);
    assert.match(body, /permission\.js clampBubbleHeight\(\) already caps the window/);
  });

  it("reports natural content height before calling the no-op viewport hook", () => {
    assert.match(bubbleRenderer, /function measureNaturalBubbleHeight\(\)/);
    assert.match(bubbleRenderer, /card\.classList\.remove\("elicitation-scrollable"\);/);
    assert.match(bubbleRenderer, /elicitationForm\.style\.maxHeight = "";/);
    assert.match(
      bubbleRenderer,
      /window\.bubbleAPI\.reportHeight\(measureNaturalBubbleHeight\(\)\);[\s\S]*applyElicitationViewport\(\);/
    );
    assert.doesNotMatch(bubbleCss, /max-height:\s*calc\(100vh/);
    assert.doesNotMatch(bubbleRenderer, /max-height:\s*calc\(100vh/);
  });

  it("does not make the no-op viewport hook add internal scrolling or a max-height clamp", () => {
    const body = functionBody("applyElicitationViewport");

    // Long-prompt overflow remains deferred to the #222 redesign; this guard only
    // prevents tests from implying the current no-op provides runtime scrolling.
    assert.doesNotMatch(body, /card\.classList\.(?:add|toggle)\("elicitation-scrollable"/);
    assert.doesNotMatch(body, /elicitationForm\.style\.maxHeight\s*=/);
  });
});
