"use strict";

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

test("main mini-mode timing uses the animation override runtime probe", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "src", "main.js"), "utf8");

  assert.ok(
    !source.includes("_buildAnimationAssetProbe"),
    "main.js must not reference the removed private animation probe helper"
  );
  assert.ok(
    source.includes("animationOverridesMain.buildAnimationAssetProbe(file)"),
    "mini-mode entry timing should call the animation override runtime probe"
  );
});
