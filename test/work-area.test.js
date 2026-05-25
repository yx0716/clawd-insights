// Tests for src/work-area.js — pure work-area math with empty-display
// fallback. Regression coverage for issue #93: main process crashed when
// screen.getAllDisplays() briefly returned [] during display topology
// changes (monitor plug/unplug, lock/unlock, RDP switch).

const { describe, it } = require("node:test");
const assert = require("node:assert");

const {
  getDisplayInsets,
  findNearestWorkArea,
  computeLooseClamp,
  buildDisplaySnapshot,
  findMatchingDisplay,
  isPointInAnyWorkArea,
  isValidDisplaySnapshot,
  SYNTHETIC_WORK_AREA,
} = require("../src/work-area");

const wa = (x, y, w, h) => ({ x, y, width: w, height: h });
const display = (x, y, w, h) => ({ bounds: wa(x, y, w, h), workArea: wa(x, y, w, h) });

describe("getDisplayInsets", () => {
  it("returns zeros when display is missing or incomplete", () => {
    assert.deepStrictEqual(getDisplayInsets(null), { top: 0, right: 0, bottom: 0, left: 0 });
    assert.deepStrictEqual(getDisplayInsets({ bounds: wa(0, 0, 100, 100) }), { top: 0, right: 0, bottom: 0, left: 0 });
  });

  it("measures a bottom taskbar as a bottom inset", () => {
    const result = getDisplayInsets({
      bounds: wa(0, 0, 2560, 1440),
      workArea: wa(0, 0, 2560, 1392),
    });

    assert.deepStrictEqual(result, { top: 0, right: 0, bottom: 48, left: 0 });
  });

  it("measures a top taskbar as a top inset", () => {
    const result = getDisplayInsets({
      bounds: wa(0, 0, 2560, 1440),
      workArea: wa(0, 48, 2560, 1392),
    });

    assert.deepStrictEqual(result, { top: 48, right: 0, bottom: 0, left: 0 });
  });

  it("measures left and right taskbars independently", () => {
    assert.deepStrictEqual(
      getDisplayInsets({
        bounds: wa(0, 0, 1920, 1080),
        workArea: wa(64, 0, 1856, 1080),
      }),
      { top: 0, right: 0, bottom: 0, left: 64 }
    );

    assert.deepStrictEqual(
      getDisplayInsets({
        bounds: wa(0, 0, 1920, 1080),
        workArea: wa(0, 0, 1856, 1080),
      }),
      { top: 0, right: 64, bottom: 0, left: 0 }
    );
  });
});

describe("findNearestWorkArea", () => {
  it("returns the only display's workArea when there is one display", () => {
    const result = findNearestWorkArea([display(0, 0, 1920, 1080)], null, 100, 100);
    assert.deepStrictEqual(result, wa(0, 0, 1920, 1080));
  });

  it("picks the left display when cursor is over it", () => {
    const displays = [display(0, 0, 1920, 1080), display(1920, 0, 1920, 1080)];
    const result = findNearestWorkArea(displays, null, 500, 500);
    assert.deepStrictEqual(result, wa(0, 0, 1920, 1080));
  });

  it("picks the right display when cursor is over it", () => {
    const displays = [display(0, 0, 1920, 1080), display(1920, 0, 1920, 1080)];
    const result = findNearestWorkArea(displays, null, 2500, 500);
    assert.deepStrictEqual(result, wa(1920, 0, 1920, 1080));
  });

  // ── issue #93 regression cases ──

  it("falls back to primary workArea when displays array is empty", () => {
    const primary = wa(0, 0, 2560, 1440);
    const result = findNearestWorkArea([], primary, 0, 0);
    assert.deepStrictEqual(result, primary);
  });

  it("falls back to synthetic workArea when both displays and primary are unavailable", () => {
    const result = findNearestWorkArea([], null, 0, 0);
    assert.deepStrictEqual(result, SYNTHETIC_WORK_AREA);
  });

  it("treats null/undefined displays as empty and falls through", () => {
    assert.deepStrictEqual(findNearestWorkArea(null, null, 0, 0), SYNTHETIC_WORK_AREA);
    assert.deepStrictEqual(findNearestWorkArea(undefined, null, 0, 0), SYNTHETIC_WORK_AREA);
  });

  it("never throws on empty displays — does not read displays[0]", () => {
    assert.doesNotThrow(() => findNearestWorkArea([], null, 0, 0));
    assert.doesNotThrow(() => findNearestWorkArea(null, null, 0, 0));
  });
});

