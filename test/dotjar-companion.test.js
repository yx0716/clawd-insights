"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");

const dotjarLink = require("../src/dotjar-link");
const initDotjarCompanion = require("../src/dotjar-companion");

const dot = (id, kind, status = "open") => ({ id, kind, status });
const pulseOf = (dots, extra = {}) => ({ day: "2026-10-14", dots, open: dots.filter((d) => d.status === "open").length, ...extra });

test("dotjar's address comes from the files it writes, and only well-formed ones count", () => {
  const files = {
    [path.join("/s", "web-token")]: "a".repeat(48) + "\n",
    [path.join("/s", "web.pid")]: JSON.stringify({ pid: 1, port: 4747 }),
  };
  const read = (file) => {
    if (!(file in files)) throw new Error("ENOENT");
    return files[file];
  };
  assert.deepEqual(dotjarLink.readLink("/s", read), { port: 4747, token: "a".repeat(48) });
  assert.equal(dotjarLink.readLink("/nowhere", read), null);
  files[path.join("/s", "web.pid")] = JSON.stringify({ port: 99999 });
  assert.equal(dotjarLink.readLink("/s", read), null);
  assert.equal(dotjarLink.dotjarHome({ DOTJAR_HOME: "/x" }, "/home/u"), "/x");
  assert.equal(dotjarLink.dotjarHome({}, "/home/u", () => false), path.join("/home/u", ".dotjar"));
  // From before the rename: the old folder and the old variable still count.
  assert.equal(dotjarLink.dotjarHome({}, "/home/u", (f) => f === path.join("/home/u", ".strata")), path.join("/home/u", ".strata"));
  assert.equal(dotjarLink.dotjarHome({ STRATA_HOME: "/old" }, "/home/u"), "/old");
  assert.equal(dotjarLink.pageUrl({ port: 4747, token: "ab" }), "http://127.0.0.1:4747/?t=ab");
});

test("dotjar's command is found when named, pointed at by folder, or where dotjar said it lives", () => {
  const exists = (file) => ["/bin/dotjar.js", path.join("/repo", "bin", "dotjar.js"), "/opt/dotjar/bin/dotjar.js", "/opt/evil.js"].includes(file);
  const none = () => {
    throw new Error("ENOENT");
  };
  const said = (bin) => (file) => {
    if (file !== path.join("/s", "install.json")) throw new Error("ENOENT");
    return JSON.stringify({ bin });
  };
  assert.equal(dotjarLink.findBin({ DOTJAR_BIN: "/bin/dotjar.js" }, none, exists), "/bin/dotjar.js");
  assert.equal(dotjarLink.findBin({ DOTJAR_DIR: "/repo" }, none, exists), path.join("/repo", "bin", "dotjar.js"));
  assert.equal(dotjarLink.findBin({ DOTJAR_HOME: "/s" }, said("/opt/dotjar/bin/dotjar.js"), exists), "/opt/dotjar/bin/dotjar.js");
  assert.equal(dotjarLink.findBin({ DOTJAR_HOME: "/s" }, said("/opt/evil.js"), exists), null, "only a dotjar.js is run");
  assert.equal(dotjarLink.findBin({ DOTJAR_HOME: "/s" }, said("relative/dotjar.js"), exists), null);
  assert.equal(dotjarLink.findBin({}, none, exists, () => { throw new Error("not installed"); }), null);
  // The copy Clawd ships with.
  const shipped = "/app/node_modules/dotjar/bin/dotjar.js";
  assert.equal(dotjarLink.findBin({}, none, (f) => f === shipped, () => shipped), shipped);
});

test("only new dots and newly kept ones count as news, and never on the first look or a new day", () => {
  const before = pulseOf([dot("a", "note"), dot("b", "rule")]);
  const after = pulseOf([dot("a", "note", "kept"), dot("b", "rule"), dot("c", "skill")]);
  assert.deepEqual(dotjarLink.diffPulse(null, after), { found: [], kept: [] });
  assert.deepEqual(dotjarLink.diffPulse(before, after), { found: [dot("c", "skill")], kept: [dot("a", "note", "kept")] });
  assert.deepEqual(dotjarLink.diffPulse(before, { ...after, day: "2026-10-15" }), { found: [], kept: [] });
});

test("a call carries dotjar's token and header and returns the answer", async (t) => {
  let seen = null;
  const srv = http.createServer((req, res) => {
    seen = { url: req.url, header: req.headers["x-dotjar"], cookie: req.headers.cookie };
    res.end(JSON.stringify({ ok: true, value: { day: "2026-10-14", dots: [] } }));
  });
  await new Promise((resolve) => srv.listen(0, "127.0.0.1", resolve));
  t.after(() => srv.close());
  const value = await dotjarLink.call({ port: srv.address().port, token: "ab12" }, "pulse");
  assert.equal(value.day, "2026-10-14");
  assert.deepEqual(seen, { url: "/api/pulse", header: "1", cookie: "dotjar_token=ab12" });
});

