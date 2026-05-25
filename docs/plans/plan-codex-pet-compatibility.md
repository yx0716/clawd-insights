# Plan: Codex Pet Compatibility And One-Click Import

## Context

`D:\tmp\codex-pet-lab` has validated that Codex Pet style assets are practical for Clawd:

- a pet package can be as small as `pet.json` plus `spritesheet.webp`
- the atlas is fixed at `1536x1872`, arranged as `8 columns x 9 rows`
- each frame is `192x208`
- rows already map cleanly to Clawd's major states

The current upstream ecosystem has three separate surfaces that should not be conflated:

- **Hatch Pet skill**: creates and validates Codex-compatible pet assets.
- **Petdex CLI/site**: installs and distributes community pets. The install command is `npx petdex install <slug>`.
- **codex-pets-react**: renders the atlas in React and publishes a useful `codexPetAtlas` timing contract.

The product opportunity is not "another theme authoring format." It is simpler:

**A user sees a pet on a website, clicks one button, and the pet appears in Clawd.**

The implementation should keep Clawd's existing state machine, permissions, HUD, session dashboard, DND, and multi-agent integration. Codex Pet packages should become another asset source that Clawd can consume.

This plan is intentionally scoped to compatibility and import flow. It does not propose running OpenPet or any other external desktop pet runtime beside Clawd.

## Upstream References

Use these as the factual basis when changing this plan or implementing the adapter:

- OpenAI Hatch Pet skill: `https://github.com/openai/skills/blob/main/skills/.curated/hatch-pet/SKILL.md`
- Official row reference: `https://raw.githubusercontent.com/openai/skills/main/skills/.curated/hatch-pet/references/animation-rows.md`
- Petdex docs and CLI: `https://petdex.crafter.run/docs`
- React atlas contract: `https://github.com/backnotprop/codex-pets-react/blob/main/src/lib/atlas.ts`

Clawd's `codex-pet-adapter` must carry its own local copy of the fixed atlas manifest. Do not infer frame counts or durations from `pet.json`; the minimal manifest does not include timing data today.

When adding that constant to code, pin the upstream source in a nearby comment:

```js
// Mirrored from codex-pets-react/src/lib/atlas.ts at <upstream commit> on <date>.
// Upstream timing changes require manual review before this table is bumped.
```

## Review Decisions Before Implementation

Do not start the adapter implementation until Spike 0 has been run and recorded in this file. The generated-wrapper MVP is intentionally gated by that spike.

Current Clawd facts that affect this plan:

- User-installed themes are non-builtin themes, and non-builtin SVG assets currently go through `theme-loader` sanitization plus `theme-cache`. Generated Codex Pet wrapper themes under `<userData>/themes/` therefore do hit the cache path.
- Startup currently loads the selected theme immediately after `themeLoader.init()`. Codex Pet theme sync must run before the initial selected-theme load, or the startup fallback/self-heal path can replace a missing generated theme with built-in `clawd` and persist that fallback.
- The adapter must return the final generated theme ID from materialization. Callers must not assume it is always `codex-pet-<pet-id>` because slug collisions and Unicode IDs require suffixing.
- `theme.json.source` is display/provenance metadata only. `.clawd-codex-pet.json` is the authoritative managed-theme marker and update/GC source of truth.

## Product Goal

Make Codex Pet packages feel native in Clawd while keeping the user mental model simple:

- Website language: "Open in Clawd" / "Take it for a walk"
- Clawd language: "Pets" or "Imported Pets"
- Technical language hidden from normal users: `theme.json`, atlas rows, spritesheet wrappers, state mappings

The user should not need to understand Clawd themes. A Codex Pet should feel like a character choice.

## Non-Goals

- Do not replace Clawd's current theme system.
- Do not run a second pet runtime or proxy state into OpenPet.
- Do not require pet authors to write Clawd `theme.json`.
- Do not require users to run conversion tools by hand.
- Do not copy source code from OpenPet. Use compatible ideas and format contracts only.
- Do not promise full feature parity with built-in themes in the first version. Eye tracking, mini mode, and sleep-specific art can come later.
- Do not couple this work to the Codex CLI log monitor. `codex-pet-adapter` is an asset/package adapter only; it must not share runtime state code with `agents/codex-log-monitor.js`.

## User Flows

### Flow 1: Already Installed Through Petdex CLI

1. User runs:

   ```powershell
   npx petdex install yoimiya
   ```

2. The package exists at:

   ```text
   ~/.codex/pets/yoimiya/
     pet.json
     spritesheet.webp
   ```

3. Clawd scans `~/.codex/pets`.
4. Clawd shows Yoimiya under Settings -> Theme/Pets as an imported Codex Pet.
5. User selects it.
6. Clawd plays its atlas rows according to Clawd state.

This is the lowest-risk MVP because Petdex and compatible installers already establish the package in the expected directory. Clawd still applies its own stricter validation: Petdex currently accepts spritesheets smaller than the fixed Codex app atlas as long as they are valid submissions, while Clawd MVP only supports exact `1536x1872` 8x9 atlases.

### Flow 2: Website One-Click Import

1. User clicks `Open in Clawd` on the pet website.
2. Browser opens:

   ```text
   clawd://import-pet?url=https%3A%2F%2Fexample.test%2Fpets%2Fyoimiya%2Fyoimiya.zip
   ```

3. OS asks whether to open Clawd.
4. Clawd opens a pre-download import confirmation with the source host and package URL.
5. User clicks `Import and Use`.
6. Clawd downloads, validates, installs, materializes a Clawd-compatible wrapper theme, and switches to the pet.
7. Clawd shows the pet display name after validation succeeds. MVP enforces strict download/package size caps instead of adding a second preflight dialog for display name and package size; a richer preflight can be revisited during polish.

This should be the primary consumer-facing experience after MVP.

### Flow 3: Manual Download Fallback

1. User downloads a `.zip` package.
2. User imports it in Clawd from Settings.
3. Clawd validates and installs it.

This is a safety net for browsers, OS protocol restrictions, or users who do not want custom protocol handling.

### Flow 4: Agent-Assisted Install Prompt

Some pet sites may not launch Clawd directly. Instead, they can give the user a prompt to paste into Codex, Claude Code, or another local agent:

```text
Install this Codex pet for me.

Pet package URL: https://example.test/api/assets/pets/yoimiya-pet/yoimiya-pet.zip

Please fetch the package, inspect that it contains pet.json plus
spritesheet.webp or spritesheet.png either at the zip root or inside one
top-level folder, verify no zip path escapes the chosen package folder,
unzip it into ~/.codex/pets, and clean up temp files.
```

This flow is lower-level than `Open in Clawd`, but it is valuable because it converges on the same canonical directory:

```text
~/.codex/pets/<pet-id>/
  pet.json
  spritesheet.webp
```

Clawd should treat this as a supported fallback acquisition path. If the agent installs the package correctly, Clawd's local scan and refresh should discover it without any Clawd-specific import step.

## Recommended UX Copy

On the website:

- Primary button: `Open in Clawd`
- Secondary: `Install with Agent` or `Install with Petdex`
- Tertiary: `Download zip`

Recommended small print:

