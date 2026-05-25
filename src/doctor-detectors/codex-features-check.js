"use strict";

const fs = require("fs");

const { CODEX_HOOK_EVENTS } = require("../../hooks/codex-install-utils");

const CODEX_TRUST_EVENT_KEYS = Object.fromEntries(
  CODEX_HOOK_EVENTS.map((eventName) => [
    eventName,
    eventName.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase(),
  ])
);

function stripTomlComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === "\\" && quote === '"' && i + 1 < line.length) {
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "#") return line.slice(0, i);
  }
  return line;
}

function checkCodexHooksFeatureText(text) {
  if (typeof text !== "string") {
    return { value: "uncertain", detail: "config is not text" };
  }

  let inFeatures = false;
  let legacyResult = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = stripTomlComment(rawLine).trim();
    if (!line) continue;

    const tableMatch = line.match(/^\[([^\]]+)\]$/);
    if (tableMatch) {
      inFeatures = tableMatch[1].trim() === "features";
      continue;
    }

    if (!inFeatures) continue;
    const featureMatch = line.match(/^hooks\s*=\s*(true|false)\b/i);
    if (featureMatch) {
      return {
        value: featureMatch[1].toLowerCase() === "true" ? "enabled" : "disabled",
        detail: `hooks=${featureMatch[1].toLowerCase()}`,
      };
    }
    if (/^hooks\s*=/i.test(line)) {
      return { value: "uncertain", detail: "hooks is not a boolean" };
    }

    const legacyMatch = line.match(/^codex_hooks\s*=\s*(true|false)\b/i);
    if (legacyMatch && !legacyResult) {
      legacyResult = {
        value: legacyMatch[1].toLowerCase() === "true" ? "enabled" : "disabled",
        detail: `codex_hooks=${legacyMatch[1].toLowerCase()} (deprecated)`,
      };
      continue;
    }
    if (/^codex_hooks\s*=/i.test(line) && !legacyResult) {
      legacyResult = { value: "uncertain", detail: "codex_hooks is not a boolean" };
    }
  }

  return legacyResult || { value: "uncertain", detail: "hooks not found" };
}

function checkCodexHooksFeature(configPath, options = {}) {
  const fsImpl = options.fs || fs;
  let text;
  try {
    text = fsImpl.readFileSync(configPath, "utf8");
  } catch (err) {
    if (err && err.code === "ENOENT") {
      return { value: "uncertain", detail: "config.toml missing" };
    }
    return { value: "uncertain", detail: err && err.message ? err.message : "config.toml unreadable" };
  }
  return checkCodexHooksFeatureText(text);
}

function unescapeTomlBasicString(value) {
  return String(value || "")
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, '"');
}

function parseHooksStateHeader(line) {
  const stripped = stripTomlComment(line).trim();
  let match = stripped.match(/^\[hooks\.state\.'([^']+)'\]$/);
  if (match) return match[1];
  match = stripped.match(/^\[hooks\.state\."((?:\\.|[^"])*)"\]$/);
  if (match) return unescapeTomlBasicString(match[1]);
  return null;
}

function collectTrustedCodexHookIds(configText) {
  const trusted = new Set();
  if (typeof configText !== "string") return trusted;

  let currentTrustId = null;
  for (const rawLine of configText.split(/\r?\n/)) {
    const line = stripTomlComment(rawLine).trim();
    if (!line) continue;

    if (line.startsWith("[") && line.endsWith("]")) {
      currentTrustId = parseHooksStateHeader(rawLine);
      continue;
    }

    if (
      currentTrustId
      && /^trusted_hash\s*=\s*"sha256:[^"]+"\s*$/i.test(line)
    ) {
      trusted.add(currentTrustId);
    }
  }
  return trusted;
}

function normalizeTrustId(value, platform = process.platform) {
  const normalized = String(value || "").replace(/\\/g, "/");
  return platform === "win32" ? normalized.toLowerCase() : normalized;
}

function hookCommandMatchesMarker(hook, marker) {
  return !!(
    hook
    && typeof hook === "object"
    && typeof hook.command === "string"
    && typeof marker === "string"
    && marker
    && hook.command.includes(marker)
  );
}

function findCodexHookTrustPositions(settings, marker = "codex-hook.js") {
  const hooks = settings && typeof settings === "object" && settings.hooks && typeof settings.hooks === "object"
    ? settings.hooks
    : null;
  if (!hooks) return [];

  const positions = [];
  for (const eventName of CODEX_HOOK_EVENTS) {
    const entries = hooks[eventName];
    if (!Array.isArray(entries)) continue;
    const eventKey = CODEX_TRUST_EVENT_KEYS[eventName];
    for (let entryIndex = 0; entryIndex < entries.length; entryIndex++) {
      const entry = entries[entryIndex];
      if (!entry || typeof entry !== "object") continue;

      if (Array.isArray(entry.hooks)) {
        for (let hookIndex = 0; hookIndex < entry.hooks.length; hookIndex++) {
          if (hookCommandMatchesMarker(entry.hooks[hookIndex], marker)) {
            positions.push({ eventName, eventKey, entryIndex, hookIndex });
          }
        }
      }

      if (hookCommandMatchesMarker(entry, marker)) {
        positions.push({ eventName, eventKey, entryIndex, hookIndex: 0 });
      }
    }
  }
  return positions;
}

function makeTrustId(hooksPath, position) {
  return `${hooksPath}:${position.eventKey}:${position.entryIndex}:${position.hookIndex}`;
}

function checkCodexHookTrustText(configText, settings, hooksPath, options = {}) {
  const marker = options.marker || "codex-hook.js";
  const positions = findCodexHookTrustPositions(settings, marker);
  if (!positions.length) {
    return {
      key: "codex_hook_trust",
      value: "uncertain",
      detail: `${marker} not found in hooks.json`,
    };
  }

  const platform = options.platform || process.platform;
  const trusted = new Set(
    [...collectTrustedCodexHookIds(configText)].map((trustId) => normalizeTrustId(trustId, platform))
  );
  const missing = positions.filter((position) => {
    const expected = normalizeTrustId(makeTrustId(hooksPath, position), platform);
    return !trusted.has(expected);
  });

  if (missing.length) {
    const missingEvents = [...new Set(missing.map((position) => position.eventName))].join(", ");
    return {
      key: "codex_hook_trust",
      value: "needs-review",
      detail: `${missing.length}/${positions.length} Clawd Codex hook(s) need Codex /hooks review: ${missingEvents}`,
      missingEvents: missing.map((position) => position.eventName),
      trustedCount: positions.length - missing.length,
      totalCount: positions.length,
    };
  }

  return {
    key: "codex_hook_trust",
    value: "trusted",
    detail: `${positions.length}/${positions.length} Clawd Codex hook(s) trusted by Codex`,
    trustedCount: positions.length,
    totalCount: positions.length,
  };
}

function checkCodexHookTrust(configPath, settings, hooksPath, options = {}) {
  const fsImpl = options.fs || fs;
  let text = "";
  try {
    text = fsImpl.readFileSync(configPath, "utf8");
  } catch (err) {
    if (err && err.code !== "ENOENT") {
      return {
        key: "codex_hook_trust",
        value: "uncertain",
        detail: err && err.message ? err.message : "config.toml unreadable",
      };
    }
  }
  return checkCodexHookTrustText(text, settings, hooksPath, options);
}

module.exports = {
  checkCodexHookTrust,
  checkCodexHookTrustText,
  checkCodexHooksFeature,
  checkCodexHooksFeatureText,
  collectTrustedCodexHookIds,
  findCodexHookTrustPositions,
};