// A companion wired to fakes: a dotjar that answers from a list of pulses,
// and a pet that records what it was asked to do.
function harness(pulses, options = {}) {
  let clock = 0;
  const calls = [];
  const states = [];
  const bubbles = [];
  let petState = options.petState || "idle";
  const pending = [];
  const companion = initDotjarCompanion(
    {
      t: (key) => key,
      setState: (state) => {
        states.push(state);
        petState = state;
      },
      resolveDisplayState: () => "idle",
      getCurrentState: () => petState,
      get doNotDisturb() {
        return Boolean(options.dnd);
      },
      showBubble: (payload) => bubbles.push(payload),
      openExternal: (url) => calls.push(["open", url]),
    },
    {
      now: () => clock,
      setTimeout: (fn) => (pending.push(fn), pending.length),
      clearTimeout: () => {},
      setInterval: () => 1,
      clearInterval: () => {},
      link: {
        dotjarHome: () => "/s",
        readLink: () => (options.noDotjar ? null : { port: options.port || 1, token: "ab" }),
        findBin: () => options.bin || null,
        isUpdating: () => Boolean(options.updating),
        start: (bin) => calls.push(["start", bin]),
        call: async () => {
          if (options.down) throw new Error("ECONNREFUSED");
          return pulses.shift();
        },
      },
    }
  );
  return {
    companion,
    states,
    bubbles,
    calls,
    pending,
    advance: (ms) => (clock += ms),
    setPet: (state) => (petState = state),
  };
}

test("Clawd hops and shows the new dots, then carries off a kept one", async () => {
  const h = harness([
    pulseOf([dot("a", "note")]),
    pulseOf([dot("a", "note"), dot("b", "rule"), dot("c", "skill")]),
    pulseOf([dot("a", "note"), dot("b", "rule", "kept"), dot("c", "skill")]),
  ]);
  await h.companion.pulse(); // the first look only learns what is there
  assert.deepEqual(h.states, []);
  await h.companion.pulse();
  assert.deepEqual(h.states, ["attention"]);
  assert.equal(h.bubbles[0].mode, "found");
  assert.deepEqual(h.bubbles[0].dots, ["rule", "skill"]);
  assert.equal(h.bubbles[0].title, "dotjarFoundTitle");
  await h.companion.pulse();
  assert.deepEqual(h.states, ["attention", "carrying"]);
  assert.equal(h.bubbles[1].mode, "kept");
  assert.deepEqual(h.bubbles[1].dots, ["rule"]);
});

test("Clawd juggles waiting dots now and then, only when idle and not in do-not-disturb", async () => {
  const waiting = () => pulseOf([dot("a", "note")]);
  const h = harness([waiting(), waiting(), waiting(), waiting()]);
  await h.companion.pulse();
  assert.deepEqual(h.states, [], "not right after waking up");
  h.advance(26 * 60 * 1000);
  h.setPet("working");
  await h.companion.pulse();
  assert.deepEqual(h.states, [], "not while an agent is working");
  h.setPet("idle");
  await h.companion.pulse();
  assert.deepEqual(h.states, ["juggling"]);
  h.pending.shift()(); // a few seconds later it goes back to what the agents say
  assert.deepEqual(h.states, ["juggling", "idle"]);
  await h.companion.pulse();
  assert.deepEqual(h.states, ["juggling", "idle"], "and not again straight away");

  const quiet = harness([waiting(), waiting()], { dnd: true });
  await quiet.companion.pulse();
  quiet.advance(26 * 60 * 1000);
  await quiet.companion.pulse();
  assert.deepEqual(quiet.states, []);
});

test("opening dotjar starts it when it is not running, and says so when it cannot", async () => {
  const h = harness([], { noDotjar: true, bin: "/bin/dotjar.js" });
  let done = false;
  const opening = h.companion.open().finally(() => (done = true));
  // The wait for dotjar to come up is driven by the fake timers.
  for (let i = 0; i < 100 && !done; i++) {
    await new Promise((resolve) => setImmediate(resolve));
    if (h.pending.length) h.pending.shift()();
  }
  await opening;
  assert.deepEqual(h.calls[0], ["start", "/bin/dotjar.js"]);
  assert.equal(h.bubbles[0].mode, "missing");

  const up = harness([]);
  assert.equal(await up.companion.open(), true);
  assert.deepEqual(up.calls, [["open", "http://127.0.0.1:1/?t=ab"]]);
});

test("a dotjar that stops answering is looked for again, quietly", async () => {
  const h = harness([], { down: true, bin: "/bin/dotjar.js", noDotjar: true });
  assert.equal(await h.companion.pulse(), null);
  assert.deepEqual(h.calls, [["start", "/bin/dotjar.js"]]);
  await h.companion.pulse();
  assert.equal(h.calls.length, 1, "started at most once");
  assert.deepEqual(h.bubbles, []);
});

test("upgrade downtime does not start a second service or replay old stars", async () => {
  const options = { bin: "/managed/launcher/bin/dotjar.js" };
  const unchanged = pulseOf([dot("a", "note")]);
  const h = harness([unchanged, unchanged], options);
  await h.companion.pulse();
  options.down = true;
  options.updating = true;
  options.noDotjar = true;
  await h.companion.pulse();
  await h.companion.pulse();
  assert.deepEqual(h.calls, [], "the updater owns restart while its gate is live");
  options.down = false;
  options.updating = false;
  options.noDotjar = false;
  options.port = 2;
  await h.companion.pulse();
  assert.deepEqual(h.bubbles, []);
  assert.equal(h.companion.link.port, 2);
});

