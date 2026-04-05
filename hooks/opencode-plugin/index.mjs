// Clawd on Desk — opencode Plugin
// Runs inside the opencode process (Bun runtime) and forwards session/tool
// events to the Clawd HTTP server (127.0.0.1:23333-23337).
//
// Phase 1: basic state awareness (idle / thinking / working / sweeping / attention / error / sleeping)
// Phase 2: permission.ask hook (not yet wired)
// Phase 3: subtask tracking (not yet wired)
// Phase 4: terminal focus via source_pid (not yet wired)
//
// Design invariants:
//   - Zero dependencies (Bun's built-in fetch + fs/os/path)
//   - fire-and-forget: event hook never awaits the fetch, so slow/broken Clawd
//     cannot stall opencode
//   - 200ms AbortController per request — errors swallowed silently
//   - same-state dedup — consecutive identical states skip POST
//   - self-healing port discovery: runtime.json → cached port → full scan on ECONNREFUSED

import { readFileSync, appendFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// === Constants ===
const CLAWD_DIR = join(homedir(), ".clawd");
const RUNTIME_CONFIG_PATH = join(CLAWD_DIR, "runtime.json");
const DEBUG_LOG_PATH = join(CLAWD_DIR, "opencode-plugin.log");
const SERVER_PORTS = [23333, 23334, 23335, 23336, 23337];
const STATE_PATH = "/state";
// 1000ms is safe because postStateToClawd is fire-and-forget — the IIFE never
// blocks the event hook's return value. Earlier 200ms caused silent timeouts
// when Clawd's IPC roundtrip (main → renderer → main) was slow under load.
const POST_TIMEOUT_MS = 1000;
const AGENT_ID = "opencode";

// Active states that should suppress session.status=busy → thinking back-off.
// opencode emits session.status=busy between every tool call as the LLM
// deliberates the next step; without this gate the pet would flash
// thinking ↔ working for every tool invocation.
const ACTIVE_STATES_BLOCKING_THINKING = new Set(["working", "sweeping"]);

// === Runtime state (per plugin instance, scoped to one opencode process) ===
let _cachedPort = null;
let _lastState = null;
let _lastSessionId = null;
let _reqCounter = 0;

// === Debug logging ===
// Reset on plugin init (each opencode startup gets a clean log). Appended on
// every event decision so rullerzhou can diagnose state issues post-hoc.
function debugLog(msg) {
  try {
    appendFileSync(DEBUG_LOG_PATH, `[${new Date().toISOString()}] ${msg}\n`, "utf8");
  } catch {}
}

function resetDebugLog() {
  try {
    mkdirSync(CLAWD_DIR, { recursive: true });
    writeFileSync(DEBUG_LOG_PATH, "", "utf8");
  } catch {}
}

/** Read the Clawd runtime port from ~/.clawd/runtime.json (written by main.js on startup). */
function readRuntimePort() {
  try {
    const raw = JSON.parse(readFileSync(RUNTIME_CONFIG_PATH, "utf8"));
    const port = Number(raw && raw.port);
    if (Number.isInteger(port) && SERVER_PORTS.includes(port)) return port;
  } catch {}
  return null;
}

/** Ordered port candidates: cached → runtime.json → full scan. */
function getPortCandidates() {
  const runtimePort = readRuntimePort();
  const ordered = [];
  const seen = new Set();
  const add = (p) => {
    if (p && !seen.has(p) && SERVER_PORTS.includes(p)) {
      seen.add(p);
      ordered.push(p);
    }
  };
  add(_cachedPort);
  add(runtimePort);
  SERVER_PORTS.forEach(add);
  return ordered;
}

/**
 * POST state to Clawd, fire-and-forget.
 * Tries cached port first; on failure walks through runtime.json + fallback range.
 * Caches the winning port for subsequent calls. Never throws.
 */
function postStateToClawd(body) {
  const payload = JSON.stringify(body);
  const candidates = getPortCandidates();
  const reqId = ++_reqCounter;
  debugLog(`POST[${reqId}] start state=${body.state} candidates=[${candidates.join(",")}]`);

  // Run async, but do not await from caller — this is fire-and-forget.
  (async () => {
    for (const port of candidates) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);
      const t0 = Date.now();
      try {
        const res = await fetch(`http://127.0.0.1:${port}${STATE_PATH}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          signal: controller.signal,
        });
        clearTimeout(timer);
        const elapsed = Date.now() - t0;
        const header = res.headers.get("x-clawd-server");
        debugLog(`POST[${reqId}] port=${port} status=${res.status} header=${header} elapsed=${elapsed}ms`);
        // Verify this is actually Clawd (port range is unprivileged; could be another app)
        if (header === "clawd-on-desk") {
          _cachedPort = port;
          // Drain body to free the socket
          try { await res.text(); } catch {}
          debugLog(`POST[${reqId}] OK port=${port}`);
          return;
        }
      } catch (err) {
        clearTimeout(timer);
        const elapsed = Date.now() - t0;
        debugLog(`POST[${reqId}] port=${port} ERR ${err && err.name}/${err && err.message} elapsed=${elapsed}ms`);
      }
    }
    // All candidates exhausted — drop the cached port so next call re-scans
    debugLog(`POST[${reqId}] EXHAUSTED all candidates failed`);
    _cachedPort = null;
  })().catch((err) => {
    debugLog(`POST[${reqId}] UNCAUGHT ${err && err.message}`);
  });
}

/**
 * Send a state update if it differs from the last one (dedup by state+session).
 * Clawd-internal event names (PascalCase) match Claude Code's hook vocabulary,
 * so state.js transition logic (e.g. SubagentStop → working whitelist) is reusable.
 */
function sendState(state, eventName, sessionId) {
  if (!state || !eventName) return;

  // Busy back-off: session.status=busy fires between every tool call while the
  // LLM deliberates. Only allow "thinking" to surface when we're not already in
  // a more specific active state; otherwise ignore the busy pulse so the pet
  // stays in working instead of flashing back to thinking.
  if (state === "thinking" && ACTIVE_STATES_BLOCKING_THINKING.has(_lastState)) {
    debugLog(`GATE busy→thinking blocked (lastState=${_lastState}, session=${sessionId})`);
    return;
  }

  // same-state dedup: skip POST if nothing changed for this session
  if (state === _lastState && sessionId === _lastSessionId) {
    debugLog(`DEDUP ${state} (session=${sessionId})`);
    return;
  }

  debugLog(`SEND ${_lastState || "null"} → ${state} event=${eventName} session=${sessionId}`);
  _lastState = state;
  _lastSessionId = sessionId;

  const body = {
    state,
    session_id: sessionId || "default",
    event: eventName,
    agent_id: AGENT_ID,
  };
  postStateToClawd(body);
}

/**
 * Translate an opencode event into a Clawd (state, eventName) pair.
 * Returns null for events Clawd should ignore.
 *
 * opencode event structure (from Phase 0 spike dump):
 *   { type: "session.status", properties: { sessionID, status: { type: "busy" } } }
 *   { type: "message.part.updated", properties: { part: { type: "tool", tool, state: { status } } } }
 */
function translateEvent(event) {
  if (!event || typeof event.type !== "string") return null;
  const props = event.properties || {};

  switch (event.type) {
    case "session.created":
      return { state: "idle", event: "SessionStart" };

    case "session.status": {
      // Phase 0 spike: 12/12 session.status events were status.type === "busy".
      // Idle/retry subtypes not observed; session-idle is a separate "session.idle" event.
      const type = props.status && props.status.type;
      if (type === "busy") return { state: "thinking", event: "UserPromptSubmit" };
      return null;
    }

    case "message.part.updated": {
      const part = props.part;
      if (!part || typeof part !== "object") return null;

      if (part.type === "tool") {
        // pending → running → completed fires in quick succession.
        // Only "running" drives the working state; same-state dedup absorbs "completed".
        const status = part.state && part.state.status;
        if (status === "running") return { state: "working", event: "PreToolUse" };
        if (status === "completed") return { state: "working", event: "PostToolUse" };
        if (status === "error") return { state: "error", event: "PostToolUseFailure" };
        return null;
      }

      if (part.type === "compaction") {
        return { state: "sweeping", event: "PreCompact" };
      }

      // subtask / text / reasoning / step — ignored in Phase 1
      return null;
    }

    case "session.compacted":
      return { state: "sweeping", event: "PreCompact" };

    case "session.idle":
      // Turn finished — treated as Stop (attention)
      return { state: "attention", event: "Stop" };

    case "session.error":
      return { state: "error", event: "StopFailure" };

    case "session.deleted":
    case "server.instance.disposed":
      return { state: "sleeping", event: "SessionEnd" };

    default:
      return null;
  }
}

// === Plugin entrypoint (opencode loads this via default export) ===
export default async (ctx) => {
  // ctx: { client, project, directory, worktree, serverUrl, $ }
  // Phase 1 does not use ctx — plugin is stateless from opencode's side.
  resetDebugLog();
  debugLog(`INIT directory=${ctx && ctx.directory} serverUrl=${ctx && ctx.serverUrl} pid=${process.pid}`);

  return {
    event: async ({ event }) => {
      try {
        if (!event || typeof event.type !== "string") return;
        const mapped = translateEvent(event);
        if (!mapped) {
          // Log only noteworthy ignored events (session.* / message.part.updated with tool subtype)
          // — avoids spamming the log with hundreds of message.part.delta lines.
          if (event.type.startsWith("session.") || event.type === "message.part.updated") {
            const props = event.properties || {};
            const partType = props.part && props.part.type;
            const partStatus = props.part && props.part.state && props.part.state.status;
            const statusType = props.status && props.status.type;
            debugLog(`IGNORE ${event.type}${partType ? ` part=${partType}` : ""}${partStatus ? `/${partStatus}` : ""}${statusType ? ` status=${statusType}` : ""}`);
          }
          return;
        }
        const sessionId = (event.properties && event.properties.sessionID) || "default";
        debugLog(`MAP ${event.type} → state=${mapped.state} event=${mapped.event}`);
        sendState(mapped.state, mapped.event, sessionId);
      } catch (err) {
        debugLog(`ERROR in event hook: ${err && err.message}`);
      }
    },
  };
};
