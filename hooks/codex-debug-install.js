#!/usr/bin/env node
// Install/remove Phase 0 Codex official-hooks debug sampler.
//
// This is deliberately not part of Clawd startup auto-sync. It only captures
// real Codex hook payloads to ~/.clawd/codex-hook-debug.jsonl for verification.

const {
  CODEX_HOOK_EVENTS,
  buildCodexHookCommand,
  ensureCodexHooksFeature,
  parseTomlTableHeader,
  registerCodexCommandHooks,
  timeoutForCodexEvent,
  unregisterCodexCommandHooks,
} = require("./codex-install-utils");

const MARKER = "codex-debug-hook.js";
const CODEX_DEBUG_HOOK_EVENTS = CODEX_HOOK_EVENTS;

function timeoutForEvent(event) {
  return timeoutForCodexEvent(event);
}

function buildCodexDebugHookCommand(nodeBin, hookScript, platform = process.platform) {
  return buildCodexHookCommand(nodeBin, hookScript, platform);
}

function registerCodexDebugHooks(options = {}) {
  return registerCodexCommandHooks({
    ...options,
    marker: MARKER,
    scriptName: MARKER,
    events: CODEX_DEBUG_HOOK_EVENTS,
    label: "Codex debug hooks",
  });
}

function unregisterCodexDebugHooks(options = {}) {
  return unregisterCodexCommandHooks({
    ...options,
    marker: MARKER,
    events: CODEX_DEBUG_HOOK_EVENTS,
  });
}

module.exports = {
  CODEX_DEBUG_HOOK_EVENTS,
  buildCodexDebugHookCommand,
  ensureCodexHooksFeature,
  registerCodexDebugHooks,
  timeoutForEvent,
  unregisterCodexDebugHooks,
  __test: {
    parseTomlTableHeader,
  },
};

if (require.main === module) {
  try {
    if (process.argv.includes("--uninstall")) unregisterCodexDebugHooks({});
    else registerCodexDebugHooks({});
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
