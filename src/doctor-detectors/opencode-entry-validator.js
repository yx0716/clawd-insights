"use strict";

const fs = require("fs");
const path = require("path");

function isAbsoluteAnyPlatform(entry) {
  const normalized = String(entry || "").replace(/\\/g, "/");
  return path.posix.isAbsolute(normalized) || path.win32.isAbsolute(normalized);
}

function validateOpencodeEntry(entry, options = {}) {
  const fsImpl = options.fs || fs;
  if (typeof entry !== "string" || !isAbsoluteAnyPlatform(entry)) {
    return { ok: false, reason: "not-absolute" };
  }

  let stat;
  try {
    stat = fsImpl.statSync(entry);
  } catch {
    return { ok: false, reason: "directory-missing" };
  }

  if (!stat || typeof stat.isDirectory !== "function" || !stat.isDirectory()) {
    return { ok: false, reason: "not-a-directory" };
  }
  if (!fsImpl.existsSync(path.join(entry, "index.mjs"))) {
    return { ok: false, reason: "index-mjs-missing" };
  }
  return { ok: true };
}

module.exports = { validateOpencodeEntry };
