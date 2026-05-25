# Cloudling Confirmed

这里是 Cloudling 当前干净交付面。已确认状态统一放在 `states/`，共用资产统一放在 `library/`；原始探索文件仍保留在 `../`、`../wip/`、`../library/`，方便追溯决策过程。

## 2026-04-27 精修确认

这三个文件是当前优先接入版本：

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| typing | `states/typing-original-polish-v2.svg.html` | 保留原版代码眼、190deg 卡顿旋转和角速度联动；代码眼改为 A/B 档伪随机组合，停止和快停止时只展示 A 档组合。 |
| thinking | `states/thinking-lens-code-v2.svg.html` | 保留放大镜里跑代码的创意，改成轻玻璃镜片 + 代码扫描流；删除中心 pulse 圆、transit 曲线和眨眼矩形补丁。 |
| notification | `states/notification-alert-polish-v2.svg.html` | 保留强提醒摇晃，改成暖色破碎冲击弧 + rim flash；删除 badge / 感叹号气泡。 |

## 2026-04-28 long idle 彩蛋首发

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| long-idle (cloud bush peek) | `states/long-idle-cloud-bush-peek-v1.svg.html` | 双层暖云从左飘入挡住云宝 → 哧溜从左上探头 + 头顶冒问号 → 缩回 → 哧溜从右上再探一次 + 左右扫看眨眼 → 缩回 → 暖云左右散开露出 → idle。9 段叙事 6.2s + 1.0s gap。Cloudling 第一个引入「场景元素」(暖云屏障) 的状态，cartoon 式两边轮流探头是核心笑点。|

## 2026-04-28 sleeping 部件库 (动画前置)

sleeping 走「装扮路线 A」(纯装扮无粒子)。先磨 4 件部件再做动画，部件主库见 `../wip/sleeping-parts-explore.svg.html`，独立可复用静态资产存在 `library/`。

| 部件 | 推荐文件 | 说明 |
|---|---|---|
| 睡帽 v2-d | `../wip/sleeping-parts-explore.svg.html` (part 1) | 弯折 (bend=0.4) + 黄色圆角五角星顶。毛茸茸 cuff 用 18 个圆排在椭圆轨道上 (复用 Cloudling 主体「凸起几何」DNA), 不是 radial spikes。|
| 月亮 v2 (crescent) | `../wip/sleeping-parts-explore.svg.html` (part 2) | 暖月色 (`#FFF4D6→#FFD360→#E89F30`) + mask-based crescent + 4 陨石坑 + 顶部白高光。推翻初版月牙抱枕 (撞色 + 线条杂乱)。|
| day-night toggle | `../wip/sleeping-parts-explore.svg.html` (part 3) | 苹果风灯具开关。light=浅蓝 capsule + 白满月; dark=深紫蓝 capsule + crescent (镜像) + 5 颗星星。两状态都带月亮强化 sleeping 主题。拉绳后续加。|
| 睡眠眼罩 | `library/sleep-mask.svg` | 鹿鹿从 svgrepo.com 扒的真眼罩 path (上平下弧, 不是自建葫芦/胶囊) + 丝绸深蓝 `#22305A` 平涂 + 黑描边 + 闭眼 ⌣ 弧 + 3 根朝下睫毛丝, 左右镜像 ±5° 微下垂。viewBox `0 0 24 24` 跟 Cloudling 主体同坐标系, 直接 `<use>` 叠在云宝双眼上居中。|

## 2026-04-28 idle → sleeping 过渡确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| idle → sleeping transition | `states/idle-to-sleeping-v1.svg.html` | day/night toggle 渐显 → 云宝看到后蹲下蓄力 → Mario bump 顶开关 → 基于原始 `CLOUD_D` 轮廓的 soft-body 渐进压扁/回弹 → 满意笑眼 → 戴帽和眼罩进入 sleeping。1.39s 视觉接触点已开始受压; 删除拉绳三角和碰撞横线; 默认态外观回到原 Cloudling。|