describe("computeLooseClamp", () => {
  it("clamps to a single display when window is well inside it", () => {
    const result = computeLooseClamp([display(0, 0, 1920, 1080)], null, 100, 100, 200, 200);
    assert.strictEqual(result.x, 100);
    assert.strictEqual(result.y, 100);
  });

  it("clamps a far-off window back near the right edge of the union", () => {
    const displays = [display(0, 0, 1920, 1080), display(1920, 0, 1920, 1080)];
    // window 100x100 at 5000,5000. union maxX=3840, margin=25
    // x = max(-25, min(5000, 3840-100+25)) = max(-25, 3765) = 3765
    const result = computeLooseClamp(displays, null, 5000, 5000, 100, 100);
    assert.strictEqual(result.x, 3765);
  });

  it("allows partial off-screen by 25% margin (left side)", () => {
    const displays = [display(0, 0, 1920, 1080)];
    // margin = 50, x can go as low as -50
    const result = computeLooseClamp(displays, null, -100, 100, 200, 200);
    assert.strictEqual(result.x, -50);
  });

  it("supports asymmetric top and bottom margins", () => {
    const displays = [display(0, 0, 1920, 1080)];
    const result = computeLooseClamp(displays, null, 100, -120, 200, 200, {
      marginTop: 90,
      marginBottom: 30,
    });

    assert.strictEqual(result.x, 100);
    assert.strictEqual(result.y, -90);
  });

  // ── issue #93 regression cases ──

  it("falls back to primary when displays is empty", () => {
    const primary = wa(0, 0, 1920, 1080);
    const result = computeLooseClamp([], primary, 100, 100, 200, 200);
    assert.strictEqual(result.x, 100);
    assert.strictEqual(result.y, 100);
    assert.ok(Number.isFinite(result.x));
    assert.ok(Number.isFinite(result.y));
  });

  it("falls back to synthetic when both displays and primary are unavailable", () => {
    const result = computeLooseClamp([], null, 100, 100, 200, 200);
    assert.ok(Number.isFinite(result.x));
    assert.ok(Number.isFinite(result.y));
  });

  it("never returns NaN or Infinity even when displays is null", () => {
    const result = computeLooseClamp(null, null, 100, 100, 200, 200);
    assert.ok(Number.isFinite(result.x), `expected finite x, got ${result.x}`);
    assert.ok(Number.isFinite(result.y), `expected finite y, got ${result.y}`);
  });

  it("never throws on empty displays", () => {
    assert.doesNotThrow(() => computeLooseClamp([], null, 0, 0, 100, 100));
    assert.doesNotThrow(() => computeLooseClamp(null, null, 0, 0, 100, 100));
  });
});

describe("buildDisplaySnapshot", () => {
  it("returns null for missing or malformed displays", () => {
    assert.strictEqual(buildDisplaySnapshot(null), null);
    assert.strictEqual(buildDisplaySnapshot({}), null);
    assert.strictEqual(buildDisplaySnapshot({ bounds: null }), null);
    assert.strictEqual(
      buildDisplaySnapshot({ bounds: { x: 0, y: 0, width: 0, height: 1080 } }),
      null,
      "zero width must fail — a display that big in memory is garbage"
    );
    assert.strictEqual(
      buildDisplaySnapshot({ bounds: { x: NaN, y: 0, width: 1920, height: 1080 } }),
      null
    );
  });

  it("captures bounds, workArea, id, and scaleFactor", () => {
    const snap = buildDisplaySnapshot({
      id: 42,
      scaleFactor: 2,
      bounds: { x: 0, y: 0, width: 2560, height: 1440 },
      workArea: { x: 0, y: 0, width: 2560, height: 1392 },
    });
    assert.deepStrictEqual(snap, {
      bounds: { x: 0, y: 0, width: 2560, height: 1440 },
      workArea: { x: 0, y: 0, width: 2560, height: 1392 },
      id: 42,
      scaleFactor: 2,
    });
  });

  it("omits workArea when the display reports none", () => {
    const snap = buildDisplaySnapshot({
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    });
    assert.deepStrictEqual(snap, {
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    });
  });
});

