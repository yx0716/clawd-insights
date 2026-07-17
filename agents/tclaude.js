// tclaude agent configuration
// Tencent fork of Claude Code — same hook protocol, different process name and config dir.
// Config lives in ~/.tclaude/settings.json instead of ~/.claude/settings.json.

module.exports = {
  id: "tclaude",
  name: "tclaude",
  processNames: { win: ["tclaude.exe"], mac: ["tclaude"], linux: ["tclaude"] },
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
