#!/usr/bin/env node
// Assemble the captured frames into the README gifs. Needs ffmpeg on PATH
// (macOS: brew install ffmpeg).
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const TMP = path.join(__dirname, ".tmp");
const ASSETS = path.join(ROOT, "assets");
const manifest = JSON.parse(fs.readFileSync(path.join(TMP, "manifest.json"), "utf8"));

try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
} catch {
  console.error("ffmpeg not found on PATH — install it (macOS: brew install ffmpeg) and re-run.");
  process.exit(1);
}

for (const g of manifest.gifs) {
  const dir = path.join(TMP, "frames", g.name.replace(/\.gif$/, ""));
  // concat demuxer: per-frame durations; the spec wants the last file repeated.
  const lines = g.holds.map((hold, i) => `file 'f${i}.png'\nduration ${hold}`);
  lines.push(`file 'f${g.holds.length - 1}.png'`);
  fs.writeFileSync(path.join(dir, "list.txt"), lines.join("\n") + "\n");
  const out = path.join(ASSETS, g.name);
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"),
    "-vf", `scale=${g.scale}:-2:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle`,
    "-vsync", "vfr", "-loop", "0", out,
  ]);
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log("gif", g.name, kb + "K");
}