```text
Works with Codex Pet compatible runtimes. Open it in Clawd, or install it to ~/.codex/pets.
```

If a website exposes an agent prompt, the prompt should avoid Clawd-specific internals and should only promise installation into `~/.codex/pets`. Clawd can then say:

```text
After installing, open Clawd Settings -> Pets and click Refresh Imported Pets.
```

Inside Clawd:

- Section title: `Imported Pets`
- Card badge: `Codex Pet`
- Empty state: `Install a Codex Pet package or open one from a pet website.`
- Success bubble/toast: `{PetName} is now on your desk.`

Avoid exposing "theme wrapper" or "spritesheet atlas" in primary UI.

## Package Contract

### Current Minimum

```text
<pet-id>/
  pet.json
  spritesheet.webp
```

```json
{
  "id": "yoimiya",
  "displayName": "yoimiya宵宫",
  "description": "A tiny Codex Pet based on the Genshin Impact fireworks archer.",
  "spritesheetPath": "spritesheet.webp"
}
```

The Hatch Pet output path uses `spritesheet.webp`. Petdex validation also allows `spritesheet.png`, and some community sites distribute PNG atlases. Clawd should accept both `.webp` and `.png` when dimensions and transparency are valid. The generated wrappers should reference the actual `spritesheetPath` extension instead of assuming WebP.

### Atlas Contract

| Property | Value |
|---|---:|
| Atlas width | `1536` |
| Atlas height | `1872` |
| Columns | `8` |
| Rows | `9` |
| Frame width | `192` |
| Frame height | `208` |

### Atlas Timing Contract

`pet.json` currently does not contain row frame counts or frame durations. Clawd must ship this as a constant in `src/codex-pet-adapter.js`.

| Row | Animation | Used columns | Durations |
|---:|---|---:|---|
| 0 | `idle` | 0-5 | `280, 110, 110, 140, 140, 320` ms |
| 1 | `running-right` | 0-7 | `120` ms each, final `220` ms |
| 2 | `running-left` | 0-7 | `120` ms each, final `220` ms |
| 3 | `waving` | 0-3 | `140` ms each, final `280` ms |
| 4 | `jumping` | 0-4 | `140` ms each, final `280` ms |
| 5 | `failed` | 0-7 | `140` ms each, final `240` ms |
| 6 | `waiting` | 0-5 | `150` ms each, final `260` ms |
| 7 | `running` | 0-5 | `120` ms each, final `220` ms |
| 8 | `review` | 0-5 | `150` ms each, final `280` ms |

Unused cells after the final used column must be fully transparent. The wrapper generator must never use all 8 columns blindly for rows with fewer than 8 frames, or the pet will disappear when playback reaches transparent cells.

Future compatibility hook: if a later Codex Pet manifest adds authoritative timing metadata, the adapter may accept it only after validating that row names, frame counts, and cells remain inside the 8x9 atlas bounds. The built-in constant remains the fallback.

### Row Contract

| Row | Codex Pet animation | Clawd use |
|---:|---|---|
| 0 | `idle` | `idle`, static sleep fallback |
| 1 | `running-right` | optional future drag/autonomous motion |
| 2 | `running-left` | optional future drag/autonomous motion |
| 3 | `waving` | greeting gesture, optional click |
| 4 | `jumping` | `attention`, success, click reaction |
| 5 | `failed` | `error` |
| 6 | `waiting` | `notification`, patient wait |
| 7 | `running` | `working`, `juggling`, `sweeping`, `carrying` |
| 8 | `review` | `thinking`, review/checking |

### Validation Rules

MVP validation should reject packages that fail these checks:

- `pet.json` is valid UTF-8 JSON.
- `id` is a non-empty string. It may contain Unicode because existing local test packages do.
- Clawd derives a filesystem/theme-safe `slug` separately. Prefer the package folder name if it is already lowercase ASCII letters, digits, or hyphens; otherwise slugify `id` or `displayName`.
- generated Clawd theme IDs use the safe slug, e.g. `codex-pet-yoimiya`, and preserve the original manifest `id` as `source.id`.
- slug collision rule:
  - if `codex-pet-<slug>` is free, use it
  - if it is an existing managed Codex Pet theme for the same source package path, keep using it
  - if it is unmanaged or belongs to another package, append `-2`, `-3`, etc. until a safe managed theme ID is available
  - unmanaged user themes are never reclaimed or overwritten by sync, even when they occupy the nicest `codex-pet-<slug>` ID; the managed pet keeps the deterministic suffixed ID
  - process scanned packages in stable path-sorted order so suffix assignment is deterministic
  - Settings cards must show the original `displayName`, not only the slug, so suffixed imports remain understandable
- `displayName` is non-empty after trimming.
- `displayName` and `description` are trimmed, length-capped, and rendered as text only.
- `spritesheetPath` is relative and stays inside the package directory.
- `spritesheetPath` points to `.webp` or `.png`.
- `.webp` files have a valid RIFF/WebP header; `.png` files have a valid PNG header.
- decoded image dimensions are exactly `1536x1872`.
- zip import cannot write paths outside the destination directory.
- Petdex-installed packages that do not satisfy Clawd's exact atlas contract fail validation with a user-visible diagnostic instead of being treated as broken themes.

Dimension validation needs image metadata. If we do not want a new image dependency in MVP, use Electron/native image probing in main-process code where possible, and keep a fallback that marks the package invalid when dimensions cannot be verified.

## State Mapping

MVP mapping:

| Clawd logical state | Codex Pet row | Reason |
|---|---|---|
| `idle` | `idle` | calm default |
| `thinking` | `review` | closer to reading/checking |
| `working` | `running` | visible active loop |
| `juggling` | `running` | active fallback; no subagent-specific Codex row |
| `sweeping` | `running` | active fallback |
| `carrying` | `running` | active fallback |
| `notification` | `waiting` | patient wait for permission/user action |
| `attention` | `jumping` | success/celebration |
| `error` | `failed` | direct match |
| `sleeping` | static `idle` frame 0 | no Codex sleep row, but DND should look still |
| `waking` | `idle` | no Codex waking row |
| `dozing` | static `idle` frame 0 | no Codex doze row, but should not look active |
| `yawning` | `idle` | no Codex yawn row |
| `collapsing` | static `idle` frame 0 | no Codex collapse row |

Click reaction:

| Clawd reaction | Codex Pet row |
|---|---|
| single click | `jumping` |
| double/rapid click | `waving` or `jumping` |
| drag | no MVP animation, keep normal drag behavior |
| annoyed | no MVP animation; omit the optional reaction binding |

Generated themes need separate loop and one-shot SVG variants. Normal states loop. Click reactions must use one-shot wrappers with `animation-iteration-count: 1` and `animation-fill-mode: forwards`, otherwise the pet will keep jumping/waving until a later state change.

Codex Pet wrappers must not use the normal `<img>` channel. Chromium image contexts do not load external SVG sub-resources, so `<img src="wrapper.svg">` will not render `<image href="spritesheet.webp">` even when both files are in the same cache directory. Generated Codex Pet themes need a renderer config flag that forces SVG states and reactions through the `<object>` channel while keeping `eyeTracking.enabled: false`.

