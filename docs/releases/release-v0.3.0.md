# v0.3.0 — Upstream Sync + First Cross-Platform Build

> Third release of **Clawd Insights**. This is the first release after re-basing the fork onto the latest **clawd-on-desk** upstream, so the analytics dashboard now sits on top of months of upstream pet, agent, and theme work. It's also the first release built end-to-end by CI for **Windows (x64 + ARM64)**, **macOS**, and **Linux**.

## 📊 Insights Dashboard (the fork's signature)

Everything that defines this fork is carried forward: the RescueTime-style timeline and calendar views, per-project/agent distribution charts, AI-generated per-session summaries, daily/weekly AI reports, and the cross-session "Distill Knowledge" card. Open it from the tray menu, the pet's right-click menu, or `Ctrl/Cmd+Shift+Alt+A`.

## 🔄 Synced with upstream clawd-on-desk

The merge brings the upstream desktop-pet platform up to date underneath the dashboard:

- **Permission notification bubbles** — Codex CLI permission bubbles, Plan Review bubbles, and Elicitation bubbles
- **Gemini CLI hook-only integration** — Gemini now uses the modern hook path with Settings controls, event mapping, and PID detection
- **Codex Pet compatibility** — import Codex Pet packages and adapt their sprite atlas/state metadata into Clawd themes
- **Fade theme switching** — the pet window now cross-fades between themes instead of snapping
- **Linux support** — full Ubuntu/Linux build target (AppImage + deb)
- **Remote SSH agent support** — track agent sessions running over SSH
- **Session controls** — Session HUD and dashboard show renamed Codex session titles, support hiding sessions, and avoid sleep during cleanup
- **Windows Terminal focus hardening** — safer tab matching plus richer diagnostics
- **Theme & Settings polish** — smoother tab switches, clearer animation override controls, and imported pets grouped separately
- Plus assorted stability fixes (renderer crash logging, DND permission fallbacks, auto-start launch config)

## 🐛 Fixes

- **Codex session detail resolution** — codex session detail now resolves by rollout date, so the right session opens from the timeline.

## 📦 Packaging & Build

- First release produced by the GitHub Actions build pipeline: Windows `nsis` installers for **x64** and **ARM64**, macOS `dmg`, and Linux `AppImage` + `deb`.
- Pinned `cc-connect-clawd` sidecar binaries are fetched and checksum-verified before each platform build.

## 📥 Installing

The Windows build is **unsigned**, so SmartScreen will warn on first launch — click **More info → Run anyway**. After install, right-click the pet → **Analytics Dashboard** (or `Ctrl+Shift+Alt+A`).

## Known Limitations

- **Unsigned binaries** — Windows SmartScreen and macOS Gatekeeper will warn on first launch.
- **Analytics scanner coverage** — the dashboard reads **Claude Code**, **Codex CLI**, and **Cursor Agent** session histories; other agents drive the pet but are not yet charted.
- **Out-of-the-box analyzers** — Claude CLI and Codex CLI only; other backends (Claude API, OpenAI-compatible, Ollama) require registering a provider in settings.

## Lineage & Credits

Clawd Insights is an analytics-focused fork of [rullerzhou-afk/clawd-on-desk](https://github.com/rullerzhou-afk/clawd-on-desk). All upstream desktop-pet features are inherited and credited to the upstream authors and contributors.
