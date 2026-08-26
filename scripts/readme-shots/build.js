#!/usr/bin/env node
// Build the README screenshot pages: the shipped stylesheet + markup from
// src/analytics.html, filled with ENTIRELY FICTIONAL data. Nothing here comes
// from anyone's real sessions — projects, paths, summaries and numbers are
// invented, so the captures can be published without leaking anything.
//
// Pipeline (npm run readme-shots):
//   build.js    → .tmp/dashboard.html  .tmp/menu.html  .tmp/manifest.json
//   capture.js  → assets/*.png (stills) + .tmp/frames/*/fN.png (gif frames)
//   assemble.js → assets/*.gif (ffmpeg)
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const TMP = path.join(__dirname, ".tmp");
fs.mkdirSync(TMP, { recursive: true });

const all = fs.readFileSync(path.join(ROOT, "src", "analytics.html"), "utf8").split("\n");
const styleEnd = all.findIndex(l => l.includes("</style>"));
const bodyStart = all.findIndex(l => l.trim() === "<body>");
const scriptStart = all.findIndex((l, i) => i > bodyStart && l.trim() === "<script>");
const head = all.slice(0, styleEnd + 1).join("\n");
const body = all.slice(bodyStart + 1, scriptStart).join("\n");

// ── The dashboard page: stills + the three in-dashboard gif scenes ───────────
const dashboardMock = String.raw`
<script>
// Fictional dataset — never real project names, paths or content.
const PROJECTS = ["aurora-web", "ml-pipeline", "billing-svc", "docs-site", "recipe-app", "dotfiles", "game-jam", "infra-tools"];
const AGENTS = ["Claude Code", "Codex", "Cursor", "Copilot", "Gemini"];
let _seed = 20260826;
const rnd = () => (_seed = (_seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
setText("dailyReportBtn", "Daily");
setText("weeklyReportBtn", "Weekly");
setText("rangeLabel", "Range:");
document.getElementById("timelineHint").innerHTML = "Tip: scroll to zoom the timeline; drag or press <kbd>←</kbd> / <kbd>→</kbd> to pan.";
setText("evtSelectAllBtn", "Select Visible");
setText("evtKnowledgeBtn", "\u{1F31F} Distill Knowledge");
setText("evtExportBtn", "Export AI Analyses");
setText("weekTodayBtn", "This week");
document.getElementById("onboardingHint").hidden = true;
document.querySelector(".container").style.setProperty("--sessions-row-height", "834px");
document.getElementById("evtKnowledgeBtn").removeAttribute("disabled");
document.getElementById("evtExportBtn").removeAttribute("disabled");

for (const [id, v] of [["hDur", "38h40m"], ["hSess", "42"], ["hProj", "8"], ["hMsgs", "3,254"], ["hTools", "1,512"], ["hAgents", "5"]]) setText(id, v);
for (const [id, v] of [["hDurLabel", "Active Span"], ["hSessLabel", "Sessions"], ["hProjLabel", "Projects"], ["hMsgsLabel", "Messages"], ["hToolsLabel", "Tool Calls"], ["hAgentsLabel", "Agents"]]) setText(id, v);
setText("dateLabel", "Aug 18 – Aug 24");
document.getElementById("headerTitle").innerHTML = "<span>Insights</span>";
document.getElementById("rangeStart").innerHTML = "<option>08:00</option>";
document.getElementById("rangeEnd").innerHTML = "<option>24:00</option>";

function buildTimeline() {
  const days = [["Sun", "08/24"], ["Sat", "08/23"], ["Fri", "08/22"], ["Thu", "08/21"], ["Wed", "08/20"], ["Tue", "08/19"], ["Mon", "08/18"]];
  const laneCounts = [2, 1, 3, 4, 2, 3, 2];
  let html = "";
  days.forEach(([wd, dt], di) => {
    // A real day clusters on a few projects, and a hero image has to be
    // readable at a glance — each day draws from a pool of three projects and
    // lanes hold a handful of substantial blocks instead of confetti.
    const pool = [];
    while (pool.length < 3) { const p = Math.floor(rnd() * PROJECTS.length); if (!pool.includes(p)) pool.push(p); }
    const lanes = [];
    for (let l = 0; l < laneCounts[di]; l++) {
      let blocks = "", x = 2 + rnd() * 8;
      let count = l === 0 ? 3 + Math.floor(rnd() * 2) : 2 + Math.floor(rnd() * 2);
      while (count-- > 0 && x < 84) {
        const w = l === 0 ? 9 + rnd() * 9 : 6 + rnd() * 7;
        const p = rnd() < 0.8 ? pool[Math.floor(rnd() * pool.length)] : Math.floor(rnd() * PROJECTS.length);
        const label = w > 7 ? PROJECTS[p] + " · " + Math.floor(w * 9) + "m" : "";
        blocks += '<div class="time-block s' + (p + 1) + '" style="left:' + x.toFixed(1) + '%;width:' + w.toFixed(1) + '%">' + label + '</div>';
        x += w + 5 + rnd() * 12;
      }
      lanes.push('<div class="timeline-lane">' + blocks + '</div>');
    }
    const meta = laneCounts[di] > 1 ? '<div class="dl-meta">' + laneCounts[di] + ' lanes</div>' : "";
    html += '<div class="timeline-day"><div class="day-label"><div class="wd">' + wd + '</div><div class="dt">' + dt + '</div>' + meta + '</div><div class="timeline-tracks">' + lanes.join("") + '</div></div>';
  });
  document.getElementById("timelineContainer").innerHTML = html;
  document.getElementById("timeAxis").innerHTML = [8, 10, 12, 14, 16, 18, 20, 22, 24]
    .map((h, i) => '<div class="time-axis-label" style="left:' + (i / 8) * 100 + '%">' + String(h).padStart(2, "0") + ':00</div>').join("");
}

function buildSessions() {
  const rows = [
    { d: "08/24", t: "14:02-15:51", dur: "1h49m", a: 0, p: 0, msgs: 96, tools: 41, desc: "Traced the dark-mode flash to a late theme stamp and moved it before first paint.", tag: "analyzed", sel: true },
    { d: "08/24", t: "10:15-11:02", dur: "47m", a: 1, p: 2, msgs: 54, tools: 22, desc: "Wired retry and idempotency keys into the payment webhook.", tag: "analyzed" },
    { d: "08/23", t: "21:30-23:58", dur: "2h28m", a: 2, p: 1, msgs: 132, tools: 67, desc: "Chunked the feature-store backfill so the workers stopped running out of memory.", tag: "analyzing" },
    { d: "08/23", t: "16:44-18:10", dur: "1h26m", a: 0, p: 3, msgs: 61, tools: 18, desc: "Rewrote the quickstart — a fresh install is three commands now.", tag: "analyzed" },
    { d: "08/22", t: "18:20-19:35", dur: "1h15m", a: 4, p: 7, msgs: 44, tools: 19, desc: "Tidied the deploy scripts and pinned the runner image.", tag: "analyzed" },
    { d: "08/22", t: "09:05-09:52", dur: "47m", a: 3, p: 4, msgs: 38, tools: 12, desc: "Taught the ingredient parser metric and imperial unit conversions.", tag: "" },
    { d: "08/21", t: "20:12-21:04", dur: "52m", a: 0, p: 6, msgs: 47, tools: 15, desc: "Prototyped the level editor's undo stack.", tag: "" },
  ];
  let html = "", lastDay = null;
  rows.forEach((r, idx) => {
    if (r.d !== lastDay) {
      if (lastDay) html += "</div>";
      html += '<div class="evt-day-header">' + r.d + '<span class="evt-day-count">' + rows.filter(x => x.d === r.d).length + ' sessions</span></div><div class="evt-day-grid">';
      lastDay = r.d;
    }
    const tag = r.tag === "analyzed" ? '<span class="evt-tag">Analyzed</span>'
      : r.tag === "analyzing" ? '<span class="evt-tag evt-tag-running">Analyzing…</span>' : "";
    html += '<div class="evt-card' + (r.sel ? " selected analyzed" : "") + '" data-mock-idx="' + idx + '">'
      + '<div class="evt-check"><input type="checkbox" ' + (r.sel ? "checked" : "") + ' aria-label="Select session"></div>'
      + '<div class="evt-col"><div class="evt-date">' + r.d + '</div><div class="evt-time">' + r.t + '</div><div class="evt-meta">' + r.msgs + ' msgs · ' + r.tools + ' tools</div></div>'
      + '<div class="evt-col"><div class="evt-dur">' + r.dur + '</div><div class="evt-dur-label">Active span</div></div>'
      + '<div class="evt-col"><div class="evt-agent"><span class="evt-agent-dot" style="background:var(--s' + (r.a + 1) + ')"></span>' + AGENTS[r.a] + '</div></div>'
      + '<div class="evt-main"><div class="evt-title"><span class="edot" style="background:var(--s' + (r.p + 1) + ')"></span><span class="evt-title-text">' + PROJECTS[r.p] + '</span>' + tag + '</div>'
      + '<div class="evt-desc">' + r.desc + '</div></div></div>';
  });
  document.getElementById("eventsGrid").innerHTML = html + "</div>";
  setText("evtCount", "7");
}

const AURORA_ANALYSIS =
    '<div class="analysis-summary-row"><div class="analysis-summary">Traced the dark-mode flash to a theme stamp that ran after first paint, moved it into the boot script, and added a regression check so it stays fixed.</div></div>'
  + '<div class="analysis-section"><div class="analysis-section-header"><span class="section-icon">⚑</span>Context &amp; Goal</div>'
  + '<ul class="analysis-insights"><li><strong>Situation</strong>: new users saw a light-theme flash before the dashboard settled into their saved scheme.</li>'
  + '<li><strong>Task</strong>: find where the scheme is decided and make it win before the first frame.</li></ul></div>'
  + '<div class="analysis-section"><div class="analysis-section-header"><span class="section-icon">➤</span>Approach</div>'
  + '<ul class="analysis-insights"><li>Bisected the boot order until the flash reproduced with a single toggle.</li>'
  + '<li>Moved the scheme stamp into a tiny pre-paint script on the root element.</li>'
  + '<li>Added a check that fails CI whenever the stamp runs late again.</li></ul></div>'
  + '<div class="analysis-section"><div class="analysis-section-header"><span class="section-icon">★</span>Outcomes</div>'
  + '<ul class="analysis-insights"><li><strong>Flash gone</strong>: first paint lands in the saved scheme on a cold start.</li>'
  + '<li><strong>Cheap</strong>: the stamp costs well under a millisecond.</li>'
  + '<li><strong>Guarded</strong>: the CI check has already caught one refactor.</li></ul></div>'
  + '<div class="analysis-section"><div class="analysis-section-header"><span class="section-icon">◗</span>Time Breakdown</div>'
  + '<div class="analysis-breakdown">'
  + '<div class="seg s1" style="width:25%">Reproduce &amp; bisect</div>'
  + '<div class="seg s2" style="width:35%">Patch the theme stamp</div>'
  + '<div class="seg s3" style="width:20%">Regression pass</div>'
  + '<div class="seg s4" style="width:20%">Write-up</div>'
  + '</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">'
  + [["Reproduce & bisect", 25, 1], ["Patch the theme stamp", 35, 2], ["Regression pass", 20, 3], ["Write-up", 20, 4]]
    .map(([n, p, s]) => '<span style="font-size:10px;color:var(--text-secondary);display:flex;align-items:center;gap:3px"><span style="width:6px;height:6px;border-radius:2px;background:var(--s' + s + ');display:inline-block"></span>' + n + ' ' + p + '%</span>').join("")
  + '</div></div>';

const BILLING_ANALYSIS =
    '<div class="analysis-summary-row"><div class="analysis-summary">Made the payment webhook safe to retry: idempotency keys on every event, exponential backoff, and a dead-letter queue for the stragglers.</div></div>'
  + '<div class="analysis-section"><div class="analysis-section-header"><span class="section-icon">⚑</span>Context &amp; Goal</div>'
  + '<ul class="analysis-insights"><li><strong>Situation</strong>: duplicate webhook deliveries occasionally double-charged an invoice.</li>'
  + '<li><strong>Task</strong>: make redelivery harmless without slowing the happy path.</li></ul></div>'
  + '<div class="analysis-section"><div class="analysis-section-header"><span class="section-icon">➤</span>Approach</div>'
  + '<ul class="analysis-insights"><li>Keyed every event by provider id and stored the first outcome.</li>'
  + '<li>Replays now short-circuit to the stored outcome instead of re-processing.</li>'
  + '<li>Added backoff and a dead-letter queue for events that keep failing.</li></ul></div>'
  + '<div class="analysis-section"><div class="analysis-section-header"><span class="section-icon">★</span>Outcomes</div>'
  + '<ul class="analysis-insights"><li><strong>No more double charges</strong>: replays are answered from the ledger.</li>'
  + '<li><strong>Observable</strong>: stragglers land in one queue with the full event attached.</li></ul></div>';

function buildAnalysis() {
  document.getElementById("analysisPlaceholder").style.display = "none";
  const el = document.getElementById("analysisContent");
  el.style.display = "";
  el.innerHTML = AURORA_ANALYSIS;
}

function buildCharts() {
  const shares = [26, 18, 15, 12, 10, 8, 6, 5];
  const hours = ["10.1h", "7.0h", "5.8h", "4.6h", "3.9h", "3.1h", "2.3h", "1.9h"];
  let grad = [], cum = 0;
  shares.forEach((p, i) => {
    const end = cum + p, fe = end - 0.6;
    grad.push("var(--s" + (i + 1) + "-block) " + cum + "% " + fe + "%");
    grad.push("var(--bg-card) " + fe + "% " + end + "%");
    cum = end;
  });
  document.getElementById("distPie").style.background = "conic-gradient(" + grad.join(",") + ")";
  setText("distCenter", "38h40m");
  setText("distCenterLabel", "total");
  setText("distTotal", "8 projects");
  setText("distributionTitle", "Distribution");
  setText("trendTitle", "Trend");
  document.getElementById("distLegend").innerHTML = PROJECTS.map((p, i) =>
    '<div class="pie-legend-item"><div class="pld" style="background:var(--s' + (i + 1) + ')"></div><span class="pln">' + p + '</span><span class="plv">' + hours[i] + ' · ' + shares[i] + '%</span></div>').join("");
  const bars = [[210, "8/18"], [285, "8/19"], [190, "8/20"], [372, "8/21"], [258, "8/22"], [96, "8/23"], [109, "8/24"]];
  const max = Math.max(...bars.map(b => b[0]));
  document.getElementById("barChart").innerHTML = bars.map(([v, l]) =>
    '<div class="bar-col"><div class="bar-value">' + Math.floor(v / 60) + 'h' + (v % 60 ? (v % 60) + 'm' : '') + '</div><div class="bar" style="height:' + (v / max) * 100 + '%"></div><div class="bar-label">' + l + '</div></div>').join("");
}

buildTimeline(); buildSessions(); buildAnalysis(); buildCharts();

// A live tooltip over a wide aurora-web block, with a fictional path. Its
// numbers are read off the block it is anchored to, so they can never disagree.
(function () {
  let best = null, bw = 0;
  document.querySelectorAll(".time-block.s1").forEach(b => {
    const r = b.getBoundingClientRect();
    if (r.right > window.innerWidth * 0.72 || r.top > window.innerHeight * 1.1) return;
    if (r.width > bw) { bw = r.width; best = b; }
  });
  if (!best) return;
  best.classList.add("selected");
  const r = best.getBoundingClientRect();
  const mins = parseInt((best.textContent.match(/(\d+)m/) || [, "126"])[1], 10);
  const startH = 8 + (parseFloat(best.style.left) / 100) * 16;
  const fmt = h => String(Math.floor(h)).padStart(2, "0") + ":" + String(Math.round((h % 1) * 60)).padStart(2, "0");
  const dur = mins >= 60 ? Math.floor(mins / 60) + "h" + (mins % 60 ? (mins % 60) + "m" : "") : mins + "m";
  const tip = document.getElementById("tooltip");
  tip.innerHTML = '<div class="tip-title">aurora-web — Traced the dark-mode flash to a late theme stamp</div>'
    + '<div class="tip-detail">Claude Code · ' + fmt(startH) + '–' + fmt(startH + mins / 60) + ' · ' + dur + ' · 96 msgs</div>'
    + '<div class="tip-path">~/dev/aurora-web</div>';
  tip.style.display = "block";
  tip.style.left = Math.min(r.left + r.width * 0.45, window.innerWidth - 320) + "px";
  tip.style.top = (r.bottom + 10) + "px";
})();

// ── Scenes for the gif captures ──────────────────────────────────────────────
const tooltipEl = document.getElementById("tooltip");
const overlay = document.getElementById("settingsOverlay");
const dialog = overlay.querySelector(".settings-dialog");

function fillSettings() {
  document.getElementById("cliDiag").innerHTML = [
    ["Claude Code", "/usr/local/bin/claude", "v2.1.34", true],
    ["Codex", "/usr/local/bin/codex", "v0.31.0", true],
    ["tclaude", "not detected", "", false],
  ].map(([name, p, v, ok]) =>
    '<div class="cli-diag-row"><span class="cli-diag-dot" style="background:' + (ok ? "var(--ok)" : "var(--text-muted)") + '"></span>'
    + '<span class="cli-diag-name">' + name + '</span>'
    + '<span class="cli-diag-path">' + p + '</span>'
    + (v ? '<span class="cli-diag-version">' + v + '</span>' : "")
    + '</div>').join("");
  const sel = document.getElementById("settingsDefaultAnalysisProvider");
  sel.innerHTML = '<option>(use first available)</option><option selected>Claude Code (local)</option><option>Codex (local)</option><option>Ollama — llama3.1:8b</option>';
  document.getElementById("customProviderList").innerHTML =
    '<div class="provider-card"><span class="provider-card-dot enabled"></span>'
    + '<div class="provider-card-info"><div class="provider-card-name">Ollama — llama3.1:8b</div>'
    + '<div class="provider-card-meta">http://localhost:11434 · local · no key needed</div></div>'
    + '<div class="provider-card-actions"><button type="button">Edit</button><button type="button" class="btn-del">Delete</button></div></div>';
  const scheme = document.getElementById("settingsScheme"); if (scheme) scheme.value = "frost";
  const blocks = document.getElementById("settingsBlocks"); if (blocks) blocks.value = "tint";
}

function sessionsTop() {
  return document.querySelector(".events-card").getBoundingClientRect().top + window.scrollY - 12;
}

// The provider pill + its menu, as shown in the analysis panel.
function providerPill(open, chosen) {
  let el = document.getElementById("mockPill");
  if (!el) {
    el = document.createElement("div");
    el.id = "mockPill";
    el.style.cssText = "position:absolute;top:10px;right:12px;z-index:20";
    document.getElementById("analysisPanel").style.position = "relative";
    document.getElementById("analysisPanel").appendChild(el);
  }
  const items = [
    ["Claude Code (local)", "detected · v2.1.34"],
    ["Codex (local)", "detected · v0.31.0"],
    ["Ollama — llama3.1:8b", "http://localhost:11434"],
    ["GPT-4o mini (API)", "custom provider"],
  ];
  const menu = !open ? "" :
    '<div style="position:absolute;right:0;top:26px;width:238px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;box-shadow:var(--shadow-md);padding:4px;display:flex;flex-direction:column;gap:1px">'
    + items.map(([t, d], i) =>
      '<div style="padding:6px 9px;border-radius:5px;' + (i === (chosen ?? 0) ? "background:var(--accent);color:var(--on-accent)" : "") + '">'
      + '<div style="font-size:11px;font-weight:600">' + t + '</div>'
      + '<div style="font-size:9.5px;opacity:.72">' + d + '</div></div>').join("")
    + '</div>';
  el.innerHTML = '<span class="analysis-provider-pill">' + items[chosen ?? 0][0] + ' ▾</span>' + menu;
}

const SCENES = {
  settings(i) {
    tooltipEl.style.display = "none";
    window.scrollTo(0, 0);
    fillSettings();
    overlay.style.display = i === 1 || i === 2 ? "flex" : "none";
    if (i === 1) dialog.scrollTop = 0;
    if (i === 2) dialog.scrollTop = dialog.scrollHeight;
  },
  provider(i) {
    tooltipEl.style.display = "none";
    window.scrollTo(0, sessionsTop());
    providerPill(i === 1 || i === 2, i >= 2 ? 2 : 0);
  },
  analysis(i) {
    tooltipEl.style.display = "none";
    window.scrollTo(0, sessionsTop());
    const cards = document.querySelectorAll(".evt-card");
    const target = cards[1]; // billing-svc
    cards[0].classList.toggle("selected", i === 0);
    target.classList.toggle("selected", i >= 1);
    const loading = document.getElementById("analysisLoading");
    const content = document.getElementById("analysisContent");
    document.getElementById("analysisPlaceholder").style.display = "none";
    if (i === 1) {
      content.style.display = "none";
      loading.style.display = "";
      document.getElementById("analysisLoadingText").textContent = "Analyzing with Claude Code (local)…";
    } else {
      loading.style.display = "none";
      content.style.display = "";
      content.innerHTML = i >= 2 ? BILLING_ANALYSIS : AURORA_ANALYSIS;
    }
  },
};

window.__scene = (name, i) => { SCENES[name](i); return name + ":" + i; };
</script>`;

