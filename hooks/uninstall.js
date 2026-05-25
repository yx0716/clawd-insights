#!/usr/bin/env node

const { unregisterHooks } = require("./install.js");

try {
  const { removed, changed } = unregisterHooks();
  console.log("Clawd Claude hooks uninstall complete");
  console.log(`  Removed: ${removed}`);
  console.log(`  Changed: ${changed}`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
