

<div align="center">

# clawd-insights
## Your agents do the work. You keep the knowledge.

**A local-first dashboard that records and replays your AI coding sessions**

> "Hello Clawd, it's time for your weekly report"

[![Local-First](https://img.shields.io/badge/Local--First-8b5cf6)](#why-it-exists)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-3178c6)](./LICENSE)
[![Platform](https://img.shields.io/badge/Platform-macOS%20(primary)-111827)](#getting-started)
[![Powered by Claude · Codex](https://img.shields.io/badge/Powered_by-Claude%20%C2%B7%20Codex-d97757)](#getting-started)
[![Built on Electron](https://img.shields.io/badge/Built_on-Electron-47848f)](#lineage--credits)

<p>
  <a href="#quick-install">Install</a> ·
  <a href="#features">Features</a> ·
  <a href="#getting-started">Guide</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#faq">FAQ</a> ·
  <a href="README.zh-CN.md">中文版</a>
</p>

</div>

<table align="center">
  <tr>
    <td width="50%" align="center" valign="top">
      <img src="assets/screenshot-timeline-1.png" alt="Timeline Dashboard" />
      <br /><sub><b>Timeline view</b> — every session, traced</sub>
    </td>
    <td width="50%" align="center" valign="top">
      <img src="assets/screenshot-ai-analysis.png" alt="AI Session Analysis" />
      <br /><sub><b>AI session review</b> — what you tried, what you learned</sub>
    </td>
  </tr>
</table>


**Clawd Insights automatically scans the conversations you've already had with Claude Code, Claude Internal, tclaude, Codex CLI, Cursor and other agents, and turns them into a timeline plus AI-generated session summaries.** No more scrolling through endless chat history — it builds the knowledge cards for you.

Every conversation leaves an **imprint**. No idea you tried, no bug you wrestled with, no decision you made together with the Agent is ever wasted — they all come back into view in the **Analytics Dashboard**. Trace back what happened, review how it went, keep what you learned — instead of leaving it buried in a dozen closed terminal tabs.

All data stays on your machine. AI analysis runs through your own local `claude` / `codex` CLI (or an API / Ollama backend you configure). Your conversations never touch a third party.

> Currently focused on macOS. Windows/Linux may work, but they are not the primary supported environments yet. Requires Node.js v18 or later.

## Quick Install

```bash
git clone https://github.com/yx0716/clawd-insights.git && cd clawd-insights && npm install && npm start
```

A small crab appears on your desktop — on macOS, right-click it to open the **Analytics Dashboard**. For provider setup and analysis workflows, see [Getting Started](#getting-started) below.

## Features

| Capability | What you get |
|---|---|
| **Timeline view** | Visualize every session by date / project / agent / duration — at a glance, see when you worked, on what, and for how long |
| **Local history scan** | Reads `~/.claude/projects/`, `~/.claude-internal/projects/`, `~/.tclaude/projects/`, `~/.codex/sessions/`, `~/.cursor/projects/` directly. No upload, no telemetry |
| **AI session review** | Per-session summary from the *user's* point of view: what you were trying to do, what you walked away with, key topics, time breakdown |
| **Flexible backends** | Local `claude` CLI, local `codex` CLI, or fall back to a configured API provider / Ollama — your choice, your keys. Add any number of **custom OpenAI-compatible endpoints** (Zhipu AI, DeepSeek, OpenRouter…) for cheap session analysis |
| **Batch pre-analysis** | Pre-compute summaries for recent sessions and reuse provider-aware cached results |
| **Cost tracking** | See token usage and cost per analysis run |
| **Quick access** | Open from the tray menu, the right-click menu on the desktop pet, or a global shortcut |

### Usage examples

<table align="center">
  <tr>
    <td width="25%" align="center" valign="top">
      <img src="assets/screenshot-dashboard-menu.gif" alt="Open the dashboard" />
      <br /><sub><b>① Open</b><br/>right-click → Dashboard</sub>
    </td>
    <td width="25%" align="center" valign="top">
      <img src="assets/screen-shot-select-AI-provider.gif" alt="Pick a provider" />
      <br /><sub><b>② Pick a provider</b><br/>Local CLI / API / Ollama</sub>
    </td>
    <td width="25%" align="center" valign="top">
      <img src="assets/screenshot-ai-provider-settings.gif" alt="Tweak settings" />
      <br /><sub><b>③ Tweak settings</b><br/>gear ⚙ → AI Provider</sub>
    </td>
    <td width="25%" align="center" valign="top">
      <img src="assets/screenshot-ai-analysis.gif" alt="Run analysis" />
      <br /><sub><b>④ Run analysis</b><br/>batch or per-session</sub>
    </td>
  </tr>
</table>

## Getting Started

### 1. Install and run

```bash
git clone https://github.com/yx0716/clawd-insights.git && cd clawd-insights && npm install && npm start
```

Once it launches, a small crab (the default theme) appears on your desktop — that's the Clawd pet, and **every entry point to the dashboard goes through it**.

### 2. Open the Analytics Dashboard

There are three ways to open it — pick whichever feels natural:

- **Right-click the desktop pet** → choose **Analytics Dashboard** from the context menu
- **Click the tray icon** (menu bar on macOS) → **Analytics Dashboard**
- **Keyboard shortcut**: macOS `⌘ + Shift + Option + A`

<p align="center">
  <img src="assets/screenshot-dashboard-menu.gif" width="720" alt="Right-click menu showing Analytics Dashboard">
</p>

The first time you open it, you'll see your timeline immediately — it just reads the session logs already on your disk. **No setup required for that part.**

### 3. Configure an AI Provider for session summaries

The timeline works out of the box. But to make the dashboard automatically **generate a recap summary for each session**, you need to point it at something that can call a large language model — an **AI Provider** (the analysis backend). There are three options:

| Provider type | What it is | Setup | Best for |
|---|---|---|---|
| **Local CLI** *(recommended)* | Reuses the `claude` (Claude Code) or `codex` CLI you already have installed. Uses your existing subscription, no extra API charges. | **Nothing — auto-detected** | Anyone already using Claude Code or Codex — zero overhead |
| **API key** | An API key from Anthropic, OpenAI, or another provider. Pay-per-token. | Paste your key into the dashboard settings | Users without a local CLI who don't mind a small token cost |
| **Ollama** | A locally-hosted open model server (e.g. Ollama). | Point the dashboard at your Ollama endpoint | Fully offline, never sends data to the cloud |

> **💡 Strong recommendation**: if you already have Claude Code or Codex CLI installed, **do nothing** — the dashboard auto-detects them and reuses your existing subscription quota. Cheapest and easiest path.

If you don't want to configure a provider right now, click **Skip** on the startup screen. You can always set it up later in the settings.

<p align="center">
  <img src="assets/screen-shot-select-AI-provider.gif" width="720" alt="Selecting and configuring an AI Provider in action">
</p>

### 4. Where to configure / change the provider later

If you skipped step 3, or you want to switch providers later, you can adjust it via **AI Provider Settings** at any time:

Open the Analytics Dashboard → click the **gear icon ⚙** in the top-right → **AI Provider Settings** dialog appears.

<p align="center">
  <img src="assets/screenshot-ai-provider-settings.gif" width="720" alt="AI Provider Settings dialog">
</p>

The dialog has two sections:

- **LOCAL CLI DETECTION** — shows whether the dashboard found `claude` and `codex` on your machine. Green dot = found (with version + path); red dot = missing. **If you see green dots, everything is working — proceed to the next step.**
- **API PROVIDER (FALLBACK)** — if no local CLI is installed, you can use an API key for AI session analysis (Claude / OpenAI / Ollama / …) — just paste the key and you're set.
- **CUSTOM ANALYSIS PROVIDERS** — add any number of OpenAI-compatible endpoints (Zhipu AI, DeepSeek, OpenRouter, university APIs, etc.) as dedicated analysis backends. See below.

> **Tip**: if your `claude` or `codex` was installed via **NVM, fnm, or Volta**, auto-detection may miss it. Run `which claude` or `which codex` in your terminal and paste the output into the **Claude binary path** / **Codex binary path** override field.

### Custom Analysis Providers

You can add cheap, dedicated API endpoints specifically for session analysis — keeping your expensive coding models for actual work.

**Why this matters**: your coding sessions use Claude Code or Codex (subscription or pay-per-token). Session *analysis* is a much simpler task — a `glm-4-flash` call costs ~$0.0001 vs ~$0.01 for a Sonnet call. Adding a cheap custom provider lets you analyze hundreds of sessions for pennies.

#### Adding a custom provider

1. Open the Analytics Dashboard → click the **gear icon ⚙** → **AI Provider Settings**
2. Scroll to **Custom Analysis Providers** → click **+ Add Provider**
3. Fill in the form:
   - **Provider Name** — a friendly label (e.g. `Zhipu AI GLM-4-Flash`)
   - **Type** — `OpenAI-Compatible` for most providers; `Claude` for Anthropic-format; `Ollama` for local
   - **API Endpoint** — your provider's base URL (the `/v1/chat/completions` path is appended automatically for OpenAI-compatible)
   - **API Key** — your key (stored locally in your prefs file, never uploaded)
   - **Model** — the model identifier
4. Click **Test Connection** to verify, then **Save**

The provider immediately appears in the **provider pill** dropdown on every session card — click it to switch which backend analyzes that session.

#### Popular cheap providers

| Provider | Type | Endpoint | Recommended model |
|---|---|---|---|
| **Zhipu AI (智谱)** | OpenAI-Compatible | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-flash` |
| **DeepSeek** | OpenAI-Compatible | `https://api.deepseek.com` | `deepseek-chat` |
| **OpenRouter** | OpenAI-Compatible | `https://openrouter.ai/api/v1` | `google/gemini-flash-1.5` |
| **Ollama (local)** | Ollama | `http://localhost:11434` | `qwen2.5:7b` |
| **University API** | OpenAI-Compatible | your institution's endpoint | `gpt-4o-mini` |

### Quick self-check

1. You have used `Claude Code`, `Codex`, or `Cursor Agent` locally, and it is still available now
2. Local session history exists

**Quick check**

- Open Settings and look at `Local CLI Detection`
- Switch to `Week` or `Month` and check whether the timeline shows any sessions

### 5. Start AI session analysis

#### Method A: Batch pre-analysis (auto-prompted on dashboard open)

Every time you open the Analytics Dashboard, if there are unanalyzed sessions, the dashboard **automatically pops up a dialog** — `Pre-analyze Sessions` — letting you analyze a whole time range in one go.

> **Note**: the dashboard's own internal AI summary jobs are automatically excluded from the timeline and session stats. Even if you launch `npm start` from some other directory, those internal analysis runs will not be counted as work sessions.

Available scopes:

- **Today** — every session from today
- **3 Days** — the last 3 days
- **Week** — the last 7 days
- **Custom** — your last N sessions

Pick a scope, hit confirm, and the dashboard runs through them in the background, showing an `Analyzing 1/N`, `2/N`, ... progress bar. **Already-analyzed sessions are auto-skipped** (per-provider cache), so re-clicking never wastes tokens.

<p align="center">
  <img src="assets/screen-shot-select-AI-provider.gif" width="720" alt="Batch pre-analysis and per-session analysis in action">
</p>

> **Best for**: first-time users, monthly retrospectives, catching up on a backlog.

#### Method B: Click a single session (from the timeline or the sessions list)

If you **only want to review one specific session**, no batch needed, just click it:

- **From the timeline** — in Timeline view, click any colored block (each block is a session) and the detail card slides out on the right
- **From the Sessions list** — click any session card in the right-side list

Either way, the dashboard will:

1. Show the **cached summary first** if it exists (sessions previously batch-analyzed are tagged `Analyzed` and open instantly)
2. If not yet analyzed, the click **immediately kicks off a single-session analysis** — the card shows an `Analyzing…` tag, and the result appears in seconds to tens of seconds

<p align="center">
  <img src="assets/screenshot-ai-analysis.gif" width="720" alt="Triggering single-session analysis from the timeline">
</p>

> **Best for**: you already know which session you want to revisit, ad-hoc lookups, day-to-day "scrolling through" history.

**In summary:**

- **First time using it** → run **Method A on Week** once, or pick a custom range/count for the sessions you want analyzed. Takes a few minutes and costs more tokens upfront, but every record opens instantly afterwards.
- **Daily use** → after that initial batch, switch to **Method B — pick specific sessions** as needed. Only fresh ones require a manual trigger.
- **Token-sensitive** → use **Method B on demand**. Only analyze the sessions you actually want to read — zero wasted tokens.

> **About cost**: Local CLI (Claude Code / Codex subscription) analysis **uses your existing subscription quota** — typically no extra charges. In API key mode, the dashboard shows **token usage and cost** in the top status bar after each analysis completes, so you always know what you're spending.

## How it works

Clawd runs two independent data paths side by side:

```
Your Agent                              Clawd
  │                                      │
  ├── live events ──→ hook / poll / plugin ──→ 🦀 pet animation
  │                                      │
  └── chat history ──→ local JSONL files ────→ 📊 insights dashboard
```

### Path ①: Live awareness → pet animation

While an agent works (calling tools, waiting for input, erroring out, finishing a task…) it emits events. Clawd captures them through three integration modes and drives the pet accordingly:

| Mode | How it works | Latency | Agents |
|---|---|---|---|
| **Command hook** | Agent fires an event → automatically runs a script → script HTTP-POSTs the event to Clawd's local server (`127.0.0.1:23333`) | Near zero | Claude Code, Claude Internal, tclaude, Copilot CLI, Gemini CLI, Cursor Agent, Kiro CLI, Antigravity CLI, CodeBuddy, Kimi CLI |
| **Log polling** | Clawd scans the agent's JSONL log file every ~1.5 s and detects new entries | ~1.5 s | Codex CLI, Gemini CLI (fallback), Kimi CLI (fallback) |
| **In-process plugin** | Plugin runs inside the agent's own runtime, forwarding events with zero overhead | Zero | opencode, openclaw, Hermes, Pi |

All events map to the same state machine: `idle → thinking → working → happy / error → sleeping`. The pet plays the matching SVG animation. When multiple sessions run simultaneously, it auto-switches to juggling / building / conducting animations.

> **Multi-agent coexistence**: Claude Code, Claude Internal, tclaude, Codex, Copilot, Gemini, Cursor, Kiro, opencode, Antigravity CLI, CodeBuddy, Hermes, Kimi CLI, openclaw, and Pi can all run at the same time. Clawd tracks each session independently and displays the highest-priority state.

### Path ②: Offline analysis → insights dashboard

Every conversation you have with an agent is saved as JSONL on your disk:

| Agent | Local history path |
|---|---|
| Claude Code | `~/.claude/projects/` |
| Claude Internal | `~/.claude-internal/projects/` |
| tclaude | `~/.tclaude/projects/` |
| Codex CLI | `~/.codex/sessions/` |
| Cursor Agent | `~/.cursor/projects/` |

The insights dashboard reads these files directly to generate timelines and AI summaries. **It doesn't go through hooks and doesn't require the pet to be running** — as long as chat history exists on disk, the dashboard works.

> **Note**: the analytics scanner currently covers only the four agents above. Copilot CLI, Gemini CLI, Kiro CLI, and opencode still drive pet animations, but their local histories are not yet wired into the dashboard scanner.

## Desktop pet capabilities (synced from upstream)

Beyond the analytics layer, this fork now tracks the full desktop-pet feature set from [`clawd-on-desk`](https://github.com/rullerzhou-afk/clawd-on-desk):

- **Broader agent support** — pixel-art reactions for **Claude Code, Claude Internal, tclaude, Codex CLI, Copilot CLI, Gemini CLI, Cursor Agent, Kiro CLI, opencode**, plus the newly merged **Antigravity CLI, CodeBuddy, Hermes, Kimi CLI, openclaw, and Pi**.
- **WSL & remote development** *(focus of this sync)* — Codex officially supports **WSL2**, and Clawd integrates through Codex's official hooks (with JSONL polling as a fallback). For an agent running on a remote box or inside WSL's separate Linux home, **Remote SSH** deploys the hooks over an SSH tunnel so the pet reacts to those sessions too. The remote side must use a POSIX shell — **Git Bash or WSL `bash`, not Windows `cmd.exe`**. See [docs/guides/codex-wsl-clarification.md](docs/guides/codex-wsl-clarification.md) and [docs/guides/setup-guide.md](docs/guides/setup-guide.md).
- **GUI settings panel** — a full settings window (agents, themes, shortcuts, Remote SSH, Telegram approval) replaces hand-editing config files.
- **Theming** — swap the crab for alternate characters (e.g. the Cloudling theme) or build your own with `npm run create-theme`.
- **Telegram approval** — approve or deny permission requests remotely from your phone.
- **Doctor diagnostics** — a built-in health check that verifies hook installation and per-agent integration status.
- **Session HUD & Quick Commands** — optional on-screen session-state labels and a quick-command surface.
- **The classics** — permission bubbles, mini mode, click reactions, eye-tracking, sleep sequences, and multi-monitor support all carried over.

Platform notes (Windows terminal focus, macOS focus, known limitations) live under [docs/guides/](docs/guides/).

## FAQ

**Q: Does the dashboard need internet?**
Scanning and the timeline are **fully offline**. Whether AI summaries need internet depends on which provider you pick: Local CLI uses whatever network stack Claude Code / Codex normally use; Ollama is fully offline; API key mode talks to the cloud.

**Q: Are my conversations uploaded anywhere?**
No. Clawd Insights collects zero telemetry. The provider step is *your* CLI or *your* API key calling *the model you chose* directly — no third-party server in the middle.

**Q: I don't have Claude Code or Codex. Can I still use it?**
Yes. You can use the timeline view alone (completely free, no LLM required), or paste an Anthropic / OpenAI API key into AI Provider Settings to enable the cloud path.

## Contributing

Clawd Insights is a community-driven fork. Bug reports, feature ideas, and pull requests are all welcome — open an [issue](https://github.com/yx0716/clawd-insights/issues) to discuss or submit a PR directly.

Credits are split in two: the people who build **this fork** (the analytics layer and everything listed above it), and the **upstream community** behind the desktop pet this fork stands on.

### Contributors

Thanks to everyone who has contributed to this fork:

<table>
  <tr>
    <td align="center" valign="top" width="110"><a href="https://github.com/yx0716"><img src="https://github.com/yx0716.png" width="50" style="border-radius:50%" /><br /><sub>yx0716</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/kingsley-wade"><img src="https://github.com/kingsley-wade.png" width="50" style="border-radius:50%" /><br /><sub>kingsley-wade</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/dopawei"><img src="https://github.com/dopawei.png" width="50" style="border-radius:50%" /><br /><sub>dopawei</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/XingLiu1"><img src="https://github.com/XingLiu1.png" width="50" style="border-radius:50%" /><br /><sub>XingLiu1</sub></a></td>
  </tr>
</table>

### Upstream · clawd-on-desk

The desktop pet underneath — animations, permission bubbles, multi-agent tracking, themes, the lot — is the work of the [`clawd-on-desk`](https://github.com/rullerzhou-afk/clawd-on-desk) community. The roll below is carried over from the upstream README (snapshot: July 2026); the canonical, always-current list lives [there](https://github.com/rullerzhou-afk/clawd-on-desk#contributing).

#### Maintainers

<table>
  <tr>
    <td align="center" valign="top" width="140"><a href="https://github.com/rullerzhou-afk"><img src="https://github.com/rullerzhou-afk.png" width="72" style="border-radius:50%" /><br /><sub><b>@rullerzhou-afk</b><br />鹿鹿 · creator</sub></a></td>
    <td align="center" valign="top" width="140"><a href="https://github.com/YOIMIYA66"><img src="https://github.com/YOIMIYA66.png" width="72" style="border-radius:50%" /><br /><sub><b>@YOIMIYA66</b><br />maintainer</sub></a></td>
    <td align="center" valign="top" width="140"><a href="https://github.com/Bynlk"><img src="https://github.com/Bynlk.png" width="72" style="border-radius:50%" /><br /><sub><b>@Bynlk</b><br />core contributor · Mobile / PWA</sub></a></td>
  </tr>
</table>

#### Contributors

Thanks to everyone who has helped make Clawd better:

<table>
  <tr>
    <td align="center" valign="top" width="110"><a href="https://github.com/PixelCookie-zyf"><img src="https://github.com/PixelCookie-zyf.png" width="50" style="border-radius:50%" /><br /><sub>PixelCookie-zyf</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/yujiachen-y"><img src="https://github.com/yujiachen-y.png" width="50" style="border-radius:50%" /><br /><sub>yujiachen-y</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/AooooooZzzz"><img src="https://github.com/AooooooZzzz.png" width="50" style="border-radius:50%" /><br /><sub>AooooooZzzz</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/purefkh"><img src="https://github.com/purefkh.png" width="50" style="border-radius:50%" /><br /><sub>purefkh</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/Tobeabellwether"><img src="https://github.com/Tobeabellwether.png" width="50" style="border-radius:50%" /><br /><sub>Tobeabellwether</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/Jasonhonghh"><img src="https://github.com/Jasonhonghh.png" width="50" style="border-radius:50%" /><br /><sub>Jasonhonghh</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/crashchen"><img src="https://github.com/crashchen.png" width="50" style="border-radius:50%" /><br /><sub>crashchen</sub></a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="110"><a href="https://github.com/hongbigtou"><img src="https://github.com/hongbigtou.png" width="50" style="border-radius:50%" /><br /><sub>hongbigtou</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/InTimmyDate"><img src="https://github.com/InTimmyDate.png" width="50" style="border-radius:50%" /><br /><sub>InTimmyDate</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/NeizhiTouhu"><img src="https://github.com/NeizhiTouhu.png" width="50" style="border-radius:50%" /><br /><sub>NeizhiTouhu</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/xu3stones-cmd"><img src="https://github.com/xu3stones-cmd.png" width="50" style="border-radius:50%" /><br /><sub>xu3stones-cmd</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/androidZzT"><img src="https://github.com/androidZzT.png" width="50" style="border-radius:50%" /><br /><sub>androidZzT</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/Ye-0413"><img src="https://github.com/Ye-0413.png" width="50" style="border-radius:50%" /><br /><sub>Ye-0413</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/WanfengzzZ"><img src="https://github.com/WanfengzzZ.png" width="50" style="border-radius:50%" /><br /><sub>WanfengzzZ</sub></a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="110"><a href="https://github.com/TaoXieSZ"><img src="https://github.com/TaoXieSZ.png" width="50" style="border-radius:50%" /><br /><sub>TaoXieSZ</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/ssly"><img src="https://github.com/ssly.png" width="50" style="border-radius:50%" /><br /><sub>ssly</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/stickycandy"><img src="https://github.com/stickycandy.png" width="50" style="border-radius:50%" /><br /><sub>stickycandy</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/Rladmsrl"><img src="https://github.com/Rladmsrl.png" width="50" style="border-radius:50%" /><br /><sub>Rladmsrl</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/YOIMIYA66"><img src="https://github.com/YOIMIYA66.png" width="50" style="border-radius:50%" /><br /><sub>YOIMIYA66</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/Kevin7Qi"><img src="https://github.com/Kevin7Qi.png" width="50" style="border-radius:50%" /><br /><sub>Kevin7Qi</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/sefuzhou770801-hub"><img src="https://github.com/sefuzhou770801-hub.png" width="50" style="border-radius:50%" /><br /><sub>sefuzhou770801-hub</sub></a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="110"><a href="https://github.com/Tonic-Jin"><img src="https://github.com/Tonic-Jin.png" width="50" style="border-radius:50%" /><br /><sub>Tonic-Jin</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/seoki180"><img src="https://github.com/seoki180.png" width="50" style="border-radius:50%" /><br /><sub>seoki180</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/sophie-haynes"><img src="https://github.com/sophie-haynes.png" width="50" style="border-radius:50%" /><br /><sub>sophie-haynes</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/PeterShanxin"><img src="https://github.com/PeterShanxin.png" width="50" style="border-radius:50%" /><br /><sub>PeterShanxin</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/CHIANGANGSTER"><img src="https://github.com/CHIANGANGSTER.png" width="50" style="border-radius:50%" /><br /><sub>CHIANGANGSTER</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/JaeHyeon-KAIST"><img src="https://github.com/JaeHyeon-KAIST.png" width="50" style="border-radius:50%" /><br /><sub>JaeHyeon-KAIST</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/hhhzxyhhh"><img src="https://github.com/hhhzxyhhh.png" width="50" style="border-radius:50%" /><br /><sub>hhhzxyhhh</sub></a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="110"><a href="https://github.com/TVpoet"><img src="https://github.com/TVpoet.png" width="50" style="border-radius:50%" /><br /><sub>TVpoet</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/zeus6768"><img src="https://github.com/zeus6768.png" width="50" style="border-radius:50%" /><br /><sub>zeus6768</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/anhtrinh919"><img src="https://github.com/anhtrinh919.png" width="50" style="border-radius:50%" /><br /><sub>anhtrinh919</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/tomaioo"><img src="https://github.com/tomaioo.png" width="50" style="border-radius:50%" /><br /><sub>tomaioo</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/v-avuso"><img src="https://github.com/v-avuso.png" width="50" style="border-radius:50%" /><br /><sub>v-avuso</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/livlign"><img src="https://github.com/livlign.png" width="50" style="border-radius:50%" /><br /><sub>livlign</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/tongguang2"><img src="https://github.com/tongguang2.png" width="50" style="border-radius:50%" /><br /><sub>tongguang2</sub></a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="110"><a href="https://github.com/Ziy1-Tan"><img src="https://github.com/Ziy1-Tan.png" width="50" style="border-radius:50%" /><br /><sub>Ziy1-Tan</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/tatsuyanakanogaroinc"><img src="https://github.com/tatsuyanakanogaroinc.png" width="50" style="border-radius:50%" /><br /><sub>tatsuyanakanogaroinc</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/yeonhub"><img src="https://github.com/yeonhub.png" width="50" style="border-radius:50%" /><br /><sub>yeonhub</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/joshua-wu"><img src="https://github.com/joshua-wu.png" width="50" style="border-radius:50%" /><br /><sub>joshua-wu</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/nmsn"><img src="https://github.com/nmsn.png" width="50" style="border-radius:50%" /><br /><sub>nmsn</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/sunnysonx"><img src="https://github.com/sunnysonx.png" width="50" style="border-radius:50%" /><br /><sub>sunnysonx</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/YuChenYunn"><img src="https://github.com/YuChenYunn.png" width="50" style="border-radius:50%" /><br /><sub>YuChenYunn</sub></a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="110"><a href="https://github.com/jhseo-b"><img src="https://github.com/jhseo-b.png" width="50" style="border-radius:50%" /><br /><sub>jhseo-b</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/Hwasowl"><img src="https://github.com/Hwasowl.png" width="50" style="border-radius:50%" /><br /><sub>Hwasowl</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/XiangZheng2002"><img src="https://github.com/XiangZheng2002.png" width="50" style="border-radius:50%" /><br /><sub>XiangZheng2002</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/keiyo118"><img src="https://github.com/keiyo118.png" width="50" style="border-radius:50%" /><br /><sub>keiyo118</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/pan93412"><img src="https://github.com/pan93412.png" width="50" style="border-radius:50%" /><br /><sub>pan93412</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/taehwanis"><img src="https://github.com/taehwanis.png" width="50" style="border-radius:50%" /><br /><sub>taehwanis</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/linnin233"><img src="https://github.com/linnin233.png" width="50" style="border-radius:50%" /><br /><sub>linnin233</sub></a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="110"><a href="https://github.com/xiyouMc"><img src="https://github.com/xiyouMc.png" width="50" style="border-radius:50%" /><br /><sub>xiyouMc</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/Bynlk"><img src="https://github.com/Bynlk.png" width="50" style="border-radius:50%" /><br /><sub>Bynlk</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/zxypro1"><img src="https://github.com/zxypro1.png" width="50" style="border-radius:50%" /><br /><sub>zxypro1</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/NeroAyase"><img src="https://github.com/NeroAyase.png" width="50" style="border-radius:50%" /><br /><sub>NeroAyase</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/divergentD"><img src="https://github.com/divergentD.png" width="50" style="border-radius:50%" /><br /><sub>divergentD</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/Ne9roni"><img src="https://github.com/Ne9roni.png" width="50" style="border-radius:50%" /><br /><sub>Ne9roni</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/QingXB"><img src="https://github.com/QingXB.png" width="50" style="border-radius:50%" /><br /><sub>QingXB</sub></a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="110"><a href="https://github.com/29206394"><img src="https://github.com/29206394.png" width="50" style="border-radius:50%" /><br /><sub>藤知</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/Tsdsj"><img src="https://github.com/Tsdsj.png" width="50" style="border-radius:50%" /><br /><sub>Tsdsj</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/godlockin"><img src="https://github.com/godlockin.png" width="50" style="border-radius:50%" /><br /><sub>godlockin</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/sLingli"><img src="https://github.com/sLingli.png" width="50" style="border-radius:50%" /><br /><sub>sLingli</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/ustin-star"><img src="https://github.com/ustin-star.png" width="50" style="border-radius:50%" /><br /><sub>ustin-star</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/cod3hulk"><img src="https://github.com/cod3hulk.png" width="50" style="border-radius:50%" /><br /><sub>cod3hulk</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/lxgxhsy"><img src="https://github.com/lxgxhsy.png" width="50" style="border-radius:50%" /><br /><sub>lxgxhsy</sub></a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="110"><a href="https://github.com/rebootcrab-blip"><img src="https://github.com/rebootcrab-blip.png" width="50" style="border-radius:50%" /><br /><sub>rebootcrab-blip</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/zhaoxv210"><img src="https://github.com/zhaoxv210.png" width="50" style="border-radius:50%" /><br /><sub>zhaoxv210</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/serenNan"><img src="https://github.com/serenNan.png" width="50" style="border-radius:50%" /><br /><sub>serenNan</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/IatomicreactorI"><img src="https://github.com/IatomicreactorI.png" width="50" style="border-radius:50%" /><br /><sub>IatomicreactorI</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/quantai1314"><img src="https://github.com/quantai1314.png" width="50" style="border-radius:50%" /><br /><sub>quantai1314</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/Git-creat7"><img src="https://github.com/Git-creat7.png" width="50" style="border-radius:50%" /><br /><sub>Git-creat7</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/undownding"><img src="https://github.com/undownding.png" width="50" style="border-radius:50%" /><br /><sub>undownding</sub></a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="110"><a href="https://github.com/chrono-meta"><img src="https://github.com/chrono-meta.png" width="50" style="border-radius:50%" /><br /><sub>chrono-meta</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/Yike-Ye"><img src="https://github.com/Yike-Ye.png" width="50" style="border-radius:50%" /><br /><sub>Yike-Ye</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/xiaoshidefeng"><img src="https://github.com/xiaoshidefeng.png" width="50" style="border-radius:50%" /><br /><sub>xiaoshidefeng</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/yanguibao1997"><img src="https://github.com/yanguibao1997.png" width="50" style="border-radius:50%" /><br /><sub>yanguibao1997</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/JasonZH6600"><img src="https://github.com/JasonZH6600.png" width="50" style="border-radius:50%" /><br /><sub>JasonZH6600</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/V1staz"><img src="https://github.com/V1staz.png" width="50" style="border-radius:50%" /><br /><sub>V1staz</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/royhuang91"><img src="https://github.com/royhuang91.png" width="50" style="border-radius:50%" /><br /><sub>royhuang91</sub></a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="110"><a href="https://github.com/Schlaflied"><img src="https://github.com/Schlaflied.png" width="50" style="border-radius:50%" /><br /><sub>Schlaflied</sub></a></td>
    <td align="center" valign="top" width="110"><a href="https://github.com/KaiC5504"><img src="https://github.com/KaiC5504.png" width="50" style="border-radius:50%" /><br /><sub>KaiC5504</sub></a></td>
  </tr>
</table>

## Lineage & Credits

Clawd Insights is the **analytics layer** built on top of [`rullerzhou-afk/clawd-on-desk`](https://github.com/rullerzhou-afk/clawd-on-desk), the lovely desktop pet that turns your coding agent's state into pixel art. Everything that makes the pet delightful — animations, permission bubbles, multi-agent state tracking, mini mode, the lot — is still here, untouched. What this fork adds is one extra question: **what if every conversation you've ever had with the agent was searchable, summarised, and waiting for you on a single dashboard?**

That dashboard is the new piece. It scans your local history (Claude Code, Claude Internal, tclaude, Codex CLI, Cursor Agent today; more agents on the way), draws a timeline, and lets your own LLM write per-session summaries — all without sending a byte to a third party.

Multi-agent state tracking carried over from upstream — and this repo now stays in sync with the full upstream codebase (WSL & Remote SSH support, the expanded agent roster, the GUI settings panel, theming, Telegram approval, doctor diagnostics, and more). For the desktop pet's own feature list, see [Desktop pet capabilities](#desktop-pet-capabilities-synced-from-upstream) above.

Huge thanks to [@rullerzhou-afk](https://github.com/rullerzhou-afk) and every contributor who shaped the original Clawd — this project wouldn't exist without that foundation. The full credit roll, fork and upstream side by side, is in [Contributing](#contributing) above.

## License

Source code: [GNU AGPL-3.0-only](LICENSE) — adopted from upstream `clawd-on-desk`, whose code this repo now incorporates. See also [NOTICE.md](NOTICE.md) for third-party materials.

**Artwork (assets/) is NOT covered by the AGPL.** All rights reserved by their respective copyright holders. See [assets/LICENSE](assets/LICENSE).

- **Clawd** character is the property of [Anthropic](https://www.anthropic.com). Unofficial fan project, not affiliated with Anthropic.
- **Calico cat (三花猫)** artwork by 鹿鹿 ([@rullerzhou-afk](https://github.com/rullerzhou-afk)). All rights reserved.
- **Third-party contributions**: copyright retained by respective artists.
