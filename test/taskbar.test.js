const assert = require("assert");
const { describe, it } = require("node:test");

const { keepOutOfTaskbar, __test } = require("../src/taskbar");

describe("taskbar helpers", () => {
  it("reasserts skipTaskbar on Windows and Linux", () => {
    assert.strictEqual(__test.shouldKeepOutOfTaskbar("win32"), true);
    assert.strictEqual(__test.shouldKeepOutOfTaskbar("linux"), true);
    assert.strictEqual(__test.shouldKeepOutOfTaskbar("darwin"), false);
  });

  it("safely ignores missing or destroyed windows", () => {
    assert.doesNotThrow(() => keepOutOfTaskbar(null));
    assert.doesNotThrow(() => keepOutOfTaskbar({ isDestroyed: () => true }));
    assert.doesNotThrow(() => keepOutOfTaskbar({ isDestroyed: () => false }));
  });

  it("calls setSkipTaskbar only on supported platforms", () => {
    for (const platform of ["win32", "linux", "darwin"]) {
      let callCount = 0;
      let lastValue = null;
      __test.keepOutOfTaskbarForPlatform({
        isDestroyed: () => false,
        setSkipTaskbar(value) {
          callCount += 1;
          lastValue = value;
        },
      }, platform);

      assert.strictEqual(callCount, __test.shouldKeepOutOfTaskbar(platform) ? 1 : 0);
      if (callCount) assert.strictEqual(lastValue, true);
    }
  });

  it("uses the runtime platform for the public helper", () => {
    let callCount = 0;
    keepOutOfTaskbar({
      isDestroyed: () => false,
      setSkipTaskbar(value) {
        callCount += value ? 1 : 0;
      },
    });

    assert.strictEqual(callCount, __test.shouldKeepOutOfTaskbar(process.platform) ? 1 : 0);
  });
});
