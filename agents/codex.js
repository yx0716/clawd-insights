// Codex CLI agent configuration
// Windows hooks completely disabled — uses JSONL log polling instead

module.exports = {
  id: "codex",
  name: "Codex CLI",
  processNames: { win: ["codex.exe"], mac: ["codex"], linux: ["codex"] },
  eventSource: "log-poll",
  // JSONL record type:subtype → pet state mapping
  // ⚠️ Also duplicated in hooks/codex-remote-monitor.js (zero-dep requirement) — keep in sync
  logEventMap: {
    "session_meta": "idle",
    "event_msg:task_started": "thinking",
    "event_msg:user_message": "thinking",
    "event_msg:agent_message": null, // text output only — working is reserved for function_call
    "event_msg:exec_command_end": "working",
    "event_msg:patch_apply_end": "working",
    "event_msg:custom_tool_call_output": "working",
    "response_item:function_call": "working",
    "response_item:custom_tool_call": "working",
    "response_item:web_search_call": "working",
    "event_msg:task_complete": "codex-turn-end", // resolved by monitor: attention if tools were used, idle otherwise
    "event_msg:context_compacted": "sweeping",
    "event_msg:turn_aborted": "idle",
  },
  capabilities: {
    httpHook: false,
    permissionApproval: false,
    // Codex surfaces an informational bubble (exec_approval_request /
    // apply_patch_approval_request → showCodexNotifyBubble) that travels
    // through Clawd's /permission machinery but is NOT an approval prompt
    // — it's a read-only "Got it" notification. The settings panel treats
    // this flag the same as permissionApproval for the purpose of
    // rendering the per-agent "Show Clawd bubbles" sub-toggle, so the
    // user can silence Codex bubbles without misnaming them as approvals.
    interactiveBubble: true,
    sessionEnd: false, // no SessionEnd event, rely on task_complete + timeout
    subagent: false,
  },
  logConfig: {
    sessionDir: "~/.codex/sessions",
    filePattern: "rollout-*.jsonl",
    pollIntervalMs: 1500,
  },
  pidField: "codex_pid",
};
