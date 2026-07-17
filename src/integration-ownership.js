// integration-ownership.js — who owns the machine's shared integration state (fork).
//
// "Shared integration state" is everything a running instance writes outside
// its own userData: hook installs in ~/.claude/settings.json (and other agent
// configs via integration-sync) and the hook routing file ~/.clawd/runtime.json.
// Two instances fighting over these is how a stale build keeps resurrecting
// itself: the auto-start hook launches whichever app path the hooks point at.
//
// Policy (first match wins):
//   packaged        → owner. An installed build is the machine's primary.
//   env-override    → owner. CLAWD_DEV_TAKE_HOOKS=1 forces a source checkout
//                     to own integrations (hook/state development).
//   vacant          → owner. No Claude hooks installed, or every installed
//                     clawd-hook.js path is gone from disk (stale install) —
//                     a source-only setup must work out of the box, and dead
//                     hook paths deserve the repair.
//   deferred        → NOT owner. Hooks point at a clawd-hook.js that exists —
//                     some other (installed) copy owns the machine; stay
//                     passive so `npm start` never steals it. Events still
//                     reach a lone passive instance via hook port probing.
//
// Deliberately scoped to the Claude hooks file as the occupancy signal: it is
// the primary integration and the one whose theft caused real confusion.

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

function defaultSettingsPath() {
  return path.join(os.homedir(), ".claude", "settings.json");
}

// Collect every string under settings.hooks that mentions clawd-hook.js.
// Defensive against shape drift: walks arrays/objects rather than assuming
// the exact matcher/hooks nesting.
function collectClawdHookCommands(node, out) {
  if (typeof node === "string") {
    if (node.includes("clawd-hook.js")) out.push(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) collectClawdHookCommands(item, out);
    return;
  }
  if (node && typeof node === "object") {
    for (const value of Object.values(node)) collectClawdHookCommands(value, out);
  }
}

// A command looks like `"<node>" "<path>/clawd-hook.js" Event` (installer
// normalizes to forward slashes on every platform); tolerate an unquoted
// variant as well.
function extractScriptPath(command) {
  const quoted = /"([^"]+clawd-hook\.js)"/.exec(command);
  if (quoted) return quoted[1];
  const bare = /(\S+clawd-hook\.js)/.exec(command);
  return bare ? bare[1] : null;
}

function resolveIntegrationOwnership({
  isPackaged,
  env = process.env,
  settingsPath = defaultSettingsPath(),
  existsSync = fs.existsSync,
  readFileSync = fs.readFileSync,
} = {}) {
  if (isPackaged) return { owner: true, reason: "packaged" };
  if (env.CLAWD_DEV_TAKE_HOOKS === "1") return { owner: true, reason: "env-override" };

  let settings;
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch {
    // Missing or unparseable settings — nothing to steal; act as owner so a
    // source-only setup installs its hooks. (The installer owns rewriting a
    // broken file safely; occupancy detection must not block on it.)
    return { owner: true, reason: "vacant" };
  }

  const commands = [];
  collectClawdHookCommands(settings && settings.hooks, commands);
  if (commands.length === 0) return { owner: true, reason: "vacant" };

  for (const command of commands) {
    const scriptPath = extractScriptPath(command);
    if (scriptPath && existsSync(scriptPath)) {
      return { owner: false, reason: "deferred" };
    }
  }
  // Hooks exist but every referenced script is gone — a stale/uninstalled
  // build. Claiming here doubles as self-repair.
  return { owner: true, reason: "vacant" };
}

module.exports = { resolveIntegrationOwnership };
