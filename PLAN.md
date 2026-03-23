# Clawd 桌宠 — 开发计划

## 项目概述

一个桌面宠物（Windows + macOS），基于 Claude Code 吉祥物 Clawd（像素风螃蟹），能感知 Claude Code 的工作状态并做出对应动画反应。

**已完成里程碑**：MVP → 状态感知 → 交互打磨 → 生命感（眼球追踪/点击反应/睡眠序列）→ macOS 适配 → GitHub 发布（v0.3.2）→ 终端定位（v0.3.3）→ 权限审批气泡（v0.3.4）

---

## 当前待办

### 未完成的零散项

- [ ] 光标离开屏幕或距离太远时，眼睛回到默认位置
- [ ] 考虑添加自定义动画（PixelLab.ai 或 Piskel 手绘）

### 借鉴 Notchi 的改进（2026-03-23 调研 [sk-ruban/notchi](https://github.com/sk-ruban/notchi)）

**优先级 1 — 音效系统**（🚧 进行中，遇到 autoplay policy 阻塞）

给桌宠加短音效，增强"生命感"。

- [ ] 通知/完成/错误等关键状态切换时播放短音效（⚠️ `98cad6f` WIP：隐藏窗口 autoplay policy 阻止音频播放，待解决）
- [ ] 右键菜单 + 托盘添加静音/取消静音开关
- [ ] 终端聚焦时自动静音（用户正在写代码不要吵）
- [ ] 同一 session 短时间内不重复播放（冷却机制）
- [ ] DND/sleeping 状态下不播音效

**优先级 2 — Hook 卸载脚本**

用户卸载应用后不要在 `~/.claude/settings.json` 里留垃圾。

- [ ] 新增 `hooks/uninstall.js`，从 settings.json 中移除所有 Clawd hook 条目
- [ ] 仅删除 Clawd 自己注册的条目，不动其他 hook
- [ ] 右键菜单"卸载 Hooks"选项 或 应用退出时提示

---

## 第五阶段：效率工具化

**目标：Clawd 不只是陪伴，还能提升工作效率。**

### 5.1 终端定位（✅ 已完成，Windows + macOS）

点击桌宠跳转回正在运行 Claude Code 的终端窗口。

**Windows（已完成）：**
- [x] Hook 脚本走进程树找到终端应用 PID（不依赖终端名字，自动兼容所有终端）
- [x] 预热 PowerShell + ALT 键绕过 + SetForegroundWindow 激活窗口（秒跳）
- [x] 多会话时，跳转到当前最高优先级的会话对应窗口
- [x] 单击即跳转（所有状态），不影响双击/四击反应动画

**macOS（✅ 已验证，PR #10 by PixelCookie-zyf，2026-03-23）：**
- [x] 预留 macOS 分支（`isMac` 判断），osascript 激活框架已写
- [x] 需要辅助功能权限（Accessibility）——实测 System Events 授权后正常工作
- [x] 实机测试通过（macOS 26.3.1 + Ghostty，`getStablePid()` 进程树遍历 + `focusTerminalWindow()` osascript 激活均正常）
- [x] VS Code / Cursor 集成终端已验证

### 5.2 自动更新（✅ 已完成）

用户不需要手动下载安装包。

- [x] 集成 `electron-updater`，基于 GitHub Releases 检查更新
- [x] 启动时静默检查，有新版本时托盘/右键菜单提示
- [x] 用户确认后自动下载并提示重启（Windows）
- [x] macOS：检测到新版本后打开 GitHub Releases 页面手动下载（无 Apple 签名，无法自动更新）
- [x] DND/mini 模式下静默检查不弹窗，防重复点击

### 5.3 Session Dashboard + 快速切换（✅ 已完成，Windows + macOS）

多会话用户一眼看清所有会话状态，支持鼠标和键盘两种入口。macOS Cmd+Click 及多会话显示已验证通过（PR #10，2026-03-23）。

**右键菜单（鼠标入口）：**
- [x] `buildSessionSubmenu()` 数据逻辑：遍历 sessions Map，过滤/排序/格式化
- [x] 右键菜单添加 "Sessions" 子菜单，显示每个 session 的状态 + 时长
- [x] 点击某个会话 → `focusTerminalWindow(sourcePid)` 跳转终端
- [x] 无 sourcePid 的会话显示为 disabled（不可点击）
- [x] 无活跃会话时显示灰色提示
- [x] 中英文国际化

**全局快捷键（键盘入口）：**
- [x] 注册全局快捷键（Ctrl+Shift+S），按下时 `Menu.popup()` 弹出同一个 session 菜单
- [x] 选择后跳转到对应终端窗口