One-shot replay still needs QA. `<object>` normally creates a fresh SVG document per swap and should avoid the `<img>` shared-timeline bug, but Spike 0 must still replay `jumping-once` / `waving-once` repeatedly. If any remaining `<img>` path is used, keep a monotonic per-swap cache-bust counter; `Date.now()` alone can collide under very fast swaps.

Mini mode:

- MVP: mark Codex Pet generated themes as `miniMode.supported: false`.
- Current Clawd menu code already hides/disables mini mode when `theme.miniMode.supported === false`; keep an explicit regression test for this.
- Later: generate mini wrappers from `idle`, `waving`, and `jumping`, but only after normal mode is stable.

Known MVP visual limitations:

- Codex Pet generated themes do not show Clawd's multi-session working tier progression. `working`, `juggling`, `sweeping`, and `carrying` all use `running`.
- Codex Pet generated themes do not provide native sleep/yawn/wake art. DND uses static or idle fallback visuals.
- Eye tracking is disabled because Codex Pet frames do not expose Clawd SVG DOM IDs.

## Key Design Decision: Generated Wrapper Theme For MVP

There are two viable implementation strategies:

1. Native renderer spritesheet channel
2. Generate Clawd theme assets that wrap the spritesheet

The lowest-cost MVP is **generated wrapper theme**, but this is a gated decision, not an unproven assumption.

Why:

- Clawd already knows how to discover, load, select, preview, and persist themes.
- Clawd already routes states to filenames.
- Clawd already supports SVG animations through the `<object>` renderer path.
- We avoid converting WebP into GIF/APNG and avoid quality loss.
- We avoid a larger renderer/state binding refactor in the first version.

Before implementation work starts, run a Spike 0 proof:

1. Generate one external test theme with a wrapper SVG that references a local `spritesheet.webp`.
2. Load it through the current `theme-loader` sanitization/cache path.
3. Verify that inline SVG `@keyframes` runs after loading from the external theme cache.
4. Verify that the referenced spritesheet resolves from the cached SVG document when loaded through `<object>`.
5. Switch `idle -> working -> notification -> idle` repeatedly and measure whether the WebP is re-read heavily enough to cause visible jank.

Exit criteria:

- If wrapper SVG playback, relative raster resolution, and state switching are all smooth, continue with generated wrapper themes.
- If inline CSS or relative raster loading fails under the current `file://`/cache model, stop wrapper work and re-estimate Phase 5 native spritesheet playback before expanding the MVP.
- If wrapper playback works but WebP reload IO is too high, either copy the raster into cache once and rely on OS file cache, or promote native spritesheet channel.
- Do not accept an `<img>`-only pass. SVG-as-image loading cannot fetch the external spritesheet sub-resource, so the wrapper route depends on a forced object channel or another explicitly validated rendering path.

The adapter materializes a Codex Pet package into a normal Clawd user theme:

```text
<userData>/themes/codex-pet-yoimiya/
  theme.json
  assets/
    spritesheet.webp
    codex-pet-idle-loop.svg
    codex-pet-idle-static.svg
    codex-pet-review-loop.svg
    codex-pet-running-loop.svg
    codex-pet-waving-loop.svg
    codex-pet-waving-once.svg
    codex-pet-jumping-loop.svg
    codex-pet-jumping-once.svg
    codex-pet-failed-loop.svg
    codex-pet-waiting-loop.svg
```

Each generated SVG:

- uses `viewBox="0 0 192 208"`
- clips to one `192x208` frame
- references the actual local `spritesheetPath`
- animates the image position with CSS keyframes
- uses the built-in Codex Pet atlas timing constant
- emits separate loop/once/static wrappers where needed
- contains no scripts, event handlers, or external network references

Example shape:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 208">
  <defs>
    <clipPath id="frame"><rect x="0" y="0" width="192" height="208"/></clipPath>
  </defs>
  <style>
    @keyframes row-idle {
      /* percentages are generated from canonical row durations */
      0%, 25.45% { transform: translate(0px, 0px); }
      25.46%, 35.45% { transform: translate(-192px, 0px); }
      /* remaining frames omitted in this example */
    }
    .atlas {
      animation: row-idle 1100ms infinite linear;
      image-rendering: auto;
    }
  </style>
  <g clip-path="url(#frame)">
    <image class="atlas" href="spritesheet.webp" width="1536" height="1872"/>
  </g>
