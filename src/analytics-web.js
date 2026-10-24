"use strict";

// The session timeline (Agent 会话时间轴) as a page in the browser
// (clawd-insights fork). Same page, same calls as the dashboard window:
// analytics.html is served with a small script in place of the window's
// preload, and each call is handed to the handler the window would use.
//
// Only 127.0.0.1 is listened on, and every request has to carry the token in
// ~/.clawd/web-token (traded for a cookie on first visit), so neither another
// website nor another user on the machine can reach it.

const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");

const DEFAULT_PORT = 4848;
const COOKIE = "clawd_token";
const BODY_LIMIT = 4 * 1024 * 1024;
const PING_MS = 25 * 1000;
const HTML = path.join(__dirname, "analytics.html");
const BRIDGE = path.join(__dirname, "analytics-web-bridge.js");

// One token per machine user, readable only by them.
function loadToken(file) {
  try {
    const existing = fs.readFileSync(file, "utf8").trim();
    if (/^[0-9a-f]{48}$/.test(existing)) return existing;
  } catch {
    // first run
  }
  const token = crypto.randomBytes(24).toString("hex");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, token, { mode: 0o600 });
  return token;
}

function sameToken(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

function cookieOf(req, name) {
  for (const part of String(req.headers.cookie || "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return "";
}

function send(res, status, type, body, headers = {}) {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff", ...headers });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        reject(new Error("request too large"));
        req.destroy();
      } else {
        chunks.push(chunk);
      }
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// The page with the bridge loaded before anything else on it runs.
function pageHtml(file = HTML) {
  return fs.readFileSync(file, "utf8").replace("<head>", '<head>\n  <script src="/analytics-web-bridge.js"></script>');
}

module.exports = function createAnalyticsWeb(options) {
  const analytics = options.analytics;
  const token = loadToken(options.tokenFile);
  const streams = new Set();
  let unsubscribe = null;
  let pinger = null;
  let port = null;

  function broadcast() {
    for (const res of streams) res.write("event: sessions-updated\ndata: {}\n\n");
  }

  function openStream(req, res) {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
    res.write(": open\n\n");
    streams.add(res);
    if (!unsubscribe) unsubscribe = analytics.subscribe(broadcast);
    if (!pinger) pinger = setInterval(() => streams.forEach((s) => s.write(": ping\n\n")), PING_MS);
    req.on("close", () => {
      streams.delete(res);
      if (!streams.size) {
        if (unsubscribe) unsubscribe();
        unsubscribe = null;
        clearInterval(pinger);
        pinger = null;
      }
    });
  }

  const server = http.createServer(async (req, res) => {
    try {
      // A page elsewhere that points a hostname at 127.0.0.1 still sends that
      // hostname here; only loopback names are served.
      const host = String(req.headers.host || "");
      if (!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host)) return send(res, 403, "text/plain; charset=utf-8", "forbidden");
      const url = new URL(req.url, `http://${host}`);

      const offered = url.searchParams.get("t");
      if (offered && sameToken(offered, token)) {
        url.searchParams.delete("t");
        return send(res, 302, "text/plain", "", {
          location: url.pathname + url.search,
          "set-cookie": `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000`,
        });
      }
      if (!sameToken(cookieOf(req, COOKIE), token)) {
        return send(res, 403, "text/html; charset=utf-8", "<!doctype html><meta charset=utf-8><title>Clawd</title><p style=\"font:16px system-ui;margin:3em\">从 Clawd 的右键菜单打开这个页面。<br>Open this page from Clawd's right-click menu.</p>");
      }

      if (req.method === "GET" && url.pathname === "/") return send(res, 200, "text/html; charset=utf-8", pageHtml(options.htmlFile));
      if (req.method === "GET" && url.pathname === "/analytics-web-bridge.js") return send(res, 200, "text/javascript; charset=utf-8", fs.readFileSync(options.bridgeFile || BRIDGE));
      if (req.method === "GET" && url.pathname === "/events") return openStream(req, res);

      if (req.method === "POST" && url.pathname.startsWith("/api/")) {
        // A custom header needs a preflight this server never grants, so a
        // form or script on another page cannot reach here.
        const origin = req.headers.origin;
        if (req.headers["x-clawd"] !== "1" || (origin && origin !== `http://${host}`)) return send(res, 403, "application/json", JSON.stringify({ ok: false, error: "forbidden" }));
        const channel = url.pathname.slice(5);
        if (!/^analytics-[a-z-]+$/.test(channel) || !analytics.has(channel)) return send(res, 404, "application/json", JSON.stringify({ ok: false, error: "no such call" }));
        const raw = await readBody(req);
        const parsed = raw ? JSON.parse(raw) : {};
        const args = Array.isArray(parsed.args) ? parsed.args : [];
        // JSON has no undefined; the page says which arguments were left out.
        for (const i of Array.isArray(parsed.undef) ? parsed.undef : []) if (Number.isInteger(i) && i >= 0 && i < args.length) args[i] = undefined;
        try {
          const value = await analytics.call(channel, args);
          return send(res, 200, "application/json; charset=utf-8", JSON.stringify({ ok: true, value: value === undefined ? null : value }));
        } catch (err) {
          return send(res, 200, "application/json; charset=utf-8", JSON.stringify({ ok: false, error: (err && err.message) || String(err) }));
        }
      }
      return send(res, 404, "text/plain; charset=utf-8", "not found");
    } catch (err) {
      if (!res.headersSent) send(res, 400, "application/json; charset=utf-8", JSON.stringify({ ok: false, error: (err && err.message) || String(err) }));
      else res.end();
    }
  });

  // The usual port, or the next free one after it.
  async function listen(wanted = options.port == null ? DEFAULT_PORT : options.port) {
    for (let p = wanted; p < wanted + 10; p++) {
      try {
        await new Promise((resolve, reject) => {
          server.once("error", reject);
          server.listen(p, "127.0.0.1", () => {
            server.removeListener("error", reject);
            resolve();
          });
        });
        port = server.address().port;
        return port;
      } catch (err) {
        if (err.code !== "EADDRINUSE" || wanted === 0) throw err;
      }
    }
    throw new Error(`ports ${wanted}-${wanted + 9} are all taken`);
  }

  function close() {
    for (const res of streams) res.end();
    streams.clear();
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    clearInterval(pinger);
    server.close();
  }

  return {
    listen,
    close,
    get port() {
      return port;
    },
    url: () => (port ? `http://127.0.0.1:${port}/?t=${token}` : null),
  };
};

module.exports.__test = { loadToken, sameToken, cookieOf, pageHtml, COOKIE };
