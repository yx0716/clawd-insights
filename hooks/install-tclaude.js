#!/usr/bin/env node
// Clawd Desktop Pet — Hook Installer for tclaude
// Delegates entirely to the shared install.js, overriding only:
//   - settingsPath  → ~/.tclaude/settings.json
//   - version detection candidates (looks for `tclaude` binary)

const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  registerHooks,
  registerHooksAsync,
  unregisterHooks,
  unregisterHooksAsync,
} = require("./install");

const DEFAULT_PARENT_DIR = path.join(os.homedir(), ".tclaude");
const DEFAULT_CONFIG_PATH = path.join(DEFAULT_PARENT_DIR, "settings.json");

/**
 * Register Clawd hooks into ~/.tclaude/settings.json.
 * Accepts the same options as registerHooks() in install.js.
 */
function registerTclaudeHooks(options = {}) {
  return registerHooks({
    ...options,
    settingsPath: options.settingsPath || DEFAULT_CONFIG_PATH,
  });
}

async function registerTclaudeHooksAsync(options = {}) {
  return registerHooksAsync({
    ...options,
    settingsPath: options.settingsPath || DEFAULT_CONFIG_PATH,
  });
}

function unregisterTclaudeHooks(options = {}) {
  return unregisterHooks({
    ...options,
    settingsPath: options.settingsPath || DEFAULT_CONFIG_PATH,
  });
}

async function unregisterTclaudeHooksAsync(options = {}) {
  return unregisterHooksAsync({
    ...options,
    settingsPath: options.settingsPath || DEFAULT_CONFIG_PATH,
  });
}

module.exports = {
  DEFAULT_PARENT_DIR,
  DEFAULT_CONFIG_PATH,
  registerTclaudeHooks,
  registerTclaudeHooksAsync,
  unregisterTclaudeHooks,
  unregisterTclaudeHooksAsync,
};

// CLI: run directly with `node hooks/install-tclaude.js`
if (require.main === module) {
  try {
    registerTclaudeHooks();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