## 2026-04-29 conducting 确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| conducting | `states/conducting-task-sparks-v5.svg.html` | 4 颗童话四角 task sparks 围绕云宝被眼神点名 A/B/C/D，依次提亮、移动并归位；云宝保留呼吸、轻摇、点名倾斜和 soft morph，浅色背景下也可读。最终定版采用 V5；V6 的突然收束 / 60% 球化方向不作为最终稿。|

## 2026-04-29 building 确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| building | `states/building-shapeshift-loop-v1.svg.html` | 云宝按 `云宝 → 终端 → 模块方块 → 显示器 → 彩色 M 信封 → 微笑云宝` 循环变身。每次先眨眼，闭眼时换形，再睁眼落稳；保留 Cloudling 软体呼吸、轻微回弹、紫蓝 glow 和眼睛主导的活物感。芯片、文件夹方向不入最终稿。|

## 2026-04-29 sweeping 确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| sweeping | `states/sweeping-context-cards-orbit-loop-v1.svg.html` | PreCompact / context cleanup 确认版。透明 context cards 从左侧水平进入，保持 0deg 绕过云宝前方，随后切到云宝身后并整齐垫入 stack；三张后 stack 原地压缩、轻闪、淡出。删除横向轨道线和背景大椭圆，云宝保留 3.2s 呼吸、眼神跟随和轻微转向。|

## 2026-04-29 juggling 确认 (复用映射)

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| juggling | `states/cloud-plane-orbit-explore.svg.html` | 复用激进彩蛋槽 2 的纸飞机 orbit。对应 SubagentStart(1) — 1 个 subagent 在工作时纸飞机像小行星绕飞，跟 conducting V5 的 4 颗 task sparks 形成 1 vs 4+ 的事件量级对照。同一 SVG 文件双重承担 (跟 happy burst V6 同时作为 attention 的复用模式一致)。|

## 2026-04-29 drag reaction 确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| drag (被拖动反应) | `states/drag-react-v3.svg.html` | clawd `reactions.drag.file` 槽位实现。中心自旋 wobble ±11° / 0.9s alternate ease-in-out + idle 同款呼吸 0.96-1.0 / 5s，两层 pivot 都在身体中心 (12,12)，眼睛切到 library `><` token (cx=9/15, cy=12, stroke 紫蓝渐变 1.25)，云朵外形不变，无 shadow lift（Cloudling 悬浮）。纯 CSS @keyframes 自驱无 JS rAF。接入时窗口跟手由壳子 `move-window-by` 处理，SVG 内部不重复。|

## 2026-04-29 idle → dozing 过渡确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| idle → dozing transition | `states/idle-to-dozing-soft-slump-v1.svg.html` | dozing / 小憩确认版。第一帧严格对齐 `idle-follow` 胶囊眼 (x=7.7/13.7, y=9.5, w=2.6, h=5)；两轮「半闭 → 睁回」模拟真人打盹，最终闭眼先压成薄眼缝再接闭眼弧线，闭眼完成后身体和外形软塌下移到 dozing hold。默认 timing 9.03s (`0.35/1.00/0.30/0.80/1.59/0.55/1.00/1.32/1.88/0.24`)，保留轻呼吸 (1.8% / 3.8s) 与 timing/body 调参拉杆。|

## 2026-04-30 dozing → sleeping 过渡确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| dozing → sleeping transition | `states/dozing-to-sleeping-v1.svg.html` | 小憩 hold → 慢吸气回圆 → 睡帽轻落 → 眼罩滑下接管闭眼 → 对齐 `sleeping-loop-v1` 首帧。末帧为原始 Cloudling path、bodyTilt -6、breath scale 1.02、hat/mask 锁定摆位；Z 字交给 sleeping loop 生成。|

## 2026-04-30 dozing / 打盹循环确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| dozing loop | `states/dozing-loop-v1.svg.html` | 打盹 / 小憩循环。保持 `idle-to-dozing` 末尾软塌闭眼 hold，不加帽子、眼罩或 Z 字；呼吸靠主体轮廓回圆/塌回、整体抬起/下沉、闭眼弧线轻微变化和 halo 扩散共同表达。默认 5.8s 一轮，后段一次更深的睡沉点头。|

