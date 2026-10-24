"use strict";

// The link to dotjar (clawd-insights fork): a local page that goes through
// each day's work with agents and keeps the ways of thinking worth keeping,
// one coloured dot each. dotjar runs its own small server on 127.0.0.1; this
// module finds it, asks it how the day stands, and works out what changed.
// Everything here is plain Node so it can be tested without Electron.

const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const KINDS = ["note", "rule", "skill", "memory"];

// Where dotjar keeps its data; it honours the same variables. Before it was
// renamed it was called strata and kept its data in ~/.strata.
function dotjarHome(env = process.env, home = os.homedir(), exists = fs.existsSync) {
  const named = String(env.DOTJAR_HOME || env.STRATA_HOME || "").trim();
  if (named) return named;
  const fresh = path.join(home, ".dotjar");
  const old = path.join(home, ".strata");
  return !exists(fresh) && exists(old) ? old : fresh;
}

// The port dotjar wrote when it last started, and the token every request
// has to carry. Null when dotjar has never been started on this machine.
function readLink(dir, read = (f) => fs.readFileSync(f, "utf8")) {
  let token;
  let port;
  try {
    token = read(path.join(dir, "web-token")).trim();
    port = Number(JSON.parse(read(path.join(dir, "web.pid"))).port);
  } catch {
    return null;
  }
  if (!/^[0-9a-f]{16,}$/.test(token) || !Number.isInteger(port) || port <= 0 || port > 65535) return null;
  return { port, token };
}

// Ask dotjar something. Resolves to the answer's value; rejects when dotjar
// is not there or says no.
function call(link, name, args = [], options = {}) {
  const timeoutMs = options.timeoutMs || 3000;
  const body = JSON.stringify({ args });
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: link.port,
        path: `/api/${name}`,
        method: "POST",
        timeout: timeoutMs,
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
          "x-dotjar": "1",
          cookie: `dotjar_token=${link.token}`,
        },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed && parsed.ok) resolve(parsed.value);
            else reject(new Error((parsed && parsed.error) || `dotjar answered ${res.statusCode}`));
          } catch {
            reject(new Error(`dotjar answered ${res.statusCode}`));
          }
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("dotjar did not answer in time")));
    req.on("error", reject);
    req.end(body);
  });
}

// dotjar's command, when this machine has one Clawd can start: named
// outright, a checkout named by folder, wherever dotjar said it lives the
// last time it started (it writes install.json beside its other files), or
// else the copy Clawd ships with (the "dotjar" dependency, pinned to
// github.com/yx0716/dotjar). Only a file called dotjar.js is ever run.
function findBin(env = process.env, read = (f) => fs.readFileSync(f, "utf8"), exists = fs.existsSync, resolve = require.resolve) {
  const candidates = [];
  if (env.DOTJAR_BIN) candidates.push(env.DOTJAR_BIN);
  if (env.DOTJAR_DIR) candidates.push(path.join(env.DOTJAR_DIR, "bin", "dotjar.js"));
  try {
    candidates.push(JSON.parse(read(path.join(dotjarHome(env, os.homedir(), exists), "install.json"))).bin);
  } catch {
    // dotjar has not started on this machine yet
  }
  try {
    // In a packaged app the files are unpacked beside the archive, so a
    // separate process can run them.
    const shipped = resolve("dotjar/bin/dotjar.js");
    candidates.push(shipped.replace(/app\.asar([\\/])/, "app.asar.unpacked$1"), shipped);
  } catch {
    // not installed alongside
  }
  return candidates.find((file) => typeof file === "string" && path.isAbsolute(file) && path.basename(file) === "dotjar.js" && exists(file)) || null;
}

// Start dotjar's server in the background. Inside Electron the executable is
// Electron itself, so it is asked to behave as plain Node; dotjar detaches
// the server and the command returns straight away.
function start(bin, options = {}) {
  const run = options.spawn || spawn;
  const child = run(process.execPath, [bin, "web", "--no-open"], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
  });
  if (child && typeof child.unref === "function") child.unref();
  return child;
}

// The address that opens dotjar in a browser. The token in it is traded for
// a cookie on first visit and dropped from the address.
function pageUrl(link) {
  return `http://127.0.0.1:${link.port}/?t=${link.token}`;
}

function cleanDots(list) {
  return (Array.isArray(list) ? list : [])
    .filter((d) => d && typeof d.id === "string")
    .map((d) => ({ id: d.id, kind: KINDS.includes(d.kind) ? d.kind : "note", status: d.status === "kept" ? "kept" : "open" }));
}

// What changed between two looks at the day: dots that were not there
// before, and dots that have since been kept. A new day starts over, and the
// very first look only learns what is there, so nothing old is announced.
function diffPulse(prev, next) {
  const empty = { found: [], kept: [] };
  if (!next || !next.day) return empty;
  if (!prev || prev.day !== next.day) return empty;
  const before = new Map(cleanDots(prev.dots).map((d) => [d.id, d]));
  const found = [];
  const kept = [];
  for (const dot of cleanDots(next.dots)) {
    const was = before.get(dot.id);
    if (!was) found.push(dot);
    else if (was.status !== "kept" && dot.status === "kept") kept.push(dot);
  }
  return { found, kept };
}

module.exports = { KINDS, dotjarHome, readLink, call, findBin, start, pageUrl, diffPulse, cleanDots };