fs.writeFileSync(path.join(TMP, "dashboard.html"), `${head}\n</head>\n<body>\n${body}\n${dashboardMock}\n</body>\n</html>\n`);

// ── The desk-pet + context-menu page ─────────────────────────────────────────
const petSvg = fs.readFileSync(path.join(ROOT, "assets", "svg", "clawd-working-typing.svg"), "utf8");
const menuItems = [
  { label: "Mini Mode" },
  { label: "Sleep (Do Not Disturb)" },
  { sep: true },
  { label: "\u{1F43E} Session Analysis Dashboard", id: "hl" },
  { label: "Session Dashboard" },
  { label: "New Claude Session", sub: true },
  { label: "Auto-approve all requests" },
];
const menuHtml = menuItems.map(m => m.sep
  ? '<div class="mi-sep"></div>'
  : `<div class="mi"${m.id ? ` id="${m.id}"` : ""}>${m.label}${m.sub ? '<span class="mi-sub">›</span>' : ""}</div>`).join("");

const menuPage = `<title>readme-shot menu</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1149px; height: 625px; background: #FFFFFF; overflow: hidden;
         font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; position: relative; }
  /* the desk pet floats above every window, in the shot as in life */
  .pet { position: absolute; left: 36%; top: 24%; width: 150px; z-index: 30; }
  .pet svg { width: 100%; height: auto; display: block; }
  .menu { position: absolute; left: calc(36% + 165px); top: calc(24% + 92px); width: 268px;
          background: rgba(248, 248, 248, 0.98); border: 1px solid rgba(0,0,0,.10); border-radius: 8px;
          box-shadow: 0 10px 34px rgba(0,0,0,.22), 0 1px 3px rgba(0,0,0,.12); padding: 5px; display: none; }
  .mi { font-size: 13.5px; color: #1d1d1f; padding: 4px 11px; border-radius: 5px;
        display: flex; align-items: center; justify-content: space-between; }
  .mi-sub { color: #86868b; font-size: 13px; }
  .mi-sep { height: 1px; background: rgba(0,0,0,.10); margin: 5px 11px; }
  body.hl #hl { background: #0A62E1; color: #fff; }
  body.hl #hl .mi-sub { color: #fff; }
  .cursor { position: absolute; width: 17px; display: none; z-index: 40; }
  .win { position: absolute; left: 7%; top: 7%; width: 62%; border-radius: 10px; overflow: hidden;
         box-shadow: 0 24px 70px rgba(0,0,0,.30), 0 2px 8px rgba(0,0,0,.16); display: none; background: #fff; }
  .win-bar { height: 34px; background: #F5F5F7; border-bottom: 1px solid rgba(0,0,0,.08);
             display: flex; align-items: center; padding: 0 12px; position: relative; }
  .win-bar i { width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
  .win-title { position: absolute; left: 0; right: 0; text-align: center; font-size: 13px; font-weight: 600; color: #3c3c43; }
  .win img { width: 100%; display: block; }
  body[data-step="1"] .menu, body[data-step="2"] .menu { display: block; }
  body[data-step="2"] .cursor { display: block; }
  body[data-step="3"] .win { display: block; }
</style>
<div class="pet">${petSvg}</div>
<div class="menu">${menuHtml}</div>
<svg class="cursor" id="cursor" viewBox="0 0 20 30"><path d="M2 2 L2 24 L8 19 L12 28 L16 26 L12 17 L19 17 Z" fill="#000" stroke="#fff" stroke-width="1.6"/></svg>
<div class="win">
  <div class="win-bar"><i style="background:#FF5F57"></i><i style="background:#FEBC2E"></i><i style="background:#28C840"></i><span class="win-title">Clawd Insights</span></div>
  <img src="../../../assets/screenshot-timeline-1.png" alt="">
</div>
<script>
  window.__scene = (name, i) => {
    document.body.dataset.step = i;
    document.body.classList.toggle("hl", i === 2);
    if (i === 2) {
      const hl = document.getElementById("hl").getBoundingClientRect();
      const c = document.getElementById("cursor");
      c.style.left = (hl.left + hl.width * 0.55) + "px";
      c.style.top = (hl.top + 6) + "px";
    }
    return name + ":" + i;
  };
  window.__scene("menu", 0);
</script>`;
fs.writeFileSync(path.join(TMP, "menu.html"), menuPage);

// ── Manifest for capture.js / assemble.js ────────────────────────────────────
const manifest = {
  stills: {
    page: "dashboard.html",
    width: 1140,
    out: ["screenshot-timeline-1.png", "screenshot-ai-analysis.png"],
  },
  gifs: [
    { name: "screenshot-ai-provider-settings.gif", page: "dashboard.html", width: 1200, height: 656, scene: "settings", holds: [0.9, 1.6, 1.6, 0.9], scale: 1440 },
    { name: "screen-shot-select-AI-provider.gif", page: "dashboard.html", width: 1200, height: 656, scene: "provider", holds: [0.9, 1.4, 1.0, 1.5], scale: 1440 },
    { name: "screenshot-ai-analysis.gif", page: "dashboard.html", width: 1200, height: 656, scene: "analysis", holds: [0.9, 1.4, 2.6, 1.4], scale: 1440 },
    { name: "screenshot-dashboard-menu.gif", page: "menu.html", width: 1149, height: 625, scene: "menu", holds: [0.9, 1.1, 1.3, 2.2], scale: 2298 },
  ],
};
fs.writeFileSync(path.join(TMP, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("built", TMP);
