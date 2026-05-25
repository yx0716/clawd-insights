const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const MAIN_JS = path.join(__dirname, "..", "src", "main.js");
const THEME_RUNTIME_JS = path.join(__dirname, "..", "src", "theme-runtime.js");

describe("main theme transition wiring", () => {
  it("fades the render window out before theme reload and back in after load", () => {
    const mainSource = fs.readFileSync(MAIN_JS, "utf8");
    const runtimeSource = fs.readFileSync(THEME_RUNTIME_JS, "utf8");

    assert.ok(
      mainSource.includes('require("./theme-fade-sequencer")'),
      "main should construct the raw theme fade/reload sequencer"
    );
    assert.ok(
      mainSource.includes('require("./theme-runtime")'),
      "main should delegate theme switching to theme-runtime"
    );
    assert.match(mainSource, /THEME_SWITCH_FADE_OUT_MS\s*=\s*140/);
    assert.match(mainSource, /THEME_SWITCH_FADE_IN_MS\s*=\s*180/);

    const activateIndex = runtimeSource.indexOf("function activateTheme(");
    const runIndex = runtimeSource.indexOf("callMethod(sequencer, \"run\", {", activateIndex);
    const syncIndex = runtimeSource.indexOf("syncRendererStateAfterLoad({ includeStartupRecovery: false })", activateIndex);
    const finishIndex = runtimeSource.indexOf("const finishThemeReload = ", activateIndex);

    assert.ok(runIndex > activateIndex, "activateTheme should run the theme fade sequencer");
    assert.ok(runIndex > finishIndex, "sequencer should run after the finish callback is defined");
    assert.ok(syncIndex > finishIndex, "renderer sync should stay inside the guarded finish path");
    assert.ok(finishIndex > activateIndex, "theme reload should have one guarded finish path");
    assert.ok(
      mainSource.includes("THEME_SWITCH_FADE_FALLBACK_MS"),
      "theme transition should have an opacity fallback so the window cannot stay transparent"
    );
    assert.ok(runtimeSource.includes("onFallback: () => finishThemeReload()"));
    assert.ok(runtimeSource.includes("onReloadFinished: () => finishThemeReload()"));
    assert.match(runtimeSource, /const finishThemeReload = \(\) =>/);
    assert.ok(
      !mainSource.includes("_buildAnimationAssetProbe"),
      "main should not retain stale private helper references"
    );
  });
});
