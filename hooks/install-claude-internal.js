#!/usr/bin/env node
// Clawd Desktop Pet — Hook Installer for claude-internal
// Delegates entirely to the shared install.js, overriding only:
//   - settingsPath  → ~/.claude-internal/settings.json
//   - version detection candidates (looks for `claude-internal` binary)

const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  registerHooks,
  registerHooksAsync,
  unregisterHooks,
  unregisterHooksAsync,
} = require("./install");

const DEFAULT_PARENT_DIR = path.join(os.homedir(), ".claude-internal");
const DEFAULT_CONFIG_PATH = path.join(DEFAULT_PARENT_DIR, "settings.json");

/**
 * Register Clawd hooks into ~/.claude-internal/settings.json.
 * Accepts the same options as registerHooks() in install.js.
 */
function registerClaudeInternalHooks(options = {}) {
  return registerHooks({
    ...options,
    settingsPath: options.settingsPath || DEFAULT_CONFIG_PATH,
  });
}

async function registerClaudeInternalHooksAsync(options = {}) {
  return registerHooksAsync({
    ...options,
    settingsPath: options.settingsPath || DEFAULT_CONFIG_PATH,
  });
}

function unregisterClaudeInternalHooks(options = {}) {
  return unregisterHooks({
    ...options,
    settingsPath: options.settingsPath || DEFAULT_CONFIG_PATH,
  });
}

async function unregisterClaudeInternalHooksAsync(options = {}) {
  return unregisterHooksAsync({
    ...options,
    settingsPath: options.settingsPath || DEFAULT_CONFIG_PATH,
  });
}

module.exports = {
  DEFAULT_PARENT_DIR,
  DEFAULT_CONFIG_PATH,
  registerClaudeInternalHooks,
  registerClaudeInternalHooksAsync,
  unregisterClaudeInternalHooks,
  unregisterClaudeInternalHooksAsync,
};

// CLI: run directly with `node hooks/install-claude-internal.js`
if (require.main === module) {
  try {
    registerClaudeInternalHooks();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