</svg>
```

This is still a Codex Pet internally. The theme wrapper is an implementation detail.

## Generated `theme.json`

The adapter should generate a conservative Clawd theme:

```json
{
  "schemaVersion": 1,
  "name": "yoimiya宵宫",
  "author": "Imported Codex Pet",
  "version": "1.0.0",
  "description": "A tiny Codex Pet based on the Genshin Impact fireworks archer.",
  "source": {
    "type": "codex-pet",
    "id": "yoimiya",
    "packagePath": "..."
  },
  "viewBox": { "x": 0, "y": 0, "width": 192, "height": 208 },
  "layout": {
    "contentBox": { "x": 0, "y": 0, "width": 192, "height": 208 },
    "centerX": 96,
    "baselineY": 208,
    "visibleHeightRatio": 0.58,
    "baselineBottomRatio": 0.05
  },
  "eyeTracking": {
    "enabled": false,
    "states": []
  },
  "rendering": {
    "svgChannel": "object"
  },
  "states": {
    "idle": ["codex-pet-idle-loop.svg"],
    "thinking": ["codex-pet-review-loop.svg"],
    "working": ["codex-pet-running-loop.svg"],
    "juggling": ["codex-pet-running-loop.svg"],
    "sweeping": ["codex-pet-running-loop.svg"],
    "carrying": ["codex-pet-running-loop.svg"],
    "notification": ["codex-pet-waiting-loop.svg"],
    "attention": ["codex-pet-jumping-loop.svg"],
    "error": ["codex-pet-failed-loop.svg"],
    "sleeping": ["codex-pet-idle-static.svg"]
  },
  "sleepSequence": {
    "mode": "direct"
  },
  "workingTiers": [
    { "minSessions": 1, "file": "codex-pet-running-loop.svg" }
  ],
  "jugglingTiers": [
    { "minSessions": 1, "file": "codex-pet-running-loop.svg" }
  ],
  "reactions": {
    "clickLeft": { "file": "codex-pet-jumping-once.svg", "duration": 840 },
    "clickRight": { "file": "codex-pet-jumping-once.svg", "duration": 840 },
    "double": { "files": ["codex-pet-waving-once.svg"], "duration": 700 }
  },
  "miniMode": {
    "supported": false
  }
}
```

Implementation notes:

- Existing `validateTheme` is lenient about unknown top-level fields, so `source` can live in `theme.json`, but it is display/provenance metadata only.
- Keep `.clawd-codex-pet.json` as the authoritative managed-theme marker/update manifest. If `theme.json.source` and the marker disagree, marker data wins for refresh, update, and GC decisions.
- States must use Clawd's real schema: arrays of filenames or `{ "files": [...], "fallbackTo": "..." }`. Do not generate state objects like `{ "file": "...", "duration": 1200, "loop": true }`; those fail current validation.
- `rendering.svgChannel: "object"` is a proposed new generated-theme field. `theme-loader` must pass it through to renderer config, and `renderer.js` must honor it for normal state swaps and click reactions without pretending eye tracking is enabled.

## Theme Cache Adjustment

Generated wrapper SVGs reference `spritesheet.webp` or `spritesheet.png` through a relative `href`.

Non-builtin theme SVGs, including normal user themes and generated Codex Pet wrapper themes, are sanitized into:

```text
<userData>/theme-cache/<theme-id>/assets/
```

Today non-SVG files are not copied into that cache. If the wrapper SVG is loaded from the cache through `<object>`, `href="spritesheet.webp"` must resolve beside it.

This is not a trivial cleanup. MVP needs a deliberate theme-loader change:

- when sanitizing a non-builtin SVG, collect safe relative asset references from `href`, `xlink:href`, and CSS `url(...)`
- allow only relative references that stay inside the theme `assets/` directory
- copy referenced raster assets into the matching cache directory
- include referenced raster mtime/size in cache metadata so a spritesheet update invalidates the cached copy
- copy each referenced raster once per theme cache, not once per wrapper SVG
- reject or strip external protocols, absolute paths, traversal, and data URLs as today

This benefits future external SVG themes too, because safe local image references become reliable.

Spike 0 must prove this cache path before the generated-wrapper route is accepted. If it fails, do not keep expanding this cache system just to save the wrapper approach; pause and re-estimate the native spritesheet renderer.

Raster reference decisions:

- Sanitize the SVG first, then collect relative raster references from the sanitized DOM/text that will actually be written to cache. Do not copy resources referenced only by stripped unsafe markup.
- Collect from surviving `href`, `xlink:href`, and CSS `url(...)` values.
- Ignore fragment-only references such as `#frame` and `url(#frame)`. They point at inline SVG definitions, not cacheable raster assets.
- Only copy references that decode to a relative path inside the source `assets/` directory and end in a supported local raster extension for this feature: `.webp` or `.png`.
- For generated Codex Pet themes, a missing referenced raster is a materialization/validation failure and the managed theme must not be activated.
- For normal external themes, strict validation should report missing referenced rasters. Lenient runtime load may log a diagnostic and leave the theme visually degraded, but it must not leave stale cache files that make an old spritesheet appear current.
- Decode URL escapes once, normalize POSIX path segments, reject traversal, and normalize path separators to `/` in metadata keys. Case sensitivity follows the host filesystem; do not lower-case keys on case-sensitive platforms.
- Preserve the reference spelling needed by the sanitized SVG at the cache destination, but dedupe source stat/copy work by resolved source path. On Windows, `Spritesheet.WEBP` and `spritesheet.webp` can refer to the same source file; the cache still needs every referenced destination spelling that the SVG may request.
- MVP cache freshness uses source mtime plus size, not content hashes. This accepts false invalidations and rare false negatives in exchange for avoiding hashing multi-megabyte spritesheets on startup.
- Copy raster files to a temporary path, verify size/stat, then replace the final cache file and only then write metadata. A crash during copy must leave the next startup able to detect and repair a partial cache file.
- Adapter version mismatch must force full re-materialization of managed themes before theme load. Theme-loader does not need to read `.clawd-codex-pet.json`; the adapter owns wrapper regeneration and cache invalidation is then driven by changed wrapper/raster mtimes.

Cache metadata migration:

- current `.cache-meta.json` is SVG-only and stores a flat `file -> { mtime, size }` map
- introduce a versioned metadata shape, e.g. `{ "version": 2, "svgs": {}, "rasters": {} }`
- treat missing `version` as legacy v1, trigger one full external-theme re-cache, and rewrite as v2
- dedupe raster entries by safe relative asset path, not by referring SVG, so many wrappers that reference one `spritesheet.webp` share one cache record
- keep `referencedBy` or equivalent diagnostics optional; freshness must depend on raster mtime/size plus source path

## Implementation Plan

### Phase 0: Wrapper Feasibility Spike

Goal: prove the generated-wrapper route under Clawd's real external theme path before building the adapter.

Status on 2026-05-05:

- Partial local spike has been run with `D:\tmp\codex-pet-lab\pets\pinky` and disposable user data under `D:\tmp\codex-pet-lab\preview\clawd-wrapper-spike\`.
- `theme-loader.loadTheme("codex-pet-spike-pinky", { strict: true })` succeeds after generating a schema-correct theme with `schemaVersion: 1`, `viewBox`, array states, `sleepSequence.mode: "direct"`, `eyeTracking.enabled: false`, and `miniMode.supported: false`.
- The generated user theme is treated as non-builtin, and its wrapper SVG is sanitized into `<userData>/theme-cache/codex-pet-spike-pinky/assets/`.
- Inline SVG CSS and `@keyframes` survive sanitization.
- Initial `theme-loader` behavior did not copy `spritesheet.webp` into the cache. Before any manual raster copy, the cached SVG had `href="spritesheet.webp"` but no adjacent cached spritesheet, so renderer-relative raster loading failed.
- Manually copying `spritesheet.webp` beside the cached SVG made the cache layout renderable in principle and confirmed the MVP needed real raster cache materialization, not just SVG sanitization.
- A hidden Electron check loaded the same cached wrapper SVG with adjacent `spritesheet.webp` through both channels. `<img>` reported `naturalWidth=192` but rendered a blank white region (`nonWhite=0`); `<object>` rendered the pet (`nonWhite=9247`). Therefore generated Codex Pet wrappers must force the object channel.
- Forced object-channel implementation spike has been completed. `theme-loader` now validates and passes through `rendering.svgChannel: "object"`, `renderer.js` honors it for state swaps and click/drag reactions without enabling eye tracking, and `hit-geometry.js` uses the same channel rule for positioning.
- Hidden Electron replay check using real `src/renderer.js` passed with manual raster copy in place: idle rendered as `<object>` with no `<img>` nodes, five repeated `codex-pet-jumping-once.svg` reactions each created a fresh object document, every capture was nonblank, and `eyeTargets` stayed `0`.
- Legacy/default channel regression has been covered: missing `rendering` normalizes to `{ "svgChannel": "auto" }`, invalid values fail validation, ordinary external SVG themes still use the legacy non-object path, and built-in Clawd keeps its mixed channel behavior.
- Hidden Electron built-in Clawd matrix passed for `idle`, `working`, `sleeping`, `attention`, and `error`: `idle` remained `<object>`, the other tested states remained `<img>`, and every capture was nonblank.
- Test status for the forced object-channel spike: targeted tests passed, and full `npm test` passed with 1502 tests, 0 failures, 2 skipped.
- Raster cache copy implementation has been completed for external themes. `theme-loader` now collects safe relative raster references from sanitized SVG output, ignores fragment-only references such as `#frame` / `url(#frame)`, copies `.webp` / `.png` dependencies into the theme cache once per safe relative path, and writes v2 cache metadata with separate `svgs` and `rasters` records.
- Hidden Electron raster-cache check passed after deleting the cached `spritesheet.webp`: `loadTheme()` copied the raster back, wrote v2 metadata, and the real renderer loaded the reaction wrapper through `<object>` with a nonblank capture. The disposable idle wrapper stayed blank because that hand-written spike wrapper plays transparent unused cells; the full adapter-shaped fixture still needs to prove row timing and unused-cell avoidance.
- Test status after raster cache copy: targeted tests passed, and full `npm test` passed with 1503 tests, 0 failures, 2 skipped.
- Full adapter-shaped Pinky fixture has been generated under `D:\tmp\codex-pet-lab\preview\adapter-fixture\` with all MVP atlas rows represented and 12 wrappers: loop wrappers for normal animated states, one static wrapper for sleeping, and one-shot wrappers reserved for reactions. The source atlas passed hatch-pet validation as `1536x1872` RGBA WebP with no warnings.
- Hidden Electron full-fixture check passed: deleting cached `spritesheet.webp` before load was repaired by `theme-loader`, all first swaps used `<object>` with zero `<img>` nodes and zero eye-tracking targets, every tested state capture was nonblank, and first object-document availability measured roughly `27-32ms` in this environment.
- One-shot reaction checks passed through the object channel: `waving-once` and `jumping-once` both stayed nonblank at their final `forwards` frame, and five repeated `jumping-once` triggers created fresh object documents with nonblank captures each time.
- The full fixture exposed an important adapter rule: do not bind normal Clawd states directly to one-shot wrappers. State bindings should use loop/static wrappers; one-shot wrappers belong to reactions, where the renderer deliberately swaps a fresh object document.
- Hit-geometry reverse mapping passed for the forced object channel in the fixture: the rendered center point maps back to SVG user-space `{ x: 96, y: 104, inside: true }`.
- A 100-swap smoke check did not show an immediate leak pattern, but it is not a long-session guarantee. In this run the renderer tab working set moved from about `148.6MB` to `157.8MB`; keep longer soak testing in manual QA.
- Local package scan found five valid packages with exact `1536x1872` WebP atlases and `192x208` frames: `demo-pet`, `klee`, `paimon`, `pinky`, and `yoimiya宵宫`. `*-run` folders in the lab do not contain `pet.json` and should not be treated as packages.
- Playwright browser render verification was inconclusive because direct `file://` SVG loading timed out in the tool. Treat the Electron channel result above as the actionable renderer finding. Do not count state-switch IO, DND/sleep visuals, or objectScale calibration as proven yet.

