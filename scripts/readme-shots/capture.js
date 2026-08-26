// Offscreen captures for the README media. Run under the repo's electron:
//   electron scripts/readme-shots/capture.js
// Reads .tmp/manifest.json (written by build.js). Stills go straight to
// assets/; gif frames land in .tmp/frames/<gif>/ for assemble.js.
//
// Offscreen rendering paints at the display's scale factor (2x on retina), so
// windows are sized in CSS px and every capture comes back at 2x.
const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const TMP = path.join(__dirname, ".tmp");
const ASSETS = path.join(ROOT, "assets");
const manifest = JSON.parse(fs.readFileSync(path.join(TMP, "manifest.json"), "utf8"));

app.disableHardwareAcceleration();

// One window for the whole run, reloaded and resized between captures —
// creating a second offscreen BrowserWindow in the same process has crashed
// the renderer (SIGTRAP) on the pinned Electron, so we never make two.
let win = null;
async function page(file, width, height) {
  if (!win) win = new BrowserWindow({ show: false, width, height, webPreferences: { offscreen: true } });
  else win.setSize(width, height);
  await win.loadFile(path.join(TMP, file));
  await new Promise(r => setTimeout(r, 400));
  return win;
}

async function shoot(win, rect) {
  const img = await win.webContents.capturePage(rect);
  return img.toPNG();
}

async function captureStills() {
  await page(manifest.stills.page, manifest.stills.width, 900);
  const m = await win.webContents.executeJavaScript(`(() => {
    const px = el => { const r = el.getBoundingClientRect(); return { top: r.top + scrollY, bottom: r.bottom + scrollY }; };
    return {
      header: px(document.querySelector(".header-block")),
      timeline: px(document.querySelector(".timeline-card")),
      sessions: px(document.querySelector(".events-card")),
      analysis: px(document.querySelector(".analysis-panel")),
      total: document.body.scrollHeight, width: document.body.clientWidth,
    };
  })()`);
  win.setSize(manifest.stills.width, Math.ceil(m.total + 40));
  await new Promise(r => setTimeout(r, 500));
  const PAD = 14;
  const shots = {
    "screenshot-timeline-1.png": {
      x: 0, y: Math.max(0, m.header.top - PAD),
      width: m.width, height: Math.round((m.timeline.bottom + PAD) - Math.max(0, m.header.top - PAD)),
    },
    "screenshot-ai-analysis.png": {
      x: 0, y: Math.round(m.sessions.top - PAD),
      width: m.width, height: Math.round((Math.max(m.sessions.bottom, m.analysis.bottom) + PAD) - (m.sessions.top - PAD)),
    },
  };
  for (const [name, r] of Object.entries(shots)) {
    fs.writeFileSync(path.join(ASSETS, name), await shoot(win, r));
    console.log("still", name);
  }
}

async function captureGif(g) {
  await page(g.page, g.width, g.height);
  const dir = path.join(TMP, "frames", g.name.replace(/\.gif$/, ""));
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < g.holds.length; i++) {
    await win.webContents.executeJavaScript(`window.__scene(${JSON.stringify(g.scene)}, ${i})`);
    await new Promise(r => setTimeout(r, 300));
    // an explicit rect, not the no-arg form — the no-arg capture has crashed
    // the offscreen renderer on complex pages (rust_png SIGTRAP)
    fs.writeFileSync(path.join(dir, `f${i}.png`), await shoot(win, { x: 0, y: 0, width: g.width, height: g.height }));
  }
  console.log("frames", g.name, g.holds.length);
}

app.whenReady().then(async () => {
  try {
    await captureStills();
    for (const g of manifest.gifs) await captureGif(g);
    if (win) win.destroy();
    app.exit(0);
  } catch (e) {
    console.error("capture failed:", e);
    app.exit(1);
  }
});
