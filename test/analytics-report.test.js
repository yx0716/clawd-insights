const { describe, it } = require("node:test");
const assert = require("node:assert");

const initAnalyticsData = require("../src/analytics-data");

describe("analytics reports", () => {
  it("builds a daily report from aggregated data", () => {
    const api = initAnalyticsData({ analyticsPath: "/tmp/nonexistent-analytics.jsonl" });
    const text = api.buildDailyReport({
      date: "2026-04-10",
      activeTime: 3_600_000,
      totalTime: 5_400_000,
      sessionCount: 4,
      totalEvents: 20,
      errorCount: 1,
      projectTotals: { alpha: 2_400_000, beta: 1_200_000 },
      agentTotals: { codex: 2_000_000, "claude-code": 1_600_000 },
      sessions: [
        { agent: "codex", project: "alpha", totalActive: 1_800_000, duration: 2_100_000 },
      ],
    }, [
      { label: "Peak Hour", value: "10:00", detail: "45m active" },
    ]);

    assert.match(text, /# 日报 2026-04-10/);
    assert.match(text, /## 概览/);
    assert.match(text, /## 重点项目/);
    assert.match(text, /alpha/);
    assert.match(text, /## 今日信号/);
    assert.match(text, /Peak Hour：10:00，45m active/);
  });

  it("builds a weekly report from aggregated data", () => {
    const api = initAnalyticsData({ analyticsPath: "/tmp/nonexistent-analytics.jsonl" });
    const text = api.buildWeeklyReport({
      weekActiveTime: 7_200_000,
      weekTotalTime: 10_800_000,
      weekSessions: 9,
      weekTotalEvents: 80,
      weekProjectTotals: { alpha: 3_600_000, beta: 2_400_000 },
      weekAgentTotals: { codex: 4_000_000 },
      days: [
        { date: "2026-04-08", dayLabel: "Wed", totalTime: 3_600_000, activeTime: 2_400_000, sessionCount: 3, projectTotals: { alpha: 1_800_000 } },
        { date: "2026-04-09", dayLabel: "Thu", totalTime: 5_400_000, activeTime: 4_800_000, sessionCount: 4, projectTotals: { beta: 2_400_000 } },
      ],
    });

    assert.match(text, /# 周报 最近 7 天/);
    assert.match(text, /## 本周重点项目/);
    assert.match(text, /## 每日拆分/);
    assert.match(text, /2026-04-09/);
  });
});
