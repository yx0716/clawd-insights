// src/work-area.js — Pure work-area math, kept testable in isolation.
//
// Electron's screen.getAllDisplays() can briefly return [] during display
// topology changes (monitor plug/unplug, lock/unlock, RDP switch, startup
// race). Reading displays[0].workArea on an empty array crashes the main
// process — see issue #93. These helpers add a two-tier fallback so the
// caller always gets a usable workArea object.

// Last-resort synthetic work area when both the displays array and the
// primary-display query are unavailable. Sized for a typical 1080p screen
// so setBounds() calls stay valid until the display topology stabilizes.
const SYNTHETIC_WORK_AREA = { x: 0, y: 0, width: 1920, height: 1080 };

function getDisplayInsets(display) {
  if (!display || !display.bounds || !display.workArea) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  const { bounds, workArea } = display;
  return {
    top: Math.max(0, workArea.y - bounds.y),
    left: Math.max(0, workArea.x - bounds.x),
    bottom: Math.max(0, bounds.y + bounds.height - (workArea.y + workArea.height)),
    right: Math.max(0, bounds.x + bounds.width - (workArea.x + workArea.width)),
  };
}

function findNearestWorkArea(displays, primaryWa, cx, cy) {
  if (!Array.isArray(displays) || displays.length === 0) {
    return primaryWa || SYNTHETIC_WORK_AREA;
  }
  let nearest = displays[0].workArea;
  let minDist = Infinity;
  for (const d of displays) {
    const wa = d.workArea;
    const dx = Math.max(wa.x - cx, 0, cx - (wa.x + wa.width));
    const dy = Math.max(wa.y - cy, 0, cy - (wa.y + wa.height));
    const dist = dx * dx + dy * dy;
    if (dist < minDist) { minDist = dist; nearest = wa; }
  }
  return nearest;
}

function computeLooseClamp(displays, primaryWa, x, y, w, h, options = {}) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  if (Array.isArray(displays)) {
    for (const d of displays) {
      const wa = d.workArea;
      if (wa.x < minX) minX = wa.x;
      if (wa.y < minY) minY = wa.y;
      if (wa.x + wa.width > maxX) maxX = wa.x + wa.width;
      if (wa.y + wa.height > maxY) maxY = wa.y + wa.height;
    }
  }
  // Empty displays → fall back to primary, then synthetic. Without this
  // guard, minX/maxX stay at Infinity/-Infinity and the Math.max/min below
  // produce NaN, which makes setBounds() throw or land off-screen.
  if (minX === Infinity) {
    const wa = primaryWa || SYNTHETIC_WORK_AREA;
    minX = wa.x;
    minY = wa.y;
    maxX = wa.x + wa.width;
    maxY = wa.y + wa.height;
  }
  const marginX = options.marginX != null ? options.marginX : Math.round(w * 0.25);
  const marginTop = options.marginTop != null ? options.marginTop : Math.round(h * 0.25);
  const marginBottom = options.marginBottom != null ? options.marginBottom : Math.round(h * 0.25);
  return {
    x: Math.max(minX - marginX, Math.min(x, maxX - w + marginX)),
    y: Math.max(minY - marginTop, Math.min(y, maxY - h + marginBottom)),
  };
}

// Build a serializable snapshot of the display the pet is currently on. The
// snapshot is persisted to prefs so on next launch we can tell whether that
// physical monitor is still attached. If yes, we trust the saved position even
// if a naive clamp against the new primary workArea would nudge it. If no, we
// know the saved position belonged to a monitor that's been unplugged and
// should be regularized. Snapshot is null when Electron gives us nothing
// usable (startup race / headless / CI).
function buildDisplaySnapshot(display) {
  if (!display || !display.bounds) return null;
  const b = display.bounds;
  if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) return null;
  if (!Number.isFinite(b.width) || b.width <= 0) return null;
  if (!Number.isFinite(b.height) || b.height <= 0) return null;
  const snapshot = {
    bounds: { x: b.x, y: b.y, width: b.width, height: b.height },
  };
  const wa = display.workArea;
  if (wa && Number.isFinite(wa.x) && Number.isFinite(wa.y) && Number.isFinite(wa.width) && Number.isFinite(wa.height)) {
    snapshot.workArea = { x: wa.x, y: wa.y, width: wa.width, height: wa.height };
  }
  if (typeof display.id === "number" && Number.isFinite(display.id)) snapshot.id = display.id;
  if (typeof display.scaleFactor === "number" && Number.isFinite(display.scaleFactor)) {
    snapshot.scaleFactor = display.scaleFactor;
  }
  return snapshot;
}

function boundsMatch(a, b) {
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

// Locate the current Display that corresponds to a persisted snapshot. Primary
// signal is exact bounds equality: a display at the same origin + resolution is
// almost certainly the same physical monitor as last session. Secondary signal
// is display.id, which stays stable across sessions on macOS (CGDirectDisplayID)
// and often on Windows, but can shift when monitors are rearranged.
function findMatchingDisplay(snapshot, displays) {
  if (!snapshot || !snapshot.bounds || !Array.isArray(displays) || displays.length === 0) return null;
  for (const d of displays) {
    if (d && d.bounds && boundsMatch(d.bounds, snapshot.bounds)) return d;
  }
  if (typeof snapshot.id === "number") {
    for (const d of displays) {
      if (d && d.id === snapshot.id) return d;
    }
  }
  return null;
}

// Visibility check for the startup regularize gate. Used as a safety net when
// a display snapshot matches but the saved position ended up outside every
// current workArea (manual prefs edits, exotic RDP topology, etc.). Centering
// on the pet's midpoint is intentional: a window half-off a screen is still
// "findable" by the user; a midpoint outside every workArea means truly gone.
function isPointInAnyWorkArea(x, y, displays) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  if (!Array.isArray(displays)) return false;
  for (const d of displays) {
    if (!d || !d.workArea) continue;
    const wa = d.workArea;
    if (x >= wa.x && x < wa.x + wa.width && y >= wa.y && y < wa.y + wa.height) return true;
  }
  return false;
}

// Shape guard used by prefs.validate to drop malformed snapshots without
// throwing. Accepts only the fields buildDisplaySnapshot would have produced.
function isValidDisplaySnapshot(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const b = value.bounds;
  if (!b || typeof b !== "object") return false;
  if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) return false;
  if (!Number.isFinite(b.width) || b.width <= 0) return false;
  if (!Number.isFinite(b.height) || b.height <= 0) return false;
  return true;
}

module.exports = {
  getDisplayInsets,
  findNearestWorkArea,
  computeLooseClamp,
  buildDisplaySnapshot,
  findMatchingDisplay,
  isPointInAnyWorkArea,
  isValidDisplaySnapshot,
  SYNTHETIC_WORK_AREA,
};
