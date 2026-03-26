# Clawd 桌宠 — 开发计划

## 项目概述

一个桌面宠物（Windows + macOS），基于 Claude Code 吉祥物 Clawd（像素风螃蟹），能感知 AI 编程助手的工作状态并做出对应动画反应。支持 Claude Code、Codex CLI、Copilot CLI 三个 Agent。

**已完成里程碑**：MVP → 状态感知 → 交互打磨 → 生命感（眼球追踪/点击反应/睡眠序列）→ macOS 适配 → GitHub 发布（v0.3.2）→ 终端定位（v0.3.3）→ 权限审批气泡（v0.3.4）→ blocking 权限审批（v0.3.5）→ 进程检测 + 启动恢复 + 自动启动（v0.4.0）→ **多 Agent 适配器架构（v0.5.0）**

---

## 当前待办

### 未完成的零散项

- [ ] 光标离开屏幕或距离太远时，眼睛回到默认位置
- [ ] 考虑添加自定义动画（PixelLab.ai 或 Piskel 手绘）

### 音效系统（🚧 进行中，遇到 autoplay policy 阻塞）

给桌宠加短音效，增强"生命感"。

- [ ] 通知/完成/错误等关键状态切换时播放短音效（⚠️ `98cad6f` WIP：隐藏窗口 autoplay policy 阻止音频播放，待解决）
- [ ] 右键菜单 + 托盘添加静音/取消静音开关
- [ ] 终端聚焦时自动静音（用户正在写代码不要吵）
- [ ] 同一 session 短时间内不重复播放（冷却机制）
- [ ] DND/sleeping 状态下不播音效

### Hook 卸载脚本

用户卸载应用后不要在 `~/.claude/settings.json` 里留垃圾。

- [ ] 新增 `hooks/uninstall.js`，从 settings.json 中移除所有 Clawd hook 条目
- [ ] 仅删除 Clawd 自己注册的条目，不动其他 hook
- [ ] 右键菜单"卸载 Hooks"选项 或 应用退出时提示

### macOS 适配待验证项

基础框架已由社区贡献者完成（PR #10 by PixelCookie-zyf），以下是 M3 后新增的待验证项：

- [ ] Codex CLI 日志轮询在 macOS 上验证（`~/.codex/sessions/` 路径解析）
- [ ] Copilot CLI hooks 在 macOS 上验证（进程检测 `copilot` 二进制名 + osascript 聚焦）
- [ ] 多 Agent 共存场景 macOS 实测（三个 agent 同时运行）
- [ ] koffi 改为 optionalDependencies（避免 macOS 上编译原生模块拖慢安装）

**macOS 已验证通过的部分**（无需重测）：
- 进程树遍历（`ps -o ppid=` + `ps -o comm=`）
- 终端聚焦（osascript + System Events，需辅助功能权限）
- 系统托盘（模板图标 + Retina @2x）
- Dock 可见性控制 + 菜单栏切换
- 权限气泡（Spaces 兼容 + floating z-order）
- 极简模式 + 眼球追踪
- DMG 打包（x64 + arm64）
- 自动更新（打开 GitHub Release 页面，无代码签名）

---

## 已完成

### M3. 多 Agent 适配器架构（✅ 已完成，2026-03-25）

配置驱动的 Agent 适配层，支持三个 AI 编程助手：

- [x] `agents/` 配置目录：claude-code.js、codex.js、copilot-cli.js、registry.js
- [x] Codex CLI：JSONL 日志轮询（`agents/codex-log-monitor.js`），增量读取 + 跨午夜 + partial line 处理
- [x] Copilot CLI：hook 脚本（`hooks/copilot-hook.js`），camelCase 事件名适配
- [x] `claudePid` → `agentPid` 重命名，session 加 `agentId` 字段
- [x] `detectRunningAgentProcesses()`：同时检测 Claude Code / Codex / Copilot
- [x] `/state` 端点向后兼容（同时接受 `claude_pid` 和 `agent_pid`）
- [x] `package.json` files 加 `agents/**/*`（打包必需）
- [x] thinking 加入 stale 衰减（Codex review 发现）
- [x] 实测通过：Claude Code（hook）、Codex（日志轮询）、Copilot CLI（hook）

详细实施方案见 `docs/plan-multi-agent.md`。

### M2. 崩溃恢复 + 进程存活检测（✅ 已完成，2026-03-25）

- [x] Hook 侧：`getStablePid()` 树走查中检测 Agent 进程 PID
- [x] Session 对象 `agentPid` 字段，`cleanStaleSessions()` 优先检查
- [x] 启动恢复：延迟 5s 扫描运行中的 Agent 进程 → 抑制睡眠序列

### M1. VS Code 扩展精确终端 tab 跳转（✅ 已完成）