Tasks:

- create a disposable external theme containing one real Codex Pet spritesheet and the same fixture shape the adapter will generate: loop, once, and static wrappers for all MVP atlas rows
- keep spike files outside the repo, e.g. `D:\tmp\codex-pet-lab\preview\clawd-wrapper-spike-theme\`
- load it through `theme-loader.loadTheme()` as an external theme
- confirm the generated user-theme wrapper SVG is sanitized into `theme-cache`, not read directly from the source theme directory
- confirm the wrapper SVG survives sanitization
- confirm its relative raster reference works after cache materialization
- confirm renderer config forces generated Codex Pet SVGs and reactions through `<object>` while `eyeTracking.enabled` remains false
- confirm inline `@keyframes` runs when loaded through the renderer object channel
- confirm running rows with 8 frames, rows with fewer than 8 frames, one-shot `forwards` wrappers, and static frame-0 wrappers all render the intended cells and never play transparent unused cells
- trigger `codex-pet-jumping-once.svg` or `codex-pet-waving-once.svg` repeatedly after each reaction duration, at least 5 times, and verify every trigger restarts from frame 0 rather than staying on the final `forwards` frame
- confirm repeated state changes do not cause obvious IO jank; use Chromium DevTools Network for file requests, and add temporary renderer image-load counters if DevTools does not surface `file://` reloads clearly
- confirm `eyeTracking.enabled: false` yields `eyeTrackingStates: []` and renderer never attempts `attachEyeTracking`
- switch back from the Codex Pet spike theme to built-in `clawd` and confirm eye tracking attaches again
- confirm `miniMode.supported: false` removes or disables Mini Mode menu entry
- verify DND/sleep fallback with `sleepSequence.mode: "direct"` and confirm the pet does not look active while DND is enabled
- compare `image-rendering: auto` and `image-rendering: pixelated` against at least one real atlas frame and choose the default intentionally
- measure idle CPU after 5 seconds. Generated wrappers disable eye tracking but still use the object channel for raster sub-resource loading, so low-power pause behavior must be tested rather than inferred.

Rollback rule: if this spike fails on SVG CSS/raster loading or unacceptable IO, pause the Codex Pet compatibility project and re-estimate the Phase 5 native spritesheet channel before changing MVP scope. Do not assume the native path is a drop-in swap for the wrapper MVP.

### Phase 0.5: Visual Calibration Spike

Goal: calibrate geometry separately from wrapper technical feasibility.

Status on 2026-05-05:

