// claude-internal agent configuration
// Tencent internal fork of Claude Code — same hook protocol, different process name and config dir.
// Config lives in ~/.claude-internal/settings.json instead of ~/.claude/settings.json.

module.exports = {
  id: "claude-internal",
  name: "Claude Internal",
  processNames: { win: ["claude-internal.exe"], mac: ["claude-internal"], linux: ["claude-internal"] },
  eventSource: "hook",
  // PascalCase event names — identical to Claude Code hook system
  eventMap: {
    SessionStart: "idle",
    SessionEnd: "sleeping",
    UserPromptSubmit: "thinking",
    PreToolUse: "working",
    PostToolUse: "working",
    PostToolUseFailure: "error",
    Stop: "attention",
    StopFailure: "error",
    SubagentStart: "juggling",
    SubagentStop: "working",
    PreCompact: "sweeping",
    PostCompact: "attention",
    Notification: "notification",
    Elicitation: "notification",
    WorktreeCreate: "carrying",
  },
  capabilities: {
    httpHook: true,
    permissionApproval: true,
    notificationHook: true,
    sessionEnd: true,
    subagent: true,
  },
  pidField: "claude_pid",
};
