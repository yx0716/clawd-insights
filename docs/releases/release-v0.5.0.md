# v0.5.0 — More Session Sources + Faster Summaries

> Fifth release of **Clawd Insights**. The analytics dashboard now ingests sessions from four more agents, generates its one-line session summaries in batches, and the build pipeline is ready to ship signed & notarized macOS builds.

## 📊 Analytics

- **Four new session sources** — OpenClaw, opencode, Gemini CLI, and Qwen Code sessions now appear in the timeline, calendar, and reports alongside Claude Code, Codex, and the rest.
- **Batched one-line summaries** — session one-liners are generated ~10 sessions per AI call instead of one CLI spawn each, so the session list fills in much faster (with prompt-cache usage tracking).
- **Menu polish** — the Analytics Dashboard entry carries an icon and sits above the upstream Session Dashboard.

## 📦 Packaging & Build

- **Signing/notarization pipeline ready** — once Apple Developer credentials are configured as repo secrets, tagged builds ship as signed, notarized dmgs with no Gatekeeper warning (see `docs/guides/release-signing.md`). This release is still unsigned: on macOS approve it under System Settings → Privacy & Security after first launch; on Windows accept the SmartScreen prompt.
- Built by the GitHub Actions pipeline: Windows `nsis` installers for **x64** and **ARM64** (`.exe`), macOS **dmg** (x64 + arm64), and Linux **AppImage** + **deb**.

## Since v0.4.0

v0.4.0 (upstream v0.12 sync, tclaude, fork-targeted updater, dashboard disambiguation, install/source coexistence) is included — see its notes if upgrading from v0.3.0 or earlier.