## 2026-04-30 sleeping → idle 过渡确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| sleeping → idle transition | `states/sleeping-to-idle-v1.svg.html` | day/night toggle 从 night 轻切回 day，使用散射短线而不是椭圆光斑提示唤醒；眼罩向右上滑走、睡帽向左上滑走，露出参考 dozing 的 Cloudling 本体闭眼，再撑开成 `idle-follow` 胶囊眼。末帧为原始 Cloudling path、bodyTilt 0、scale 1.0、无帽/无眼罩/无 Z 字。|

## 2026-04-30 mini-crabwalk 确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| mini-crabwalk | `states/mini-crabwalk-soft-scoot-v1.svg.html` | 右键进入 Mini Mode 前的边缘小挪步确认版。运行时由 clawd `animateWindowX` 移动窗口到屏幕边缘，SVG 内部只做原地软弹赶路循环；云宝小幅 scoot / hop / squash + 轻滚角，眼睛使用 long-idle 同款正常胶囊眼 ↔ 稍宽眼 `widenFactor`，身后三团小云尘在浅色模式下带淡蓝描边/填色以保持可读。|

## 2026-04-30 mini-idle 确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| mini-idle | `states/mini-idle-follow-b-v1.svg.html` | Mini Mode 贴边待机确认版。采用 B 方案: 可见中心内收 + 正眼, 不做斜眼; 动态参考正常 idle-follow, 保留眼睛跟随、眨眼、眼色渐变流动、呼吸、边缘距离驱动 scale 和轻微云体旋转。正式文件保留完整 Cloudling, 不内置裁切线/ghost; 运行时窗口贴边负责遮挡。锁定参数: eyeMax 1.85, maxRotDeg 13, distMaxScale 1.09, flowAmp 4.0, recenter 0.15s。|

## 2026-04-30 mini-enter 确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| mini-enter | `states/mini-enter-roll-in-v1.svg.html` | Mini Mode 入场确认版。不是 mini-crabwalk 的延续, 而是落到 `mini-idle-follow-b-v1` 前的一次性滚入: 起点完全不露, 从屏幕边缘外滚进来, 软弹 settle, 眼睛从短闭眼睁到 mini-idle B。正式文件保留完整 Cloudling, 不内置裁切线/ghost; WIP 用 `cropX=14.1` 验证 0% 不露。锁定参数: duration 1.25s, startX 15.8, rollDeg 28deg, overshoot 1.2, squash 0.07, eyeOpen 0.64。|

## 2026-05-01 mini-happy 确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| mini-happy | `states/mini-happy-full-ring-v1.svg.html` | Mini Mode 完成反馈确认版。选回 V1 的完整 full-ring 强庆祝感: 白芯 runner + 彩虹环 + 少量 sparkle, happy hold 后回到 mini-idle B 眼位。正式文件保留完整 Cloudling, 不内置裁切线/ghost; 贴边遮挡交给运行时窗口位置。锁定参数: duration 3.6s, ringPower 1.25, edgeBias 0.30, bounce 0.040, WIP cropX 14.1; 带隐藏 duration probe。|

## 2026-05-01 mini-alert 确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| mini-alert | `states/mini-alert-notification-v1.svg.html` | Mini Mode 通知确认版。选 WIP 的 punchy 档: 强摇晃 + 暖色破碎冲击弧 + rim flash, 不加 badge / 感叹号 / 彩虹 ring, 末帧回到 mini-idle B 胶囊眼。正式文件保留完整 Cloudling, 不内置裁切线/ghost; 贴边遮挡交给运行时窗口位置。锁定参数: duration 2.6s, shakeAngle 16deg, shakeFreqHz 7Hz, jumpY 0.52, squash 0.046, pulseScaleEnd 1.62, rimPower 1.12; 带隐藏 duration probe。|

