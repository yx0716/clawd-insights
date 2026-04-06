"use strict";

const fs = require("fs");
const path = require("path");

// ── Defaults (used when theme.json omits optional fields) ──

const DEFAULT_TIMINGS = {
  minDisplay: {
    attention: 4000, error: 5000, sweeping: 5500,
    notification: 2500, carrying: 3000, working: 1000, thinking: 1000,
  },
  autoReturn: {
    attention: 4000, error: 5000, sweeping: 300000,
    notification: 2500, carrying: 3000,
  },
  yawnDuration: 3000,
  wakeDuration: 1500,
  deepSleepTimeout: 600000,
  mouseIdleTimeout: 20000,
  mouseSleepTimeout: 60000,
};

const DEFAULT_HITBOXES = {
  default:  { x: -1, y: 5, w: 17, h: 12 },
  sleeping: { x: -2, y: 9, w: 19, h: 7 },
  wide:     { x: -3, y: 3, w: 21, h: 14 },
};

const DEFAULT_OBJECT_SCALE = {
  widthRatio: 1.9, heightRatio: 1.3,
  offsetX: -0.45, offsetY: -0.25,
};

const DEFAULT_EYE_TRACKING = {
  enabled: false,
  states: [],
  eyeRatioX: 0.5,
  eyeRatioY: 0.5,
  maxOffset: 3,
  bodyScale: 0.33,
  shadowStretch: 0.15,
  shadowShift: 0.3,
  ids: { eyes: "eyes-js", body: "body-js", shadow: "shadow-js", dozeEyes: "eyes-doze" },
  shadowOrigin: "7.5px 15px",
};

const REQUIRED_STATES = ["idle", "working", "thinking", "sleeping", "waking"];

// ── State ──

let activeTheme = null;
let builtinThemesDir = null;   // set by init()
let assetsSvgDir = null;       // assets/svg/ for built-in theme

// ── Public API ──

/**
 * Initialize the loader. Call once at startup from main.js.
 * @param {string} appDir - __dirname of the calling module (src/)
 */
function init(appDir) {
  builtinThemesDir = path.join(appDir, "..", "themes");
  assetsSvgDir = path.join(appDir, "..", "assets", "svg");
}

/**
 * Discover all available themes.
 * Phase 1: only built-in themes.
 * @returns {{ id: string, name: string, path: string }[]}
 */
function discoverThemes() {
  const themes = [];
  if (!builtinThemesDir) return themes;
  try {
    for (const entry of fs.readdirSync(builtinThemesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const jsonPath = path.join(builtinThemesDir, entry.name, "theme.json");
      if (!fs.existsSync(jsonPath)) continue;
      try {
        const cfg = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
        themes.push({ id: entry.name, name: cfg.name || entry.name, path: jsonPath });
      } catch { /* skip malformed */ }
    }
  } catch { /* dir not found */ }
  return themes;
}

/**
 * Load and activate a theme by ID.
 * @param {string} themeId
 * @returns {object} merged theme config
 */
function loadTheme(themeId) {
  const jsonPath = path.join(builtinThemesDir, themeId, "theme.json");
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } catch (e) {
    console.error(`[theme-loader] Failed to load theme "${themeId}":`, e.message);
    if (themeId !== "clawd") return loadTheme("clawd");
    throw e;
  }

  const errors = validateTheme(raw);
  if (errors.length > 0) {
    console.error(`[theme-loader] Theme "${themeId}" validation errors:`, errors);
    if (themeId !== "clawd") return loadTheme("clawd");
  }

  // Merge defaults for optional fields
  const theme = mergeDefaults(raw, themeId);
  activeTheme = theme;
  return theme;
}

/**
 * @returns {object|null} current active theme config
 */
function getActiveTheme() {
  return activeTheme;
}

/**
 * Resolve a display hint filename to current theme's file.
 * Hook scripts send original Clawd filenames like "clawd-working-building.svg".
 * This maps them to the current theme's file via displayHintMap.
 * @param {string} hookFilename - original filename from hook/server
 * @returns {string|null} theme-local filename, or null if not mapped
 */
function resolveHint(hookFilename) {
  if (!activeTheme || !activeTheme.displayHintMap) return null;
  return activeTheme.displayHintMap[hookFilename] || null;
}

/**
 * Get the SVG/asset base path for the active theme.
 * Built-in "clawd" theme uses assets/svg/, external themes will use theme-cache.
 * @returns {string} absolute directory path
 */
function getAssetsDir() {
  if (!activeTheme) return assetsSvgDir;
  // Phase 1: built-in theme always uses assets/svg/
  if (activeTheme._builtin) return assetsSvgDir;
  // Phase 2 will return theme-cache path for external themes
  return assetsSvgDir;
}

/**
 * Get relative asset path prefix for renderer (used in <object data="...">).
 * @returns {string} relative path like "../assets/svg"
 */
function getRendererAssetsPath() {
  // Phase 1: always relative to src/index.html
  return "../assets/svg";
}

/**
 * Build config object to inject into renderer process (via additionalArguments or IPC).
 * Contains only the subset renderer.js needs.
 */