- Phase 0.5 fixtures have been generated under `D:\tmp\codex-pet-lab\preview\phase-0.5\` for `pinky`, `klee`, `paimon`, and `yoimiya宵宫`.
- All four source atlases passed hatch-pet validation as `1536x1872` RGBA WebP with no warnings.
- Hidden Electron calibration passed for all four fixture themes. Each theme loaded through `theme-loader` strict mode, repaired a deliberately removed cached `spritesheet.webp`, wrote v2 cache metadata with 12 cached SVGs and one raster, rendered through `<object>` with zero `<img>` nodes and zero eye-tracking targets, and produced nonblank captures for `idle`, `working`, `sleeping`, `attention`, `notification`, `error`, and `jumping` reaction.
- First object-document availability measured about `24-52ms` across the four packages in this environment. Treat this as a local smoke measurement, not a cross-machine latency budget.
- Unicode path coverage passed for `D:\tmp\codex-pet-lab\pets\yoimiya宵宫`; the generated theme id slugged to `codex-pet-cal-yoimiya`, while source metadata preserved `petId: "yoimiya宵宫"` and the Unicode package path.
- Current generated fixture themes use `layout.contentBox` equal to the full `192x208` frame. Because Clawd's renderer and hit geometry prefer normalized layout when `layout.contentBox` exists, the `objectScale` magic numbers are not the active positioning mechanism for these generated themes. The effective idle asset rectangle for a `260x260` window was `{ x: 110, y: 200, w: 240, h: 260 }`, with center hit mapping `{ x: 96, y: 104, inside: true }`.
- Visual screenshot checks did not show clipping for the four packages. Pinky remains wider and shorter inside the frame; Klee/Paimon/Yoimiya fill the vertical frame more tightly. Yoimiya is narrower but still centered and not cropped. Screenshots are under `D:\tmp\codex-pet-lab\preview\phase-0.5\screenshots\`.
- Calibration decision for MVP: generated themes should rely on full-frame normalized layout instead of per-package `objectScale` by default. Keep `objectScale` out of the generated output unless Phase 1 finds a concrete renderer path that still needs it as fallback. This removes the need to justify `1.9 / 1.3 / -0.45 / -0.25` for generated Codex Pet themes.
- Sleep/DND remains visually static but not semantically asleep because it uses `codex-pet-idle-static.svg`. This is acceptable for the technical MVP but should be called out as a visual limitation unless native sleep art is generated later.

Tasks:

- render generated fixture themes for at least `pinky`, `klee`, `paimon`, and `yoimiya宵宫`
- verify full-frame `layout.contentBox` positioning and hit-geometry mapping against each package
- keep `objectScale` absent from generated output unless Phase 1 finds a concrete fallback renderer path that still needs it
- record any future fallback scale values with package-specific evidence instead of leaving `1.9 / 1.3 / -0.45 / -0.25` as magic numbers
- the deterministic Phase 1 fixture now lives at `test/fixtures/codex-pets/tiny-atlas-png/`. It uses a generated `1536x1872` PNG atlas with transparent unused cells and a minimal `pet.json`; CI must use this or generated temp copies rather than `D:\tmp`.

### Phase 1: Format And Adapter Skeleton

Add a new module:

```text
src/codex-pet-adapter.js
```

Responsibilities:

- resolve Codex Pet storage directory:
  - default: `~/.codex/pets`
  - optional future override from settings/env
- scan package folders
- read and validate `pet.json`
- validate `spritesheet.webp` or `spritesheet.png`
- normalize IDs and display names
- carry the fixed Codex Pet atlas timing manifest as a local constant
- generate wrapper SVG text
- materialize a managed Clawd theme folder

Suggested public functions:

```javascript
function getDefaultCodexPetsDir()
function scanCodexPetPackages(rootDir)
function validateCodexPetPackage(packageDir)
function materializeCodexPetTheme(packageInfo, userThemesDir)
function syncCodexPetThemes({ userDataDir, userThemesDir, codexPetsDir })
```

Managed generated themes should include a marker file:

```text
.clawd-codex-pet.json
```

Marker contents:

```json
{
  "managedBy": "clawd",
  "kind": "codex-pet-theme",
  "schemaVersion": 1,
  "adapterVersion": 1,
  "generatedThemeId": "codex-pet-yoimiya",
  "sourcePetId": "yoimiya",
  "sourcePackagePath": "C:\\Users\\...\\.codex\\pets\\yoimiya",
  "sourcePetJsonMtimeMs": 1770000000000,
  "sourcePetJsonSize": 512,
  "sourceSpritesheetPath": "spritesheet.webp",
  "sourceSpritesheetMtimeMs": 1770000000000,
  "sourceSpritesheetSize": 2404750
}
```

This lets Clawd update generated wrappers safely without touching user-authored themes.

Management boundary:

- `.clawd-codex-pet.json` is authoritative for refresh, update, and garbage collection decisions.
- `theme.json.source` is for Settings display, diagnostics, and human inspection only.
- If marker and `theme.json.source` disagree, trust the marker for management and log a diagnostic.
- If the marker is missing or invalid, treat the theme as an unmanaged user theme and do not delete or overwrite it.
- If the marker is valid, treat the theme directory as generated output. User edits to `theme.json`, wrapper SVGs, or generated assets can be overwritten on refresh, source package update, or adapter-version rematerialization.
- Settings should not present managed Codex Pet themes as normal editable user themes. A later phase may add `Duplicate as editable theme`, but MVP sync semantics should be explicit rather than trying to preserve hand edits inside managed output.

### Phase 2: Local Codex Pet Support

Startup:

1. `theme-loader.init()` sets user theme paths as today.
2. Clawd calls `syncCodexPetThemes()`.
3. The adapter scans `~/.codex/pets`.
4. Valid packages are materialized into managed user themes.
5. Existing `discoverThemes()` picks them up.

Implementation constraint: in the current app startup path, step 2 must happen before the first `themeLoader.loadTheme()` for the stored selected theme. If async startup sync is used instead, the theme fallback/self-heal logic must be changed so a temporarily missing managed Codex Pet theme does not silently rewrite the user's selected theme to `clawd`.

Settings:

- show generated themes under current Theme UI first
- badge them as `Codex Pet`
- avoid a full settings redesign in MVP
- do not expose the normal destructive "delete theme" affordance for managed Codex Pet wrappers without routing through managed-pet removal semantics

Manual refresh:

- add a small Settings action: `Refresh Imported Pets`
- later, watch `~/.codex/pets` and refresh automatically
- refresh returns a summary: imported/updated/unchanged/invalid/removed counts
- refresh may also return `activeOrphanThemeIds` as a control field so main can switch away from missing active managed themes before GC removes them
- invalid packages appear in Settings diagnostics and debug log, not only console output

Package removal / GC policy:

- If a source package disappears and the generated theme is inactive, remove the managed generated theme on refresh.
- If the source package disappears while the generated theme is active, switch to built-in `clawd`, persist that fallback explicitly, then remove the managed generated theme.
- If a generated theme has a valid marker but its source path is missing and deletion fails, mark it stale in diagnostics and do not retry destructively in a tight loop.

Acceptance:

- if `npx petdex install yoimiya` has installed a package, Clawd can use it without manual conversion
- deleting/replacing the package and refreshing updates the generated theme
- invalid packages are ignored with diagnostics, not fatal startup errors

### Phase 3: One-Click Import Protocol

Register a custom protocol:

```text
clawd://
```

Supported URLs:

```text
clawd://import-pet?url=https%3A%2F%2Fsite.test%2Fpets%2Fyoimiya%2Fyoimiya.zip
clawd://import-pet?url=https%3A%2F%2Fsite.test%2Fpets%2Fyoimiya%2Fpet.json
```

Electron handling:

- Windows/Linux:
  - use single-instance `second-instance` argv parsing
  - packaged app registers protocol with `app.setAsDefaultProtocolClient("clawd")`
  - Windows dev builds must pass explicit executable and argv. Under the current Electron dev launch, prefer `app.setAsDefaultProtocolClient("clawd", process.execPath, [path.resolve(process.argv[1] || ".")])` after verifying the actual `process.argv` printed by `npm start`.
- macOS:
  - handle `open-url`
  - buffer `open-url` payloads that arrive before `app.whenReady()`
  - packaged app needs protocol entry in app metadata
- dev mode:
  - add an explicit `npm run register-protocol:dev` or document that protocol QA must use packaged builds

Ownership boundary:

- Clawd owns the protocol handler, local confirmation UI, validation, install, and theme switch.
- Petdex or any other pet gallery owns adding its own `Open in Clawd` button. Treat that as an upstream PR / collaboration item, not something the Clawd codebase alone can ship.
- Phase 3 can be accepted locally with a demo HTML page or README link that emits `clawd://import-pet?...`; public gallery support is a separate integration milestone.

Packaging check:

- Add protocol metadata to electron-builder config where required by macOS and packaged builds.
- On Windows, verify whether the NSIS install mode registers the handler per-user or per-machine for Clawd's current installer settings, whether elevation changes that scope, and whether updates preserve the registration.
- Dev-mode registration must be tested separately because Electron needs explicit executable/path arguments when launched through `npm start`.

Security:

- only accept `https:` URLs by default
- normalize and log IDN hostnames with `domainToASCII`
- block localhost, loopback, private IP, link-local, multicast, unspecified hosts, IPv4-mapped IPv6 loopback/private ranges, and obvious internal host suffixes
- re-check every redirect target; deny redirects to blocked hosts
- use a guarded `https.request({ lookup })` path: the custom lookup resolves the hostname, validates every candidate IP against the block list, returns only a validated address to Node's connect path, and keeps the original hostname for SNI/Host header
- re-run the same guarded lookup for every redirect target; never let a later default DNS lookup bypass the SSRF checks
- enforce max download sizes:
  - zip/package: 25 MB
  - spritesheet: 16 MB
  - `pet.json`: 64 KB
