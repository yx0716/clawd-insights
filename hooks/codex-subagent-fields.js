"use strict";

const ROLE_ROOT = "root";
const ROLE_SUBAGENT = "subagent";
const ROLE_UNKNOWN = "unknown";

const ROOT_ROLE_VALUES = new Set(["root", "main", "primary"]);
const SUBAGENT_ROLE_VALUES = new Set([
  "subagent",
  "child",
  "delegate",
  "delegated",
  "explorer",
  "worker",
]);

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeRole(value) {
  if (typeof value !== "string") return ROLE_UNKNOWN;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return ROLE_UNKNOWN;
  if (normalized === ROLE_ROOT || ROOT_ROLE_VALUES.has(normalized)) return ROLE_ROOT;
  if (normalized === ROLE_SUBAGENT || SUBAGENT_ROLE_VALUES.has(normalized)) return ROLE_SUBAGENT;
  return ROLE_UNKNOWN;
}

function classifySource(source) {
  if (isObject(source)) {
    if (Object.prototype.hasOwnProperty.call(source, "subagent")) {
      if (source.subagent === false || source.subagent === null) return ROLE_ROOT;
      return ROLE_SUBAGENT;
    }
    return normalizeRole(source.role || source.type || source.kind);
  }
  if (typeof source === "string") {
    const normalized = source.trim().toLowerCase();
    if (!normalized) return ROLE_UNKNOWN;
    if (normalized === "subagent" || normalized === "agent-subagent") return ROLE_SUBAGENT;
    if (normalized === "cli" || normalized === "codex-cli" || normalized === "codex-tui") return ROLE_ROOT;
  }
  return ROLE_UNKNOWN;
}

function classifySessionMeta(sessionMetaPayload) {
  if (!isObject(sessionMetaPayload)) return ROLE_UNKNOWN;

  const sourceRole = classifySource(sessionMetaPayload.source);
  if (sourceRole !== ROLE_UNKNOWN) return sourceRole;

  const explicitRole = normalizeRole(sessionMetaPayload.codex_session_role);
  if (explicitRole !== ROLE_UNKNOWN) return explicitRole;

  const agentRole = normalizeRole(sessionMetaPayload.agent_role);
  if (agentRole !== ROLE_UNKNOWN) return agentRole;

  const agentType = normalizeRole(sessionMetaPayload.agent_type);
  if (agentType !== ROLE_UNKNOWN) return agentType;

  if (typeof sessionMetaPayload.parent_session_id === "string" && sessionMetaPayload.parent_session_id.trim()) {
    return ROLE_SUBAGENT;
  }
  if (typeof sessionMetaPayload.parent_thread_id === "string" && sessionMetaPayload.parent_thread_id.trim()) {
    return ROLE_SUBAGENT;
  }

  return ROLE_UNKNOWN;
}

function classifyHookPayload(hookStdinPayload) {
  if (!isObject(hookStdinPayload)) return ROLE_UNKNOWN;

  const explicitRole = normalizeRole(hookStdinPayload.codex_session_role);
  if (explicitRole !== ROLE_UNKNOWN) return explicitRole;

  const sourceRole = classifySource(hookStdinPayload.source);
  if (sourceRole !== ROLE_UNKNOWN) return sourceRole;

  const agentRole = normalizeRole(hookStdinPayload.agent_role);
  if (agentRole !== ROLE_UNKNOWN) return agentRole;

  const agentType = normalizeRole(hookStdinPayload.agent_type);
  if (agentType !== ROLE_UNKNOWN) return agentType;

  if (typeof hookStdinPayload.parent_session_id === "string" && hookStdinPayload.parent_session_id.trim()) {
    return ROLE_SUBAGENT;
  }
  if (typeof hookStdinPayload.parent_thread_id === "string" && hookStdinPayload.parent_thread_id.trim()) {
    return ROLE_SUBAGENT;
  }

  return ROLE_UNKNOWN;
}

module.exports = {
  ROLE_ROOT,
  ROLE_SUBAGENT,
  ROLE_UNKNOWN,
  classifyHookPayload,
  classifySessionMeta,
  normalizeRole,
};
