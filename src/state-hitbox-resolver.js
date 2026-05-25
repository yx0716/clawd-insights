"use strict";

function createHitboxRuntime(theme) {
  return {
    hitBoxes: theme.hitBoxes,
    fileHitBoxes: theme.fileHitBoxes || {},
    wideSvgs: new Set(theme.wideHitboxFiles || []),
    sleepingSvgs: new Set(theme.sleepingHitboxFiles || []),
  };
}

function resolveHitBoxForSvg(svg, runtime) {
  const hitBoxes = runtime.hitBoxes;
  const fileHitBoxes = runtime.fileHitBoxes;
  const wideSvgs = runtime.wideSvgs;
  const sleepingSvgs = runtime.sleepingSvgs;

  if (svg && fileHitBoxes[svg]) return fileHitBoxes[svg];
  if (svg && sleepingSvgs.has(svg)) return hitBoxes.sleeping;
  if (svg && wideSvgs.has(svg)) return hitBoxes.wide;
  return hitBoxes.default;
}

module.exports = {
  createHitboxRuntime,
  resolveHitBoxForSvg,
};