- never execute remote scripts
- never trust zip paths
- show confirmation before import unless we later add a trusted-source allowlist

Downloader/importer:

- accept arbitrary `.zip` packages that contain `pet.json` plus `spritesheet.webp` or `spritesheet.png` either at the zip root or inside one top-level folder
- accept direct `pet.json` only when the `pet.json` URL and spritesheet URL share the same origin, and the resolved spritesheet path stays in the same URL directory as the manifest; do not scrape arbitrary sites in MVP
- optionally accept a site manifest endpoint if the website exposes one
- install to `~/.codex/pets/<id>` by default
- then call `syncCodexPetThemes()`
- switch active theme to `codex-pet-<id>` after successful import

### Phase 4: Product Polish

Settings:

- keep the Theme tab label for MVP, but visually supplement the page with pet-oriented grouping and actions
- group cards:
  - Built-in
  - Imported Codex Pets
  - User Themes
- add `Open Codex Pets Folder`
- add `Import pet zip`
- add `Remove Imported Pet`

Website:

- primary `Open in Clawd` button emits `clawd://import-pet?...`
- fallback CLI uses Petdex:

  ```powershell
  npx petdex install yoimiya
  ```

- fallback agent prompt installs the same zip into `~/.codex/pets`
- download zip remains for manual import

Runtime:

- keep manual `Refresh Imported Pets` as the MVP sync trigger
- defer watching `~/.codex/pets` for changes to post-MVP runtime automation; cross-platform file watching should be designed separately instead of blocking Phase 4
- when a manual refresh sees package mtime changes, refresh managed themes
- preserve currently selected pet if its package updates

### Phase 5: Native Spritesheet Channel

If generated SVG wrappers become limiting, add a native spritesheet channel to `renderer.js`.

Potential binding shape:

```json
{
  "type": "codex-pet-spritesheet",
  "spritesheet": "spritesheet.webp",
  "animation": "running"
}
```

Reasons to defer only if the wrapper spike passes:

- current `state.js` and theme-loader expect state bindings to resolve to filenames
- settings previews, overrides, hitboxes, and animation-cycle probing are filename-centric
- generated wrappers let us ship compatibility first with smaller blast radius

Reasons to do later:

- fewer generated files
- direct control over frame timing in JS
- easier runtime animation switching
- easier future autonomous walking with `running-left` / `running-right`

Scope warning:

- this path is not a cheap fallback. It touches renderer asset binding, preload/state payload shape if bindings stop being filenames, theme-loader schema, settings previews, and animation-cycle probing.
- if Spike 0 fails, treat Phase 5 as a new implementation plan with its own estimate and priority decision, not as an automatic continuation of the wrapper MVP.
- rough order of magnitude: a minimal native channel is likely 1-2 focused weeks after design, while parity with previews, reactions, settings overrides, sleep/DND behavior, tests, and cross-platform manual QA can stretch to 2-3 weeks. Re-estimate from Spike 0 failure details instead of committing this range as a schedule.

## Files Likely To Change

MVP:

| File | Change |
|---|---|
| `src/codex-pet-adapter.js` | New scanner, validator, wrapper generator, materializer |
| `src/theme-loader.js` | Copy safe relative SVG raster dependencies into theme cache |
| `src/theme-loader.js` | Pass through generated theme `rendering.svgChannel` to renderer config |
| `src/renderer.js` | Honor forced object-channel SVG rendering for generated Codex Pet states and reactions |
| `src/main.js` | Call Codex Pet sync on startup and expose refresh/import IPC |
| `src/settings-renderer.js` | Add badge/action for imported Codex Pets, minimal UI only |
| `src/prefs.js` | Only if a dedicated imported-pet setting is added; avoid in MVP if normal theme selection is enough |
| `test/codex-pet-adapter.test.js` | Unit coverage for validation and materialization |
| `test/theme-loader.test.js` | Cache-copy coverage for relative SVG raster dependencies |
| `docs/guides/guide-theme-creation.md` | Later: mention Codex Pet import as an easier path |

Phase 3:

| File | Change |
|---|---|
| `src/main.js` | protocol registration and URL dispatch |
| `src/codex-pet-importer.js` | optional separate downloader/importer module |
| `package.json` / build metadata | protocol registration metadata if needed by electron-builder |
| `test/import-url.test.js` | URL parsing, SSRF guard, zip path guard |

Phase 5:

| File | Change |
|---|---|
| `src/renderer.js` | native spritesheet playback channel |
| `src/preload.js` | state-change payload shape if bindings stop being plain filenames |
| `src/theme-loader.js` | schema support for non-file asset descriptors |
| `src/animation-cycle.js` | duration probing for Codex Pet rows |

## Testing Plan

### Unit Tests

- valid package passes validation
- missing `pet.json` fails
- invalid JSON fails
- Unicode manifest `id` is preserved as source metadata while generated theme ID is slugified
- colliding slugs are deduplicated without overwriting unmanaged themes
- slug suffixes are deterministic across repeated scans of the same package set
- absolute `spritesheetPath` fails
- traversal `spritesheetPath` fails
- unsupported spritesheet extension fails
- WebP and PNG headers are validated
- wrong atlas dimensions fail
- wrapper SVG generation produces expected rows and durations
- wrapper SVG generation never references unused transparent cells
- loop wrappers use infinite animation
- one-shot reaction wrappers use one iteration and forwards fill mode
- one-shot reaction wrappers replay on repeated forced object-channel swaps
- renderer cache-bust remains unique per swap for any SVG that still uses the `<img>` channel
- static wrappers render only frame 0
- omitted optional reactions such as `drag` and `annoyed` do not crash hit handling
- materializer does not overwrite non-managed user themes
- unmanaged `codex-pet-<slug>` occupancy gives the managed package a stable suffixed ID and is not reclaimed on later sync
- managed theme refresh updates stale wrappers
- theme-loader copies safe relative `spritesheet.webp` / `spritesheet.png` references into cache
- theme-loader ignores fragment-only `#id` and `url(#id)` references when collecting raster dependencies
- theme-loader migrates legacy flat `.cache-meta.json` to versioned SVG/raster metadata with one full re-cache
- theme-loader invalidates cached raster copies when source mtime/size changes
- theme-loader repairs partial raster cache copies after interrupted writes
- theme-loader rejects unsafe SVG references

### Integration Tests

- materialized theme passes `theme-loader.validateTheme`
- generated `theme.json` can be loaded as active theme
- generated renderer config forces SVG playback through the object channel without enabling eye tracking
- Clawd state `working` resolves to `codex-pet-running-loop.svg`
- Clawd state `notification` resolves to `codex-pet-waiting-loop.svg`
- Clawd state `error` resolves to `codex-pet-failed-loop.svg`
- fallback states do not crash when sleep assets are absent
- `eyeTracking.enabled: false` produces no renderer eye attach attempts even though generated wrappers use the object channel
- switching from Codex Pet back to built-in `clawd` re-attaches eye tracking normally
- `miniMode.supported: false` disables the mini menu path
- Settings renders malicious `displayName` / `description` as inert text, not HTML