### 5.5 权限审批气泡（✅ 已完成，Windows + macOS）

直接在桌宠气泡里批准/拒绝 Claude Code 的工具调用，不用切回终端。

- [x] 研究 Claude Code hook 的 `PermissionRequest` 双向通信机制（HTTP hook type 原生支持请求-响应）
- [x] 设计气泡 UI（现代简洁风：白底圆角卡片、彩色工具 pill、Allow/Deny 按钮）
- [x] HTTP hook 注册（PermissionRequest 事件，`/permission` 端点 long-poll）
- [x] 超时处理：不自动 deny，HTTP hook timeout 600s，Claude Code 超时后 fallback 到终端
- [x] 动态渲染 Claude Code 的 `permission_suggestions`（Always allow / Auto-accept edits 等）
- [x] Windows 透明窗口点击修复（显式 focus）
- [x] 固定屏幕位置（右下角，紧贴任务栏）
- [x] 深色/亮色双主题（CSS 变量 + `prefers-color-scheme`，跟随系统）
- [x] 右滑入场动画（`translateX` + spring easing）
- [x] 卡片自适应高度（无 suggestion 时自动缩短）
- [x] DND 开启时自动 dismiss 已弹出的气泡（deny）
- [x] 无效 suggestion 索引防御（deny 而非静默放行）
- [x] `setMode` 响应补全 `destination` 字段（符合 Claude Code schema）
- [x] Windows 反斜杠路径兼容（suggestion label 分割）
- [x] macOS 验证通过：透明窗口无需 `focus()` hack，Allow/Deny/suggestions 均正常（PR #10，2026-03-23）

详细实施方案见 `docs/plan-permission-bubble.md`。

---

## 搁置 / 暂缓 / 未来可能

### 非交互式 Session 过滤（未来 maybe）

`claude -p` 管道调用时跳过 hook 事件，避免批量脚本让桌宠疯狂闪切。Notchi 的做法是在 hook 脚本里检测父进程是否带 `-p`/`--print` 参数。目前鹿鹿的使用场景全是交互式，暂时不需要。

### Codex 适配（搁置，2026-03-22 调研结论）

**搁置原因**：Codex hook 系统太不成熟，且 Clawd 本身是 Claude Code 形象，做 Codex 适配定位不清晰。

**调研结果备忘（省得以后重新查）**：

- Codex CLI 的 hooks 引擎于 v0.114.0（2026-03-11）才合并，需要手动开启 feature flag：`codex -c features.codex_hooks=true`
- **目前只有 3 个事件**：`SessionStart`、`Stop`、`UserPromptSubmit`（v0.116.0 加入）
- **缺失关键事件**：PreToolUse、PostToolUse、SubagentStart/Stop、Notification 全没有 → 无法区分 working/typing/building/juggling
- Hook 配置在 `~/.codex/hooks.json`，格式类似 Claude Code 但字段不同（有 `timeout`、`statusMessage` 等）
- 事件通过 stdin JSON 传递，字段包含 `hook_event_name`、`session_id`、`cwd`、`model`、`permission_mode` 等
- OpenAI 社区在催更多事件（Issue #2109，69+ 评论），但截至 2026-03-22 未落地
- **Masko Code 的做法**：不用 hook，直接轮询 `~/.codex/sessions/*.jsonl` 日志文件（每秒读新增行），绕开了 hook 系统的限制
- 社区 fork（stellarlinkco/codex）有完整 hooks 实现，但非官方
- 如果以后要做，两条路：(A) 等官方补齐事件后写 hook 脚本；(B) 学 Masko 轮询 JSONL 日志（不依赖 hook，但绑定日志格式）

---

## 技术决策记录

| 决策 | 选择 | 理由 |
|------|------|------|
| 桌面框架 | Electron | 新手友好、Node.js 生态、透明窗口一行配置 |
| 动画格式 | SVG（CSS 动画驱动） | 透明背景、可操作内部 DOM（眼球追踪）、无损缩放 |
| 状态通信 | 本地 HTTP 服务（127.0.0.1:23333） | 零延迟、无文件并发问题、hook 脚本只需一个 POST 请求 |
| 美术风格 | 像素风 | 跟随官方 Clawd 设计 |

---

## 风险与备选方案

| 风险 | 备选方案 |
|------|---------|
| Electron 内存占用太大 | 迁移到 Tauri（前端代码可复用） |
| ~~权限审批的双向通信复杂度高~~ | ~~先做只读通知，后续迭代双向~~ ✅ 已通过 HTTP hook 解决 |
| 自动更新签名问题 | Windows 未签名会触发 SmartScreen，评估代码签名成本 |
