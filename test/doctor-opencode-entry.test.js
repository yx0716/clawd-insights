const { describe, it } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const { validateOpencodeEntry } = require("../src/doctor-detectors/opencode-entry-validator");

function fakeFs({ dirs = [], files = [] } = {}) {
  const dirSet = new Set(dirs);
  const fileSet = new Set(files);
  return {
    statSync: (entry) => {
      if (!dirSet.has(entry) && !fileSet.has(entry)) {
        const err = new Error("missing");
        err.code = "ENOENT";
        throw err;
      }
      return { isDirectory: () => dirSet.has(entry) };
    },
    existsSync: (entry) => fileSet.has(entry) || dirSet.has(entry),
  };
}

describe("validateOpencodeEntry", () => {
  it("rejects relative entries", () => {
    assert.deepStrictEqual(
      validateOpencodeEntry("plugins/opencode-plugin"),
      { ok: false, reason: "not-absolute" }
    );
  });

  it("reports missing plugin directories", () => {
    assert.deepStrictEqual(
      validateOpencodeEntry("/opt/clawd/hooks/opencode-plugin", { fs: fakeFs() }),
      { ok: false, reason: "directory-missing" }
    );
  });

  it("reports entries that are not directories", () => {
    const entry = "/opt/clawd/hooks/opencode-plugin";
    assert.deepStrictEqual(
      validateOpencodeEntry(entry, { fs: fakeFs({ files: [entry] }) }),
      { ok: false, reason: "not-a-directory" }
    );
  });

  it("reports missing index.mjs", () => {
    const entry = "/opt/clawd/hooks/opencode-plugin";
    assert.deepStrictEqual(
      validateOpencodeEntry(entry, { fs: fakeFs({ dirs: [entry] }) }),
      { ok: false, reason: "index-mjs-missing" }
    );
  });

  it("accepts absolute plugin directories with index.mjs", () => {
    const entry = "/opt/clawd/hooks/opencode-plugin";
    assert.deepStrictEqual(
      validateOpencodeEntry(entry, {
        fs: fakeFs({
          dirs: [entry],
          files: [path.join(entry, "index.mjs")],
        }),
      }),
      { ok: true }
    );
  });

  it("accepts Windows absolute paths", () => {
    const entry = "C:\\clawd\\hooks\\opencode-plugin";
    assert.deepStrictEqual(
      validateOpencodeEntry(entry, {
        fs: fakeFs({
          dirs: [entry],
          files: [path.join(entry, "index.mjs")],
        }),
      }),
      { ok: true }
    );
  });
});
