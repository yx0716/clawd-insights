const { describe, it } = require("node:test");
const assert = require("node:assert");
const { computeOverall, runDoctorChecks } = require("../src/doctor");

describe("doctor aggregate checks", () => {
  it("computes red overall when any check is critical", () => {
    assert.deepStrictEqual(
      computeOverall([
        { status: "pass" },
        { status: "fail", level: "critical" },
        { status: "fail", level: "warning" },
      ]),
      { status: "critical", level: "critical", issueCount: 2 }
    );
  });

  it("computes yellow overall when warnings exist without critical failures", () => {
    assert.deepStrictEqual(
      computeOverall([
        { status: "pass" },
        { status: "fail", level: "warning" },
      ]),
      { status: "warning", level: "warning", issueCount: 1 }
    );
  });

  it("computes green overall when all checks pass or info", () => {
    assert.deepStrictEqual(
      computeOverall([
        { status: "pass" },
        { status: "suppressed-by-dnd", level: "info" },
      ]),
      { status: "pass", level: null, issueCount: 0 }
    );
  });

  it("runs all four Step 1 checks through injectable dependencies", () => {
    const result = runDoctorChecks({
      prefs: { theme: "clawd" },
      checkLocalServer: () => ({ id: "local-server", status: "pass", level: null }),
      checkAgentIntegrations: () => ({ id: "agent-integrations", status: "pass", level: null, details: [] }),
      checkPermissionBubblePolicy: () => ({ id: "permission-bubble-policy", status: "pass", level: null }),
      checkThemeHealth: () => ({ id: "theme-health", status: "pass", level: null }),
    });

    assert.strictEqual(result.overall.status, "pass");
    assert.deepStrictEqual(result.checks.map((check) => check.id), [
      "local-server",
      "agent-integrations",
      "permission-bubble-policy",
      "theme-health",
    ]);
  });
});
