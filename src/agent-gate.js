"use strict";

// ── Agent gate ──
//
// Single source of truth for "is this agent's event stream enabled?".
// Pure helper — takes a prefs snapshot in, returns a boolean out. No
// electron, no store, no file I/O.
//
// Default-true semantics: if the agent id is missing from the snapshot
// (upgraded user, or a registry agent that predates the prefs field), the
// agent is considered enabled. This makes adding agents to the registry
// safe — forgetting to seed the prefs default won't accidentally disable
// a just-added agent on every existing install.
//
// Callers:
//   - src/server.js    → gate /state + /permission at the route entrance
//   - src/main.js      → gate monitor start/stop + process scan filtering
//   - src/state.js     → gate orphan session cleanup (don't recreate
//                        disabled agent sessions)
//
// All callers pass the current controller snapshot. Passing stale snapshots
// is acceptable — the gate only controls "drop this event", not "this is the
// final source of truth"; a small race right after a toggle is fine.

function isAgentEnabled(snapshot, agentId) {
  if (!agentId) return true;
  if (!snapshot || typeof snapshot !== "object") return true;
  const agents = snapshot.agents;
  if (!agents || typeof agents !== "object") return true;
  const entry = agents[agentId];
  if (!entry || typeof entry !== "object") return true;
  return entry.enabled !== false;
}

// Per-agent permission-bubble sub-gate. Same default-true semantics as
// isAgentEnabled — missing snapshot / entry / flag all read as "on". The
// two gates are independent: the main gate controls "should the event
// stream run at all", this one controls "if the event stream is running,
// should we render a permission bubble". Caller is responsible for
// checking the main gate first; this helper does NOT short-circuit on
// enabled:false (so a future UI could legitimately ask "is the sub-toggle
// on for a currently-disabled agent" without us lying).
//
// Callers:
//   - src/server.js  → fold into the `hideBubbles` check at bubble-render
//                      sites (CC/CodeBuddy + opencode), mirroring per-agent
//                      hide-bubble semantics
//   - NOT the /state route (main gate owns that)
//   - NOT the /permission route entrance (we want PASSTHROUGH tools /
//     AskUserQuestion / ExitPlanMode to keep flowing even when the
//     sub-gate is off — the sub-gate only silences the bubble UI)
function isAgentPermissionsEnabled(snapshot, agentId) {
  if (!agentId) return true;
  if (!snapshot || typeof snapshot !== "object") return true;
  const agents = snapshot.agents;
  if (!agents || typeof agents !== "object") return true;
  const entry = agents[agentId];
  if (!entry || typeof entry !== "object") return true;
  return entry.permissionsEnabled !== false;
}

module.exports = { isAgentEnabled, isAgentPermissionsEnabled };