### Manual QA

Use packages from `D:\tmp\codex-pet-lab`:

- `pinky`
- `klee`
- `paimon`
- `yoimiya宵宫`

Manual scenarios:

- start Clawd with packages already in `~/.codex/pets`
- refresh imported pets from Settings
- switch from built-in theme to imported pet
- trigger `thinking`, `working`, `notification`, `attention`, and `error`
- click pet and verify reaction
- DND sleep does not crash, leave blank visual, or look like an active working animation
- measure perceived object-channel state switch latency, including P99 over repeated swaps
- record renderer RSS before and after at least 100 object-channel state swaps
- leave DND/sleep fallback mounted during a long-running soak and verify memory stays bounded
- permission bubble and session HUD still anchor acceptably
- uninstall/delete package and verify Clawd degrades gracefully
- protocol import with Clawd already running
- protocol import with Clawd closed
- agent-assisted install prompt flow: unzip a package into `~/.codex/pets`, then refresh Clawd imported pets
- 50 imported pets add less than 500 ms to startup on the Windows dev machine and keep generated/cache disk growth under 200 MB

## Security And Rights

Codex Pet import is an untrusted input surface.

Rules:

- never execute package scripts
- never load remote images at runtime
- copy remote assets locally after validation
- block unsafe download hosts
- cap file sizes
- validate archive paths
- treat `displayName`, `description`, and any optional metadata as untrusted text; trim, length-cap, and render with text APIs
- never put imported text into `innerHTML`; generated `theme.json.name` and `description` remain untrusted all the way through Settings UI
- sanitize generated or imported SVG
- keep protocol import confirmation in MVP. Phase 3 uses a one-step pre-download confirmation with source host and URL, then shows pet display name after validation succeeds. Package size is protected by strict caps; showing name + size before download is deferred polish unless the website provides trusted preview metadata separately.
- treat agent-assisted prompts as a fallback, not the safest path. The prompt should include zip-slip checks, but damage can occur before Clawd's later scan. Prefer `clawd://` import or Petdex for normal users.

Rights:

- imported pets may be fan art or third-party character art
- Clawd should not imply the project owns or endorses imported art
- MVP import UI must show package origin host before download and pet display name after validation. Package size must be capped strictly. A richer preflight that shows pet display name and package size before install is deferred until the protocol/gallery contract can provide preview metadata without trusting arbitrary remote text too early.
- import UI may show source, author, or license only when explicit metadata exists
- website/package metadata can carry source and license fields as optional extensions, but Clawd must not require them

Suggested disclaimer in import dialog:

```text
Only import pets you have the right to use. Clawd will store a local copy and use it as your desktop pet.
```

## Migration And Compatibility

Existing Clawd users:

- no behavior change unless they install/import Codex Pets
- built-in themes remain first-class
- current theme preference can continue to store generated theme IDs like `codex-pet-yoimiya`

Existing Codex Pet users:

- packages already in `~/.codex/pets` become discoverable
- no need to reinstall through Clawd

Existing theme authors:

- no breaking schema changes required for MVP
- safe relative raster references in SVG become more reliable after cache-copy support

Resource cost:

- MVP may temporarily store the same atlas in `~/.codex/pets`, the managed generated theme folder, and the theme cache.
- Keep the protocol/package size caps strict and include a 50-pet manual QA pass before shipping.
- Include cold-cache measurement for raster cache materialization. Startup budget must account for copying dozens of multi-megabyte spritesheets, not only scanning `pet.json`.
- Revisit hardlinks, symlinks, direct source references, or the native spritesheet channel if disk growth or cache IO becomes visible.

## Open Questions

1. Should Clawd use `~/.codex/pets` as the canonical install location for one-click imports, or copy into Clawd userData and optionally mirror to `~/.codex/pets`?

   Recommendation: install to `~/.codex/pets` first. It makes the pet shared across compatible runtimes and matches the website/CLI mental model.

2. Should generated wrapper themes be visible as normal themes?

   Recommendation: yes for MVP, but visually badge/group them as `Codex Pet`.

3. Should import be one-click with no confirmation?

   Recommendation: no for MVP. Use one click on website plus one confirmation in Clawd. Remove confirmation only for trusted sources later.

4. Should Clawd support website scraping?

   Recommendation: avoid scraping in MVP. Prefer direct `.zip` package URLs from the website button. Accept direct `pet.json` only when it belongs to an explicit package/manifest flow, not by scraping arbitrary gallery pages.

5. Should we add author/license fields to `pet.json`?

   Recommendation: accept optional fields if present, but do not require them until the broader Codex Pet ecosystem agrees.

6. Should website-generated agent prompts be treated as an official install path?

   Recommendation: yes, but only as a fallback. The prompt should install into `~/.codex/pets`; Clawd should not rely on the prompt wording for trust or validation. Clawd still validates packages when it scans them.

7. Should generated themes copy, hardlink, symlink, or directly reference the original spritesheet?

   Recommendation: copy for MVP if the wrapper spike proves acceptable. Hardlinks are volume-limited, symlinks are permission-sensitive on Windows, and direct source references complicate the current external theme cache. Measure disk cost before optimizing.

8. Should the wrapper route remain the MVP after the spike?

   Recommendation: only if Spike 0 passes with the forced object channel. If inline SVG CSS, object-channel cache-relative raster loading, reaction replay, or state-switch IO fails, pause and re-estimate Phase 5 native spritesheet playback before committing it to the MVP.

## Success Criteria

MVP is successful when:

- Spike 0 proves the wrapper path, or the project has been re-scoped around native spritesheet playback with a separate estimate
- a pet installed to `~/.codex/pets/<id>` appears in Clawd without manual conversion
- the user can select it from Settings
- Clawd states visibly animate using the correct atlas rows
- generated wrappers render through the object channel without enabling eye tracking
- DND/sleep fallback is visually still rather than active-looking
- no built-in theme behavior regresses
- invalid packages fail safely with diagnostics

One-click import is successful when:

- a website button can open Clawd through `clawd://import-pet`
- Clawd imports, validates, and switches to the pet
- Petdex CLI and zip download fallbacks still work
- fallback agent-assisted installs into `~/.codex/pets` are discovered by Refresh Imported Pets
- the user never has to understand `theme.json`

## Recommended Delivery Order

1. Finish the full adapter-shaped Spike 0 fixture: all MVP rows, loop/once/static wrappers, repeated reaction replay, cold first-swap behavior, and state-switch latency/memory checks.
2. Run Phase 0.5 visual calibration with at least `pinky`, `klee`, `paimon`, and `yoimiya宵宫`, including hit-geometry reverse mapping.
3. Build `codex-pet-adapter.js` and generate managed wrapper themes from local packages.
4. Add Settings refresh and `Codex Pet` badges.
5. Test with `D:\tmp\codex-pet-lab` packages, including Unicode IDs and DND fallback.
6. Add protocol import and download validation.
7. Update website button to emit `clawd://import-pet` and keep Petdex/zip/agent prompt fallbacks.
8. Revisit native spritesheet channel if wrapper IO, cache complexity, or disk growth becomes visible.
