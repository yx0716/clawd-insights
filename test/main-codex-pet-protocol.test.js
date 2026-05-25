const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const MAIN = path.join(ROOT, "src", "main.js");
const CODEX_PET_MAIN = path.join(ROOT, "src", "codex-pet-main.js");
const PACKAGE_JSON = path.join(ROOT, "package.json");
const LAUNCH = path.join(ROOT, "launch.js");
const SHARED_PROCESS = path.join(ROOT, "hooks", "shared-process.js");

test("main wires clawd:// protocol dispatch through the Codex Pet importer", () => {
  const source = fs.readFileSync(MAIN, "utf8");
  const runtimeSource = fs.readFileSync(CODEX_PET_MAIN, "utf8");

  assert.ok(source.includes('const createCodexPetMain = require("./codex-pet-main");'));
  assert.ok(source.includes('app.on("open-url"'));
  assert.ok(source.includes('app.on("second-instance"'));
  assert.ok(source.includes("codexPetMain.enqueueImportUrl(url);"));
  assert.ok(source.includes("codexPetMain.enqueueImportUrlsFromArgv(commandLine);"));
  assert.ok(source.includes("codexPetMain.enqueueImportUrlsFromArgv(process.argv);"));
  assert.ok(runtimeSource.includes('const defaultCodexPetImporter = require("./codex-pet-importer");'));
  assert.ok(runtimeSource.includes("codexPetImporter.parseClawdImportUrl(rawUrl)"));
  assert.ok(runtimeSource.includes("codexPetImporter.importCodexPetFromUrl(parsed.url, {"));
  assert.ok(runtimeSource.includes("confirmReplaceExistingPackage: confirmReplaceExistingPackage"));
  assert.ok(runtimeSource.includes("codexPetImporter.ERR_REPLACE_DECLINED"));
  assert.ok(runtimeSource.includes("async function confirmReplaceExistingPackage"));
  assert.ok(runtimeSource.includes('setThemeSelection", { themeId: generated.themeId }'));
});

test("package metadata registers the clawd protocol and exposes dev registration", () => {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
  const launchSource = fs.readFileSync(LAUNCH, "utf8");
  const sharedProcessSource = fs.readFileSync(SHARED_PROCESS, "utf8");
  const protocols = (((pkg || {}).build || {}).protocols || []);

  assert.ok(pkg.scripts["register-protocol:dev"].includes("--register-protocol"));
  assert.ok(protocols.some((entry) => Array.isArray(entry.schemes) && entry.schemes.includes("clawd")));
  assert.ok(launchSource.includes("process.argv.slice(2)"));
  assert.ok(launchSource.includes("buildElectronLaunchConfig(__dirname, { forwardedArgs })"));
  assert.ok(sharedProcessSource.includes("...forwardedArgs"));
});
