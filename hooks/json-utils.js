// Shared utilities for hook installers (claude / cursor / gemini /
// codebuddy / opencode). Keeps config-file mutation behavior identical
// across agents so a fix in one place fixes all of them.

const fs = require("fs");
const path = require("path");

/**
 * Atomically write a JS object as pretty JSON. Writes to a sibling tmp file
 * then renames into place so concurrent readers never see a half-written
 * config. Creates the parent directory if missing. Cleans up the tmp file
 * on failure before re-throwing.
 */
function writeJsonAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmpPath = path.join(dir, `.${base}.${process.pid}.${Date.now()}.tmp`);
  fs.mkdirSync(dir, { recursive: true });
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch {}
    throw err;
  }
}

/**
 * Rewrite a path so it points at the asar.unpacked mirror instead of asar.
 * In packaged builds, __dirname resolves to the virtual app.asar/ tree, but
 * external processes (Claude/Cursor/Gemini/opencode) cannot read inside asar
 * and must use the physical copy under app.asar.unpacked/ (see package.json
 * "asarUnpack"). No-op for dev/source installs.
 */
function asarUnpackedPath(p) {
  return p.replace("app.asar/", "app.asar.unpacked/");
}

module.exports = { writeJsonAtomic, asarUnpackedPath };
