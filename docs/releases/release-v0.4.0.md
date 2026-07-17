# v0.4.0 — Upstream v0.12 Sync + tclaude

> Fourth release of **Clawd Insights**. This release re-aligns the fork with upstream **clawd-on-desk v0.12.0** (418 commits since the last sync) and adds two new Claude-family agents contributed on the fork side. The analytics dashboard is unchanged and carried forward in full.

## 📊 Insights Dashboard (the fork's signature)

Everything that defines this fork is carried forward: the RescueTime-style timeline and calendar views, per-project/agent distribution charts, AI-generated per-session summaries, daily/weekly AI reports, and the cross-session "Distill Knowledge" card. Open it from the tray menu, the pet's right-click menu, or `Ctrl/Cmd+Shift+Alt+A`.

New on the fork side:

- **tclaude analytics backend** — AI reports and session analysis can now run through tclaude in addition to the existing backends.

## 🤖 Agents

- **New agents from upstream** — Qoder, QoderWork, Qwen Code, CodeWhale, and Reasonix join the roster alongside the existing Cursor, OpenClaw, opencode, Copilot CLI, Gemini CLI, Kimi CLI, and Codex integrations.
- **Fork-side agents** — `claude-internal` and `tclaude` are supported as first-class agents.
- **Kimi CLI hardening** — persisted argv mode detection, passive permission cues for batched approvals, and Doctor checks.

## 🔄 Synced with upstream clawd-on-desk v0.12.0

- **Telegram remote control** — approve permission requests, answer AskUserQuestion clarifications, and receive session updates from Telegram, localized in 5 languages.
- **Mobile preview server** — preview and control sessions from a phone on the local network, with token-based auth.
- **In-app updater** — the tray and context menus surface "Update available / Update Ready" entries when a new build is published.
- **Onboarding tutorial** — a first-run tutorial introduces the pet and its menus.
- **Windows** — DWM cloak self-heal, terminal focus hardening, and blocked cmd Remote-SSH deploy paths.
- **Linux** — Wayland smoke workflow and continued AppImage/deb support.
- Plus the usual round of settings, fullscreen, focus, and state-mapping fixes.

## 📦 Packaging & Build

- Built by the GitHub Actions pipeline: Windows `nsis` installers for **x64** and **ARM64** (`.exe`), macOS **dmg**, and Linux **AppImage** + **deb**.
- Installers are unsigned; on macOS use right-click → Open on first launch, on Windows accept the SmartScreen prompt.