- [x] `extensions/vscode/` 扩展，URI handler + PID 链匹配
- [x] 支持 VS Code + Cursor，自动安装到扩展目录

### 随 Claude Code 自动启动（✅ 已合并，PR #12 by yujiachen-y）

- [x] `hooks/auto-start.js`：健康检查 → spawn 启动
- [x] 托盘菜单 checkbox + 偏好持久化

### 终端定位（✅ 已完成，Windows + macOS）

- [x] 进程树走查 → SetForegroundWindow（Win）/ osascript（Mac）
- [x] 右键菜单 Sessions 子菜单 + 全局快捷键

### 权限审批气泡（✅ 已完成，Windows + macOS）

- [x] HTTP hook blocking + bubble UI（Allow/Deny/suggestions）
- [x] 多气泡堆叠 + DND 自动 deny + 客户端断连清理

### 自动更新（✅ 已完成）

- [x] electron-updater，Windows NSIS 静默安装，macOS 打开 Release 页面

---

## 搁置 / 暂缓 / 未来可能

### 日志文件轮转（未来，issue #24）

`permission-debug.log` 和 `update-debug.log` 无上限增长，长期运行可能占用磁盘。超过 1MB 时截断保留最新内容。

- [ ] 封装日志写入函数，写入前检查文件大小
- [ ] 超过 1MB 时保留后半部分（或最新 N 行），覆盖写回
- [ ] `permLog()` 和 `updateLog()` 统一走同一套轮转逻辑

### 非交互式 Session 过滤（未来 maybe）

`claude -p` 管道调用时跳过 hook 事件，避免批量脚本让桌宠疯狂闪切。

### Copilot CLI hooks 自动注册（未来）

当前 Copilot hooks 需要手动创建 `~/.copilot/hooks/hooks.json`。未来可以在右键菜单加 "Install Copilot Hooks" 按钮自动写入。

---

## 竞品调研备忘

### Masko Code（2026-03-24 调研）

**项目**：[RousselPaul/masko-code](https://github.com/RousselPaul/masko-code)，Swift 原生 macOS 应用

| 维度 | Clawd | Masko |
|------|-------|-------|
| 运行时 | Electron (Node.js) | Swift 原生 |
| Agent | Claude Code + Codex + Copilot | Claude Code + Codex + Copilot |
| 平台 | Windows + macOS | 仅 macOS |
| 动画 | SVG（DOM + 眼球追踪） | HEVC 视频（Alpha 通道） |
| 权限 | HTTP hook blocking + bubble | 完整审批（队列 + 键盘 + 折叠） |

**我们的优势**：眼球追踪、点击/拖拽反应、睡眠序列、极简模式、DND、跨平台
**Masko 的优势**：权限审批完整度、可换角色

### Codex CLI Hooks 系统（2026-03-24 调研）

- Windows 上 hooks 完全禁用（源码 hardcoded）
- 仅 4 个事件，PreToolUse 只能 deny
- **结论**：走 JSONL 日志轮询

### Copilot CLI Hooks 系统（2026-03-25 调研）

- v1.0.11 GA（2026-02-25）
- 10 个 hook 事件（camelCase），与 Claude Code 高度相似
- Windows + macOS 均正常工作
- preToolUse 支持 deny + modifiedArgs，但无 HTTP hook
- hooks 配置在 `~/.copilot/hooks/hooks.json`（全局）
- **结论**：走 hook 路径，成本最低

---

## 技术决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 桌面框架 | Electron | 新手友好、Node.js 生态、透明窗口一行配置 |
| 动画格式 | SVG（CSS 动画驱动） | 透明背景、可操作内部 DOM（眼球追踪）、无损缩放 |
| 状态通信 | 本地 HTTP（127.0.0.1:23333） | 零延迟、无文件并发问题 |
| 多 Agent 架构 | 配置驱动（非 OOP 适配器） | Node.js 单文件项目，轻量优先 |
| Codex 事件源 | 日志轮询 | Windows hooks 禁用 + 事件集合太少 |
| Copilot 事件源 | Hook | 事件集完整，与 Claude Code 同架构 |
| 权限审批 | HTTP hook blocking | Claude Code 原生支持请求-响应模式 |

---

## 风险与备选方案

| 风险 | 备选方案 |
|------|---------|
| Electron 内存占用太大 | 迁移到 Tauri（前端代码可复用） |
| 自动更新签名问题 | Windows 未签名触发 SmartScreen，评估签名成本 |
| Codex 日志格式变更 | 映射集中在 codex.js，改一处 |
| Copilot hooks 配置方式变化 | hooks.json 格式有 schema 约束，变化可能性低 |
| wmic 被 Windows 移除 | 改用 PowerShell Get-CimInstance（长期） |
