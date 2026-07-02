#!/usr/bin/env node

// Cross-platform launcher that ensures Electron runs in GUI mode.
//
// Claude Code (and other Electron-based tools) set ELECTRON_RUN_AS_NODE=1,
// which forces Electron to behave as a plain Node.js process — the browser
// layer never initializes, so `require("electron").app` is undefined.
//
// This launcher strips that variable before spawning the real Electron binary.

const { spawn } = require("child_process");
const fs = require("fs");

// When run under plain Node, require("electron") resolves to the path of the
// Electron binary. Both failure modes below mean dependencies are not (fully)
// installed, which is the most common first-run mistake after cloning.
let electron;
try {
  electron = require("electron");
} catch (err) {
  if (err && err.code === "MODULE_NOT_FOUND") {
    console.error(
      "Dependencies are not installed. Run `npm install` first, then retry `npm start`."
    );
    process.exit(1);
  }
  throw err;
}
if (typeof electron !== "string" || !fs.existsSync(electron)) {
  console.error(
    "The Electron binary is missing — the previous `npm install` may have been " +
      "interrupted. Run `npm install` again, then retry `npm start`."
  );
  process.exit(1);
}

const { buildElectronLaunchConfig } = require("./hooks/shared-process");

const forwardedArgs = process.argv.slice(2);
const launchConfig = buildElectronLaunchConfig(__dirname, { forwardedArgs });
const child = spawn(electron, launchConfig.args, {
  stdio: "inherit",
  env: launchConfig.env,
  cwd: launchConfig.cwd,
});

child.on("close", (code) => process.exit(code ?? 0));
