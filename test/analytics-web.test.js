"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const createAnalyticsWeb = require("../src/analytics-web");

function request(port, options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, ...options }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on("error", reject);
    req.end(body);
  });
}

// Stands in for the dashboard's handlers.
function fakeAnalytics() {
  const calls = [];
  let listener = null;
  return {
    calls,
    has: (channel) => channel === "analytics-get-timeline" || channel === "analytics-fail",
    call: async (channel, args) => {
      calls.push([channel, args]);
      if (channel === "analytics-fail") throw new Error("boom");
      return { sessions: 3, argsSeen: args.map((a) => (a === undefined ? "undefined" : a)) };
    },
    subscribe: (fn) => {
      listener = fn;
      return () => (listener = null);
    },
    fire: () => listener && listener(),
    get listening() {
      return Boolean(listener);
    },
  };
}

async function start(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "clawd-web-"));
  const analytics = fakeAnalytics();
  const web = createAnalyticsWeb({ analytics, tokenFile: path.join(dir, "web-token"), port: 0 });
  const port = await web.listen(0);
  t.after(() => web.close());
  const token = fs.readFileSync(path.join(dir, "web-token"), "utf8");
  return { analytics, web, port, token, cookie: `clawd_token=${token}`, dir };
}

test("the timeline page is only served with the token, from this machine", async (t) => {
  const { port, token, cookie, web, dir } = await start(t);
  assert.match(token, /^[0-9a-f]{48}$/);
  if (process.platform !== "win32") assert.equal(fs.statSync(path.join(dir, "web-token")).mode & 0o777, 0o600);
  assert.equal(web.url(), `http://127.0.0.1:${port}/?t=${token}`);

  assert.equal((await request(port, { path: "/" })).status, 403);
  assert.equal((await request(port, { path: "/", headers: { host: "evil.example" } })).status, 403);
  const first = await request(port, { path: `/?t=${token}` });
  assert.equal(first.status, 302);
  assert.equal(first.headers.location, "/");
  assert.match(first.headers["set-cookie"][0], /^clawd_token=[0-9a-f]+; HttpOnly; SameSite=Strict/);

  const page = await request(port, { path: "/", headers: { cookie } });
  assert.equal(page.status, 200);
  assert.ok(page.body.indexOf('<script src="/analytics-web-bridge.js"></script>') < page.body.indexOf("<style>"), "the bridge runs before the page");
  const bridge = await request(port, { path: "/analytics-web-bridge.js", headers: { cookie } });
  assert.ok(bridge.body.includes("window.analyticsAPI"));
});

test("calls reach the same handlers, and only known ones from this page", async (t) => {
  const { port, cookie, analytics } = await start(t);
  const post = (channel, body, headers = {}) =>
    request(port, { method: "POST", path: `/api/${channel}`, headers: { cookie, "content-type": "application/json", "x-clawd": "1", ...headers } }, JSON.stringify(body));

  const ok = JSON.parse((await post("analytics-get-timeline", { args: ["month", 2026, null, 0], undef: [2] })).body);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.value.argsSeen, ["month", 2026, "undefined", 0], "an argument left out stays left out");

  assert.equal((await post("analytics-get-timeline", { args: [] }, { "x-clawd": "" })).status, 403);
  assert.equal((await post("analytics-get-timeline", { args: [] }, { origin: "http://evil.example" })).status, 403);
  assert.equal((await post("analytics-nope", { args: [] })).status, 404);
  assert.equal((await post("other-thing", { args: [] })).status, 404);
  assert.deepEqual(JSON.parse((await post("analytics-fail", { args: [] })).body), { ok: false, error: "boom" });
  assert.equal(analytics.calls.length, 2);
});

test("new sessions are pushed to an open page, and the watcher stops when it closes", async (t) => {
  const { port, cookie, analytics } = await start(t);
  const got = await new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path: "/events", headers: { cookie } }, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
        if (data.includes(": open")) analytics.fire();
        if (data.includes("event: sessions-updated")) {
          resolve(data);
          req.destroy();
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
  assert.ok(got.includes("event: sessions-updated"));
  for (let i = 0; i < 50 && analytics.listening; i++) await new Promise((r) => setTimeout(r, 10));
  assert.equal(analytics.listening, false);
});

test("the browser bridge offers exactly the calls the window's preload does", () => {
  const read = (file) => fs.readFileSync(path.join(__dirname, "..", "src", file), "utf8");
  const preload = [...read("preload-analytics.js").matchAll(/^\s*(\w+):\s*\([^)]*\)\s*=>\s*ipcRenderer\.invoke\("([a-z-]+)"/gm)].map((m) => `${m[1]}=${m[2]}`);
  const bridge = [...read("analytics-web-bridge.js").matchAll(/^\s*(\w+):\s*"(analytics-[a-z-]+)"/gm)].map((m) => `${m[1]}=${m[2]}`);
  assert.ok(preload.length > 30);
  assert.deepEqual(bridge.sort(), preload.sort());
  assert.ok(read("analytics-web-bridge.js").includes("api.onSessionsUpdated"));
});

test("every call the bridge offers has a handler in the dashboard", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "src", "analytics.js"), "utf8");
  const handled = new Set([...source.matchAll(/\n  handle\("([a-z-]+)"/g)].map((m) => m[1]));
  const bridge = [...fs.readFileSync(path.join(__dirname, "..", "src", "analytics-web-bridge.js"), "utf8").matchAll(/"(analytics-[a-z-]+)"/g)].map((m) => m[1]);
  for (const channel of bridge) assert.ok(handled.has(channel), `${channel} has a handler`);
});