test("a stale pid file is probed before opening and does not prevent restart", async () => {
  const options = { down: true, bin: "/bin/dotjar.js" };
  const h = harness([], options);
  const opening = h.companion.open();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(h.calls, [["start", "/bin/dotjar.js"]]);
  options.down = false;
  options.port = 2;
  h.pending.shift()();
  assert.equal(await opening, true);
  assert.deepEqual(h.calls[1], ["open", "http://127.0.0.1:2/?t=ab"]);
});

test("an update deferral does not consume the companion's automatic startup attempt", async () => {
  const options = { noDotjar: true, updating: true, bin: "/managed/launcher/bin/dotjar.js" };
  const h = harness([], options);
  await h.companion.pulse();
  assert.deepEqual(h.calls, []);
  options.updating = false;
  await h.companion.pulse();
  assert.deepEqual(h.calls, [["start", options.bin]]);
});

test("opening during a long update explains the wait rather than suggesting another start", async () => {
  const h = harness([], { noDotjar: true, updating: true, bin: "/managed/launcher/bin/dotjar.js" });
  let done = false;
  const opening = h.companion.open().finally(() => { done = true; });
  for (let i = 0; i < 100 && !done; i++) {
    await new Promise((resolve) => setImmediate(resolve));
    if (h.pending.length) h.pending.shift()();
  }
  assert.equal(await opening, false);
  assert.deepEqual(h.calls, []);
  assert.equal(h.bubbles[0].mode, "updating");
  assert.equal(h.bubbles[0].title, "dotjarUpdatingTitle");
});

test("dotjar startup respects live update gates and the managed Node executable", () => {
  const env = { DOTJAR_HOME: "/data", ELECTRON_RUN_AS_NODE: "1" };
  const files = {};
  const read = (file) => {
    if (file in files) return JSON.stringify(files[file]);
    throw Object.assign(new Error("missing"), { code: "ENOENT" });
  };
  const gate = path.join("/data", "operations", "update.json");
  const child = new (require("node:events").EventEmitter)();
  child.unref = () => {};
  const calls = [];
  const options = { env, read, alive: () => true, execPath: "/Clawd/Electron", exists: (p) => p === "/usr/local/bin/node", spawn: (...args) => { calls.push(args); return child; } };
  dotjarLink.start("/bundled/bin/dotjar.js", options);
  assert.equal(calls[0][0], "/Clawd/Electron");
  assert.equal(calls[0][2].env.ELECTRON_RUN_AS_NODE, "1");
  assert.doesNotThrow(() => child.emit("error", Error("spawn failed")));
  const base = path.resolve("/managed");
  const bin = path.join(base, "launcher", "bin", "dotjar.js");
  files[path.join(base, "installation.json")] = { protocol: 1, node: "/usr/local/bin/node", dataDir: "/data" };
  dotjarLink.start(bin, options);
  assert.equal(calls[1][0], "/usr/local/bin/node");
  assert.deepEqual(calls[1][1], [bin, "web", "--no-open"]);
  assert.equal(calls[1][2].env.ELECTRON_RUN_AS_NODE, undefined);
  assert.equal(calls[1][2].env.DOTJAR_HOME, "/data");
  assert.equal(env.ELECTRON_RUN_AS_NODE, "1", "the parent's environment stays intact");
  files[path.join("/data", "install.json")] = { bin, port: 4755 };
  dotjarLink.start(bin, options);
  assert.deepEqual(calls[2][1], [bin, "web", "--no-open", "--port", "4755"], "restart on the user's recorded port");
  files[path.join("/data", "install.json")].port = 65536;
  dotjarLink.start(bin, options);
  assert.deepEqual(calls[3][1], [bin, "web", "--no-open"], "invalid ports are not passed through");
  files[gate] = { id: "update", pid: 123 };
  assert.equal(dotjarLink.start(bin, options), null);
  assert.equal(calls.length, 4);
  assert.equal(dotjarLink.isUpdating(env, read, () => false), false, "a dead updater can be recovered by the stable launcher");
  delete files[gate];
  assert.throws(() => dotjarLink.start(bin, { ...options, exists: () => false }), /Node executable/);
  assert.equal(calls.length, 4, "a missing managed Node must not fall back to Clawd's executable");
});

test("the dots are juggled with the balls-in-the-air animation in every bundled theme", () => {
  const picks = ["clawd", "calico", "cloudling"].map((name) => require("../src/dotjar-companion").jugglingFile(require(`../themes/${name}/theme.json`)));
  assert.deepEqual(picks, ["clawd-working-juggling.svg", "calico-working-juggling.apng", "cloudling-juggling.svg"]);
  assert.equal(require("../src/dotjar-companion").jugglingFile({ states: { juggling: ["x-groove.svg"] } }), null, "no juggling art: the state's own animation is used");
});