function getRendererConfig() {
  if (!activeTheme) return null;
  const t = activeTheme;
  return {
    assetsPath: getRendererAssetsPath(),
    eyeTracking: t.eyeTracking,
    glyphFlips: t.miniMode ? t.miniMode.glyphFlips : {},
    dragSvg: t.reactions && t.reactions.drag ? t.reactions.drag.file : null,
    idleFollowSvg: t.states.idle[0],
    // renderer needs to know which states need eye tracking (for future <object> vs <img> decision)
    eyeTrackingStates: t.eyeTracking.enabled ? t.eyeTracking.states : [],
  };
}

/**
 * Build config object to inject into hit-renderer process.
 */
function getHitRendererConfig() {
  if (!activeTheme) return null;
  const t = activeTheme;
  return {
    reactions: t.reactions || {},
    idleFollowSvg: t.states.idle[0],
  };
}

// ── Validation ──

function validateTheme(cfg) {
  const errors = [];

  if (cfg.schemaVersion !== 1) {
    errors.push(`schemaVersion must be 1, got ${cfg.schemaVersion}`);
  }
  if (!cfg.name) errors.push("missing required field: name");
  if (!cfg.version) errors.push("missing required field: version");

  if (!cfg.viewBox || cfg.viewBox.width == null || cfg.viewBox.height == null ||
      cfg.viewBox.x == null || cfg.viewBox.y == null) {
    errors.push("missing or incomplete viewBox (need x, y, width, height)");
  }

  if (!cfg.states) {
    errors.push("missing required field: states");
  } else {
    for (const s of REQUIRED_STATES) {
      if (!cfg.states[s] || !Array.isArray(cfg.states[s]) || cfg.states[s].length === 0) {
        errors.push(`states.${s} must be a non-empty array`);
      }
    }
  }

  // eyeTracking.states listed states must use .svg if enabled
  if (cfg.eyeTracking && cfg.eyeTracking.enabled && cfg.states) {
    for (const stateName of (cfg.eyeTracking.states || [])) {
      const files = cfg.states[stateName] ||
                    (cfg.miniMode && cfg.miniMode.states && cfg.miniMode.states[stateName]);
      if (files) {
        for (const f of files) {
          if (!f.endsWith(".svg")) {
            errors.push(`eyeTracking state "${stateName}" file "${f}" must be .svg`);
          }
        }
      }
    }
  }

  return errors;
}

// ── Internal helpers ──

function mergeDefaults(raw, themeId) {
  const theme = { ...raw, _id: themeId, _builtin: true };

  // timings
  theme.timings = {
    ...DEFAULT_TIMINGS,
    ...(raw.timings || {}),
    minDisplay: { ...DEFAULT_TIMINGS.minDisplay, ...(raw.timings && raw.timings.minDisplay) },
    autoReturn: { ...DEFAULT_TIMINGS.autoReturn, ...(raw.timings && raw.timings.autoReturn) },
  };

  // hitBoxes
  theme.hitBoxes = { ...DEFAULT_HITBOXES, ...(raw.hitBoxes || {}) };
  theme.wideHitboxFiles = raw.wideHitboxFiles || [];
  theme.sleepingHitboxFiles = raw.sleepingHitboxFiles || [];

  // objectScale
  theme.objectScale = { ...DEFAULT_OBJECT_SCALE, ...(raw.objectScale || {}) };

  // eyeTracking
  theme.eyeTracking = { ...DEFAULT_EYE_TRACKING, ...(raw.eyeTracking || {}) };
  theme.eyeTracking.ids = {
    ...DEFAULT_EYE_TRACKING.ids,
    ...(raw.eyeTracking && raw.eyeTracking.ids || {}),
  };

  // miniMode
  if (raw.miniMode) {
    theme.miniMode = {
      supported: true,
      ...raw.miniMode,
      timings: {
        minDisplay: {},
        autoReturn: {},
        ...(raw.miniMode.timings || {}),
      },
      glyphFlips: raw.miniMode.glyphFlips || {},
    };
  } else {
    theme.miniMode = { supported: false, states: {}, timings: { minDisplay: {}, autoReturn: {} }, glyphFlips: {} };
  }

  // Merge mini timings into main timings for state.js convenience
  // state.js reads MIN_DISPLAY_MS and AUTO_RETURN_MS as flat objects
  if (theme.miniMode.timings) {
    Object.assign(theme.timings.minDisplay, theme.miniMode.timings.minDisplay || {});
    Object.assign(theme.timings.autoReturn, theme.miniMode.timings.autoReturn || {});
  }

  // displayHintMap
  theme.displayHintMap = raw.displayHintMap || {};

  // reactions
  theme.reactions = raw.reactions || null;

  // workingTiers / jugglingTiers — auto sort descending by minSessions
  if (theme.workingTiers) {
    theme.workingTiers.sort((a, b) => b.minSessions - a.minSessions);
  }
  if (theme.jugglingTiers) {
    theme.jugglingTiers.sort((a, b) => b.minSessions - a.minSessions);
  }

  // idleAnimations
  theme.idleAnimations = raw.idleAnimations || [];

  return theme;
}

module.exports = {
  init,
  discoverThemes,
  loadTheme,
  getActiveTheme,
  resolveHint,
  getAssetsDir,
  getRendererAssetsPath,
  getRendererConfig,
  getHitRendererConfig,
  validateTheme,
};
