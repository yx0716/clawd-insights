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

module.exports = { isAgentEnabled };