## 2026-05-01 mini-peek 确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| mini-peek | `states/mini-peek-hover-pose-v1.svg.html` | Mini Mode hover peek 确认版。runtime 负责 25px / 200ms 窗口探出; SVG 负责 hover 后眼睛从 mini-idle 基准 (2.20×4.65, centers 7.75/12.15, gap 4.4) morph 到正常 idle-follow 基准 (2.60×5.00, centers 9/15, gap 6), 身体随后 duangduang 衰减回弹。正式文件保留完整 Cloudling, 不内置裁切线/ghost; 贴边遮挡交给运行时窗口位置。锁定参数: eyeReturnDur 0.24s, idleEyeMax 0.50, idleRecenter 0.45s, settleTx -0.22, settleScale 1.012, settleRot -0.65deg, duangPower 1.16, duangDur 1.12s, duangCycles 4.80, rimPower 1.30。|

## 2026-05-01 mini-enter-sleep 确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| mini-enter-sleep | `states/mini-enter-sleep-closed-in-v1.svg.html` | DND Mini Mode 入场确认版。复用 `mini-enter-roll-in-v1` 的起点完全不露和 duration probe, 但改成闭眼从边缘外轻轻滑进来 + 小幅困倦 settle; 不做活泼滚入、不睁眼。正式文件保留完整 Cloudling, 贴边遮挡交给运行时窗口位置。锁定参数: duration 1.45s, startX 15.8, rollDeg 8deg, overshoot 0.55, squash 0.035, eyeDrop 0.12。|

## 2026-05-01 mini-sleep 确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| mini-sleep | `states/mini-sleep-closed-breath-v1.svg.html` | DND Mini Mode 休眠循环确认版。接 `mini-enter-sleep-closed-in-v1` 末帧, 首帧 tx 0 / rot 0 / scale 1 / 闭眼弧线对齐; 低频呼吸 + 一次睡沉点头 + 左侧 zzz lifecycle, 不加睡帽 / 眼罩 / 场景元素。正式文件保留完整 Cloudling, 贴边遮挡交给运行时窗口位置。锁定参数: period 6.4s, breath 0.050, nodDepth 0.40, nodRot -0.55deg, eyeDrop 0.12, eyeSoft 0.10, zSize 1.90, zOpacity 0.68, zStart 1.40/9.25, zInterval 2.05s。|

## 2026-05-01 mini-working / mini-typing 确认

| 状态 | 推荐文件 | 说明 |
|---|---|---|
| mini-working / mini-typing | `states/mini-typing-thinking-left-eye-v1.svg.html` | Mini Mode 工作中可选态确认版。沿用 `thinking-lens-code-v2` 的轻玻璃放大镜和代码流, 但镜片固定停在左眼, 不再左右换眼; 镜片放大到 1.14, 右侧眯眼移到 x=14.85 的镜片边缘, 镜片内持续纯代码变化, 底眼每 3.6s 轻眨 0.16s 且不打断代码。正式文件保留完整 Cloudling, 不内置裁切线/ghost; 该状态不计入 required mini mode。|

## States

