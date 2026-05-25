"use strict";

const noop = () => {};

function isLiveWindow(win) {
  return !!(win && (typeof win.isDestroyed !== "function" || !win.isDestroyed()));
}

function getPendingList(getPendingPermissions) {
  const pending = getPendingPermissions();
  return Array.isArray(pending) ? pending : [];
}

function createFloatingWindowRuntime(options = {}) {
  const getPendingPermissions = options.getPendingPermissions || (() => []);
  const keepOutOfTaskbar = options.keepOutOfTaskbar || noop;
  const repositionPermissionBubbles = options.repositionPermissionBubbles || noop;
  const repositionUpdateBubble = options.repositionUpdateBubble || noop;
  const repositionSessionHud = options.repositionSessionHud || noop;
  const syncSessionHudVisibility = options.syncSessionHudVisibility || noop;
  const syncUpdateBubbleVisibility = options.syncUpdateBubbleVisibility || noop;
  const hideUpdateBubble = options.hideUpdateBubble || noop;

  function repositionFloatingBubbles() {
    if (getPendingList(getPendingPermissions).length) repositionPermissionBubbles();
    repositionUpdateBubble();
  }

  function repositionAnchoredSurfaces() {
    repositionSessionHud();
    repositionFloatingBubbles();
  }

  function syncSessionHudVisibilityAndBubbles() {
    syncSessionHudVisibility();
    repositionFloatingBubbles();
  }

  function showFloatingSurfacesForPet() {
    for (const perm of getPendingList(getPendingPermissions)) {
      const bubble = perm && perm.bubble;
      if (isLiveWindow(bubble) && typeof bubble.showInactive === "function") {
        bubble.showInactive();
        keepOutOfTaskbar(bubble);
      }
    }
    syncUpdateBubbleVisibility();
  }

  function hideFloatingSurfacesForPet() {
    for (const perm of getPendingList(getPendingPermissions)) {
      const bubble = perm && perm.bubble;
      if (isLiveWindow(bubble) && typeof bubble.hide === "function") {
        bubble.hide();
      }
    }
    hideUpdateBubble();
  }

  return {
    repositionFloatingBubbles,
    repositionAnchoredSurfaces,
    syncSessionHudVisibilityAndBubbles,
    showFloatingSurfacesForPet,
    hideFloatingSurfacesForPet,
  };
}

module.exports = createFloatingWindowRuntime;