describe("findMatchingDisplay", () => {
  const display = (x, y, w, h, extras = {}) => ({
    bounds: { x, y, width: w, height: h },
    workArea: { x, y, width: w, height: h },
    ...extras,
  });

  it("returns null when snapshot or displays is empty", () => {
    assert.strictEqual(findMatchingDisplay(null, [display(0, 0, 1920, 1080)]), null);
    assert.strictEqual(
      findMatchingDisplay({ bounds: { x: 0, y: 0, width: 1920, height: 1080 } }, []),
      null
    );
  });

  it("matches on exact bounds equality", () => {
    const displays = [display(0, 0, 1920, 1080), display(1920, 0, 2560, 1440, { id: 7 })];
    const match = findMatchingDisplay(
      { bounds: { x: 1920, y: 0, width: 2560, height: 1440 } },
      displays
    );
    assert.strictEqual(match, displays[1]);
  });

  it("falls back to display.id when bounds shifted", () => {
    const displays = [display(0, 0, 1920, 1080, { id: 3 })];
    const match = findMatchingDisplay(
      { id: 3, bounds: { x: 100, y: 100, width: 1920, height: 1080 } },
      displays
    );
    assert.strictEqual(match, displays[0]);
  });

  it("returns null when saved monitor is gone — bounds and id both differ", () => {
    const displays = [display(0, 0, 1920, 1080, { id: 1 })];
    const match = findMatchingDisplay(
      { id: 9, bounds: { x: 1920, y: 0, width: 3840, height: 2160 } },
      displays
    );
    assert.strictEqual(match, null);
  });
});

describe("isPointInAnyWorkArea", () => {
  const display = (x, y, w, h) => ({
    bounds: { x, y, width: w, height: h },
    workArea: { x, y, width: w, height: h },
  });

  it("returns true when the point is inside a workArea", () => {
    assert.strictEqual(
      isPointInAnyWorkArea(100, 100, [display(0, 0, 1920, 1080)]),
      true
    );
  });

  it("returns false when the point is outside every workArea", () => {
    assert.strictEqual(
      isPointInAnyWorkArea(-500, 100, [display(0, 0, 1920, 1080)]),
      false
    );
  });

  it("returns true when the point lies on a secondary display's workArea", () => {
    const displays = [display(0, 0, 1920, 1080), display(-1920, 0, 1920, 1080)];
    assert.strictEqual(isPointInAnyWorkArea(-900, 500, displays), true);
  });

  it("treats bottom-right edge as outside (exclusive upper bound)", () => {
    // workArea is [x, x+width); the x+width edge pixel belongs to neighbors.
    assert.strictEqual(
      isPointInAnyWorkArea(1920, 100, [display(0, 0, 1920, 1080)]),
      false
    );
  });

  it("returns false for non-finite coordinates or missing displays", () => {
    assert.strictEqual(isPointInAnyWorkArea(NaN, 0, [display(0, 0, 1920, 1080)]), false);
    assert.strictEqual(isPointInAnyWorkArea(0, Infinity, [display(0, 0, 1920, 1080)]), false);
    assert.strictEqual(isPointInAnyWorkArea(0, 0, []), false);
    assert.strictEqual(isPointInAnyWorkArea(0, 0, null), false);
  });
});

describe("isValidDisplaySnapshot", () => {
  it("accepts a well-formed snapshot", () => {
    assert.strictEqual(
      isValidDisplaySnapshot({ bounds: { x: 0, y: 0, width: 1920, height: 1080 } }),
      true
    );
  });

  it("rejects null, arrays, missing bounds, and non-finite fields", () => {
    assert.strictEqual(isValidDisplaySnapshot(null), false);
    assert.strictEqual(isValidDisplaySnapshot([]), false);
    assert.strictEqual(isValidDisplaySnapshot({}), false);
    assert.strictEqual(
      isValidDisplaySnapshot({ bounds: { x: 0, y: 0, width: 0, height: 1080 } }),
      false
    );
    assert.strictEqual(
      isValidDisplaySnapshot({ bounds: { x: "0", y: 0, width: 1920, height: 1080 } }),
      false
    );
  });
});