| 状态 | 文件 | 来源 |
|---|---|---|
| idle | `states/idle-follow.svg.html` | `../idle-follow.svg.html` |
| typing baseline | `states/typing.svg.html` | `../typing.svg.html` |
| typing polish | `states/typing-original-polish-v2.svg.html` | `states/typing.svg.html` |
| thinking baseline | `states/thinking.svg.html` | `../wip/thinking.svg.html` |
| thinking polish | `states/thinking-lens-code-v2.svg.html` | `states/thinking.svg.html` |
| notification baseline | `states/notification-pulse-explore.svg.html` | `../wip/notification-pulse-explore.svg.html` |
| notification polish | `states/notification-alert-polish-v2.svg.html` | `states/notification-pulse-explore.svg.html` |
| happy burst | `states/happy-burst-script.svg.html` | `../happy-burst-script.svg.html` |
| 404 error | `states/error-thundercloud-loop-v9-tuned.svg.html` | `../wip/error-thundercloud-loop-v9-tuned.svg.html` |
| cloud-plane orbit | `states/cloud-plane-orbit-explore.svg.html` | `../wip/cloud-plane-orbit-explore.svg.html` |
| long-idle cloud bush peek | `states/long-idle-cloud-bush-peek-v1.svg.html` | `../wip/long-idle-cloud-bush-peek-v2-before-script-rewrite.svg.html` |
| idle → sleeping transition | `states/idle-to-sleeping-v1.svg.html` | `../wip/idle-to-sleeping-v8-preserve-shape-no-line.svg.html` |
| conducting | `states/conducting-task-sparks-v5.svg.html` | `../wip/conducting-task-sparks-v5.svg.html` |
| building | `states/building-shapeshift-loop-v1.svg.html` | `../wip/building-shapeshift-v2/building-shapeshift-building-loop-v1.svg.html` |
| sweeping | `states/sweeping-context-cards-orbit-loop-v1.svg.html` | `../wip/sweeping-context-cards-orbit-loop-v1.svg.html` |
| idle → dozing transition | `states/idle-to-dozing-soft-slump-v1.svg.html` | `../wip/idle-to-dozing-soft-slump-v1.svg.html` |
| dozing loop | `states/dozing-loop-v1.svg.html` | `../wip/dozing-loop-v1.svg.html` |
| dozing → sleeping transition | `states/dozing-to-sleeping-v1.svg.html` | `../wip/dozing-to-sleeping-v1.svg.html` |
| sleeping → idle transition | `states/sleeping-to-idle-v1.svg.html` | `../wip/sleeping-to-idle-v1.svg.html` |
| mini-crabwalk | `states/mini-crabwalk-soft-scoot-v1.svg.html` | `../wip/mini-crabwalk-soft-scoot-v1-lightfix.svg.html` |
| mini-idle | `states/mini-idle-follow-b-v1.svg.html` | `../wip/mini-idle-follow-b-v3.svg.html` |
| mini-enter | `states/mini-enter-roll-in-v1.svg.html` | `../wip/mini-enter-roll-in-v1.svg.html` |
| mini-peek | `states/mini-peek-hover-pose-v1.svg.html` | `../wip/mini-peek-hover-pose-v1.svg.html` |
| mini-enter-sleep | `states/mini-enter-sleep-closed-in-v1.svg.html` | `../wip/mini-enter-sleep-closed-in-v1.svg.html` |
| mini-sleep | `states/mini-sleep-closed-breath-v1.svg.html` | `../wip/mini-sleep-closed-breath-v1.svg.html` |
| mini-happy | `states/mini-happy-full-ring-v1.svg.html` | `../wip/mini-happy-full-ring-v1.svg.html` |
| mini-alert | `states/mini-alert-notification-v1.svg.html` | `../wip/mini-alert-notification-v1.svg.html` |
| mini-working / mini-typing | `states/mini-typing-thinking-left-eye-v1.svg.html` | `../wip/mini-typing-thinking-left-eye-v1.svg.html` |

## Shared Assets

| 资产 | 文件 | 来源 |
|---|---|---|
| V2 软橡胶白静态参考 | `library/draft-rubber-white.svg` | `../library/draft-rubber-white.svg` |
| 眼睛形状库 | `library/eye-shape-library.svg.html` | `../library/eye-shape-library.svg.html` |
| 云朵球化参考 | `library/cloud-morph-explore.svg.html` | `../library/cloud-morph-explore.svg.html` |
| 纸飞机参考 | `library/paper-plane-v9-cloudling.svg.html` | `../library/paper-plane-v9-cloudling.svg.html` |
| 睡眠眼罩 (sleeping 部件) | `library/sleep-mask.svg` | `../library/sleep-mask.svg` |

## Notes

- 白色 Cloudling 状态已经包含浅色背景边缘适配系统。
- 404 error 状态故意保留乌云材质，不套白色 Cloudling 主体。
- 偏好记录：保留强原始概念，再在概念内部精修。不要把代码眼、放大镜代码流、强 notification 能量替换成通用极简动效。
- `states/typing-code-eyes-v2.svg.html` 是被否掉的方向：重设计太多、过度规整，削弱原版 typing 性格。
