"use strict";

const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");

const {
  sanitizeSvg,
  collectSafeRasterRefs,
} = require("../src/theme-sanitizer");

test("sanitizeSvg strips unsafe script, href, and CSS URL surfaces", () => {
  const svg = [
    "<svg xmlns=\"http://www.w3.org/2000/svg\">",
    "  <script>alert(1)</script>",
    "  <g onclick=\"steal()\" style=\"fill:url(https://bad.example/a.png);stroke:url(#allowed);filter:url(pattern.svg#filter)\">",
    "    <a href=\"javascript:alert(1)\"><rect width=\"1\" height=\"1\"/></a>",
    "    <use href=\"pattern.svg#shape\"/>",
    "    <rect fill=\"url(//bad.example/filter)\" stroke=\"url(pattern.svg#stroke)\"/>",
    "  </g>",
    "  <style>@import url(\"https://bad.example/style.css\"); .ok{background:url(nested/sheet.png)} .bad{background:url(../../secret.png)}</style>",
    "</svg>",
  ].join("");

  const sanitized = sanitizeSvg(svg);

  assert.ok(!sanitized.includes("<script"));
  assert.ok(!sanitized.includes("onclick"));
  assert.ok(!sanitized.includes("javascript:"));
  assert.ok(!sanitized.includes("https://bad.example"));
  assert.ok(!sanitized.includes("//bad.example"));
  assert.ok(!sanitized.includes("../../secret.png"));
  assert.ok(sanitized.includes("stroke:url(#allowed)"));
  assert.ok(sanitized.includes("filter:url(pattern.svg#filter)"));
  assert.ok(sanitized.includes("href=\"pattern.svg#shape\""));
  assert.ok(sanitized.includes("background:url(nested/sheet.png)"));
});

test("collectSafeRasterRefs collects only safe relative png and webp dependencies", () => {
  const sourceAssetsDir = path.join(__dirname, "fixtures", "theme-assets");
  const svg = [
    "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">",
    "  <image href=\"spritesheet.webp?cache=1#frame\"/>",
    "  <image xlink:href=\"nested/sheet.png\"/>",
    "  <rect style=\"fill:url('icons/cursor.webp')\"/>",
    "  <style>",
    "    .ok{background:url(\"nested/other.png#v\")}",
    "    .remote{background:url(https://bad.example/remote.png)}",
    "    .encoded{background:url(%2e%2e/outside.png)}",
    "    .svg{background:url(pattern.svg)}",
    "  </style>",
    "  <image href=\"data:image/png;base64,AAAA\"/>",
    "</svg>",
  ].join("");

  const refs = collectSafeRasterRefs(svg, sourceAssetsDir);

  assert.deepStrictEqual([...refs.keys()].sort(), [
    "icons/cursor.webp",
    "nested/other.png",
    "nested/sheet.png",
    "spritesheet.webp",
  ]);
  assert.strictEqual(refs.get("spritesheet.webp").sourceAbs, path.resolve(sourceAssetsDir, "spritesheet.webp"));
  assert.strictEqual(refs.get("nested/other.png").sourceRel, "nested/other.png");
  assert.ok(!refs.has("../outside.png"));
  assert.ok(!refs.has("pattern.svg"));
});
