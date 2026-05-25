"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert");

const {
  createHitboxRuntime,
  resolveHitBoxForSvg,
} = require("../src/state-hitbox-resolver");

describe("state hitbox resolver", () => {
  it("normalizes theme hitbox runtime inputs", () => {
    const hitBoxes = {
      default: { x: 0, y: 0, w: 1, h: 1 },
      wide: { x: 1, y: 1, w: 2, h: 2 },
      sleeping: { x: 2, y: 2, w: 3, h: 3 },
    };
    const fileBox = { x: 3, y: 3, w: 4, h: 4 };
    const runtime = createHitboxRuntime({
      hitBoxes,
      fileHitBoxes: { "file.svg": fileBox },
      wideHitboxFiles: ["wide.svg"],
      sleepingHitboxFiles: ["sleep.svg"],
    });

    assert.strictEqual(runtime.hitBoxes, hitBoxes);
    assert.strictEqual(runtime.fileHitBoxes["file.svg"], fileBox);
    assert.deepStrictEqual([...runtime.wideSvgs], ["wide.svg"]);
    assert.deepStrictEqual([...runtime.sleepingSvgs], ["sleep.svg"]);
  });

  it("uses file-specific, sleeping, wide, then default hitbox priority", () => {
    const hitBoxes = {
      default: { name: "default" },
      wide: { name: "wide" },
      sleeping: { name: "sleeping" },
    };
    const fileBox = { name: "file" };
    const runtime = createHitboxRuntime({
      hitBoxes,
      fileHitBoxes: {
        "wide.svg": fileBox,
      },
      wideHitboxFiles: ["wide.svg", "wide-only.svg"],
      sleepingHitboxFiles: ["sleep.svg"],
    });

    assert.strictEqual(resolveHitBoxForSvg("wide.svg", runtime), fileBox);
    assert.strictEqual(resolveHitBoxForSvg("sleep.svg", runtime), hitBoxes.sleeping);
    assert.strictEqual(resolveHitBoxForSvg("wide-only.svg", runtime), hitBoxes.wide);
    assert.strictEqual(resolveHitBoxForSvg("unknown.svg", runtime), hitBoxes.default);
    assert.strictEqual(resolveHitBoxForSvg(null, runtime), hitBoxes.default);
  });

  it("falls back to empty file/wide/sleeping sets when theme fields are absent", () => {
    const hitBoxes = { default: { name: "default" } };
    const runtime = createHitboxRuntime({ hitBoxes });

    assert.deepStrictEqual(runtime.fileHitBoxes, {});
    assert.deepStrictEqual([...runtime.wideSvgs], []);
    assert.deepStrictEqual([...runtime.sleepingSvgs], []);
    assert.strictEqual(resolveHitBoxForSvg("anything.svg", runtime), hitBoxes.default);
  });
});
