"use strict";

const defaultHitGeometry = require("./hit-geometry");
const {
  getThemeMarginBox: defaultGetThemeMarginBox,
  computeThemeAnchorRect: defaultComputeThemeAnchorRect,
} = require("./visible-margins");

function createPetGeometryMain(options = {}) {
  const hitGeometry = options.hitGeometry || defaultHitGeometry;
  const getThemeMarginBox = options.getThemeMarginBox || defaultGetThemeMarginBox;
  const computeThemeAnchorRect = options.computeThemeAnchorRect || defaultComputeThemeAnchorRect;
  const getActiveTheme = options.getActiveTheme || (() => null);
  const getCurrentState = options.getCurrentState || (() => null);
  const getCurrentSvg = options.getCurrentSvg || (() => null);
  const getCurrentHitBox = options.getCurrentHitBox || (() => null);
  const getMiniMode = options.getMiniMode || (() => false);
  const getMiniPeekOffset = options.getMiniPeekOffset || (() => 0);

  function getCurrentFile(theme) {
    return getCurrentSvg()
      || (theme && theme.states && theme.states.idle && theme.states.idle[0])
      || null;
  }

  function getFullAssetRect(bounds) {
    return { x: bounds.x, y: bounds.y, w: bounds.width, h: bounds.height };
  }

  function getFullHitRect(bounds) {
    return {
      left: bounds.x,
      top: bounds.y,
      right: bounds.x + bounds.width,
      bottom: bounds.y + bounds.height,
    };
  }

  function getObjRect(bounds) {
    if (!bounds) return null;
    const theme = getActiveTheme();
    const state = getCurrentState();
    const file = getCurrentFile(theme);
    return hitGeometry.getAssetRectScreen(theme, bounds, state, file)
      || getFullAssetRect(bounds);
  }

  function getAssetPointerPayload(bounds, point) {
    if (!bounds || !point) return null;
    const theme = getActiveTheme();
    if (!theme) return null;
    const state = getCurrentState();
    const file = getCurrentFile(theme);
    return hitGeometry.getAssetPointerPayload(theme, bounds, state, file, point);
  }

  function getHitRectScreen(bounds) {
    if (!bounds) return null;
    const theme = getActiveTheme();
    const state = getCurrentState();
    const file = getCurrentFile(theme);
    const miniMode = !!getMiniMode();
    const hit = hitGeometry.getHitRectScreen(
      theme,
      bounds,
      state,
      file,
      getCurrentHitBox(),
      {
        padX: miniMode ? getMiniPeekOffset() : 0,
        padY: miniMode ? 8 : 0,
      }
    );
    return hit || getFullHitRect(bounds);
  }

  function getUpdateBubbleAnchorRect(bounds) {
    if (!bounds) return getHitRectScreen(bounds);
    const theme = getActiveTheme();
    if (!theme) return getHitRectScreen(bounds);

    const stableAnchor = computeThemeAnchorRect(theme, bounds);
    if (stableAnchor) return stableAnchor;

    const box = getThemeMarginBox(theme);
    const currentFile = getCurrentSvg();
    if (box && currentFile) {
      const currentAnchor = computeThemeAnchorRect(theme, bounds, {
        box,
        state: getCurrentState(),
        file: currentFile,
      });
      if (currentAnchor) return currentAnchor;
    }

    return getHitRectScreen(bounds);
  }

  function getSessionHudAnchorRect(bounds) {
    if (!bounds) return null;
    const theme = getActiveTheme();
    if (!theme) return null;
    const box = getThemeMarginBox(theme);
    if (!box) return null;
    return computeThemeAnchorRect(theme, bounds, { box });
  }

  return {
    getObjRect,
    getAssetPointerPayload,
    getHitRectScreen,
    getUpdateBubbleAnchorRect,
    getSessionHudAnchorRect,
  };
}

module.exports = createPetGeometryMain;
