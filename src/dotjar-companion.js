"use strict";

// Clawd and dotjar together (clawd-insights fork). Every little while Clawd
// asks dotjar how the day stands and reacts to what changed: a happy hop and
// a bubble of coloured dots when going through the day turned up something
// worth keeping, carrying a dot off when one is kept, and now and then, while
// idle, juggling the dots still waiting to be looked at. Clicking the bubble
// or the menu entry opens dotjar in the browser.
//
// All Electron-facing work goes through ctx, so the logic runs in tests.

const dotjarLink = require("./dotjar-link");

const POLL_MS = 20 * 1000;
const FIRST_POLL_MS = 4000;
const JUGGLE_EVERY_MS = 25 * 60 * 1000;
const JUGGLE_FOR_MS = 6000;
const OPEN_WAIT_MS = 6000;

// The juggling animation proper (balls in the air), wherever the theme keeps
// it: some themes give the plain "juggling" state a different first tier,
// such as Clawd's headphones groove.
function jugglingFile(theme) {
  if (!theme) return null;
  const files = [
    ...(Array.isArray(theme.jugglingTiers) ? theme.jugglingTiers.map((tier) => tier && tier.file) : []),
    ...(theme.states && Array.isArray(theme.states.juggling) ? theme.states.juggling : []),
  ];
  return files.find((file) => typeof file === "string" && /juggl/i.test(file)) || null;
}

function fill(text, n) {
  return String(text || "").replace(/\{n\}/g, String(n));
}

module.exports = function initDotjarCompanion(ctx, deps = {}) {
  const link = { ...dotjarLink, ...(deps.link || {}) };
  const now = deps.now || Date.now;
  const later = deps.setTimeout || setTimeout;
  const cancel = deps.clearTimeout || clearTimeout;
  const every = deps.setInterval || setInterval;
  const stopEvery = deps.clearInterval || clearInterval;
  const t = (key) => (typeof ctx.t === "function" ? ctx.t(key) : key);

  let current = null; // { port, token } of the dotjar that answered last
  let last = null; // the last pulse
  let pollTimer = null;
  let firstTimer = null;
  let juggleTimer = null;
  let juggledAt = now(); // no juggling the moment Clawd wakes up
  let triedStart = false;
  let stopped = false;

  function locate() {
    current = link.readLink(link.dotjarHome());
    return current;
  }

  // Start dotjar once if it is not running and this machine has it.
  function maybeStart() {
    if (triedStart) return false;
    const bin = link.findBin();
    if (!bin) return false;
    triedStart = true;
    try {
      link.start(bin);
      return true;
    } catch {
      return false;
    }
  }

  async function pulse() {
    if (stopped) return null;
    if (!current && !locate()) {
      maybeStart();
      return null;
    }
    let next;
    try {
      next = await link.call(current, "pulse");
    } catch {
      current = null; // restarted on another port, or stopped: look again next time
      if (!locate()) maybeStart();
      return null;
    }
    if (stopped) return null;
    react(link.diffPulse(last, next), next);
    last = next;
    return next;
  }

  function petIsIdle() {
    const state = typeof ctx.getCurrentState === "function" ? ctx.getCurrentState() : "idle";
    return state === "idle";
  }

  function keptToday(pulseNow) {
    return link.cleanDots(pulseNow && pulseNow.dots).filter((d) => d.status === "kept").length;
  }

  function react(change, next) {
    if (change.found.length) {
      ctx.setState("attention");
      ctx.showBubble({
        mode: "found",
        dots: change.found.map((d) => d.kind),
        title: fill(t("dotjarFoundTitle"), change.found.length),
        message: t("dotjarFoundSub"),
        action: t("dotjarOpen"),
      });
      return;
    }
    if (change.kept.length) {
      ctx.setState("carrying");
      ctx.showBubble({
        mode: "kept",
        dots: change.kept.map((d) => d.kind),
        title: fill(t("dotjarKeptTitle"), change.kept.length),
        message: fill(t("dotjarKeptSub"), keptToday(next)),
        action: t("dotjarOpen"),
      });
      return;
    }
    maybeJuggle(next);
  }

  // Dots still waiting: while Clawd has nothing else on, it juggles them for
  // a few seconds, at most every so often, then goes back to whatever the
  // agents say it should be doing.
  function maybeJuggle(next) {
    if (!next || !(next.open > 0) || ctx.doNotDisturb || !petIsIdle()) return;
    if (now() - juggledAt < JUGGLE_EVERY_MS) return;
    juggledAt = now();
    const balls = typeof ctx.getTheme === "function" ? jugglingFile(ctx.getTheme()) : null;
    ctx.setState("juggling", balls || undefined);
    if (juggleTimer) cancel(juggleTimer);
    juggleTimer = later(() => {
      juggleTimer = null;
      if (stopped || ctx.getCurrentState() !== "juggling") return;
      const resolved = ctx.resolveDisplayState();
      ctx.setState(resolved, typeof ctx.getSvgOverride === "function" ? ctx.getSvgOverride(resolved) : undefined);
    }, JUGGLE_FOR_MS);
  }

  // Open dotjar in the browser, starting it first if need be.
  async function open() {
    if (!current && !locate()) {
      if (maybeStart()) {
        for (let waited = 0; waited < OPEN_WAIT_MS && !locate(); waited += 300) {
          await new Promise((resolve) => later(resolve, 300));
        }
      }
    }
    if (!current) {
      ctx.showBubble({ mode: "missing", dots: [], title: t("dotjarMissingTitle"), message: t("dotjarMissingSub"), action: "" });
      return false;
    }
    ctx.openExternal(link.pageUrl(current));
    return true;
  }

  function start() {
    stopped = false;
    firstTimer = later(() => {
      firstTimer = null;
      pulse().catch(() => {});
    }, FIRST_POLL_MS);
    pollTimer = every(() => pulse().catch(() => {}), POLL_MS);
  }

  function stop() {
    stopped = true;
    if (firstTimer) cancel(firstTimer);
    if (juggleTimer) cancel(juggleTimer);
    if (pollTimer) stopEvery(pollTimer);
    firstTimer = juggleTimer = pollTimer = null;
  }

  return { start, stop, pulse, open, get link() { return current; } };
};

module.exports.jugglingFile = jugglingFile;
module.exports.__test = { fill, POLL_MS, JUGGLE_EVERY_MS, JUGGLE_FOR_MS };
