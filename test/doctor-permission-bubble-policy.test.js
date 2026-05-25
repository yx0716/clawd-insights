const { describe, it } = require("node:test");
const assert = require("node:assert");
const { checkPermissionBubblePolicy } = require("../src/doctor-detectors/permission-bubble-policy");

describe("checkPermissionBubblePolicy", () => {
  it("passes when permission bubbles are enabled", () => {
    assert.deepStrictEqual(
      checkPermissionBubblePolicy({ prefs: { permissionBubblesEnabled: true } }),
      {
        id: "permission-bubble-policy",
        status: "pass",
        level: null,
        detail: "Permission bubbles are enabled",
      }
    );
  });

  it("warns when split permission bubbles are disabled", () => {
    const result = checkPermissionBubblePolicy({ prefs: { permissionBubblesEnabled: false } });
    assert.strictEqual(result.status, "fail");
    assert.strictEqual(result.level, "warning");
    assert.deepStrictEqual(result.fixAction, { type: "permission-bubble-policy" });
  });

  it("warns when legacy hideBubbles disables all bubbles", () => {
    const result = checkPermissionBubblePolicy({
      prefs: { hideBubbles: true, permissionBubblesEnabled: true },
    });
    assert.strictEqual(result.status, "fail");
    assert.strictEqual(result.level, "warning");
  });

  it("returns info when DND suppresses otherwise enabled bubbles", () => {
    const result = checkPermissionBubblePolicy({
      prefs: { permissionBubblesEnabled: true },
      doNotDisturb: true,
    });
    assert.strictEqual(result.status, "suppressed-by-dnd");
    assert.strictEqual(result.level, "info");
  });
});
