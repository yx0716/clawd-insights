# Cloudling 实验目录

实现路线: **全 SVG + JS 驱动** (2026-04-26 锁定, 详见根目录 `CLAUDE.md` 接入方式段). 现有 demo 微调后即生产代码.

## `confirmed/` 最新确认内容

`confirmed/` 是当前干净交付面: 已确认状态统一放在 `confirmed/states/`, 共用资产统一放在 `confirmed/library/`. root / `wip/` / `library/` 保留原始磨制位置和历史上下文, 不作为唯一入口.

2026-04-27 精修确认:

- **`confirmed/states/thinking-lens-code-v2.svg.html`** — thinking 精修版. 保留"放大镜里跑代码", 但改成轻玻璃镜片 + 镜片内代码扫描流; 删除中心 pulse 圆、 transit 曲线和眨眼矩形补丁.
- **`confirmed/states/typing-original-polish-v2.svg.html`** — typing 精修版. 保留原版 190° 卡顿旋转、随机代码眼、角速度联动; 只微调 glyph 线重/比例、token 权重和 90ms soften.
- **`confirmed/states/notification-alert-polish-v2.svg.html`** — notification 精修版. 保留强提醒和摇晃, 改成暖色破碎冲击弧 + rim flash; 删除头顶 badge / 感叹号气泡.

2026-04-28 过渡确认:

- **`confirmed/states/idle-to-sleeping-v1.svg.html`** — idle → sleeping 过渡确认版. day/night toggle 渐显后触发 Mario bump, 云宝从 1.39s 接触点开始逐渐压扁并回弹; 使用原始 `CLOUD_D` 轮廓采样做 soft-body morph, 去掉拉绳三角和碰撞横线, 收尾戴帽和眼罩进入 sleeping.
- **`confirmed/states/carrying-eat-cloud-v5.svg.html`** — carrying / 吃云确认版. 大小不同食物云贴边进入, Cloudling 侧边外鼓包裹并快速同化, 融完后 smile + duang 回弹.
- **`confirmed/states/happy-burst-white-rainbow-ring-v6.svg.html`** — happy burst 精修确认版. 白色 runner / 柔和彩虹能量环, 保持 Cloudling 本体第一视觉.
- **`confirmed/states/happy-burst-rainbow-ring-v5.svg.html`** — happy burst 彩色彩虹环对照确认版, 保留用于比较 V6 克制方向.

2026-04-29 状态确认:

- **`confirmed/states/conducting-task-sparks-v5.svg.html`** — conducting 确认版. 4 颗童话四角 task sparks 被云宝眼神依次点名、提亮并归位; V5 定版, V6 收束/球化方向不作为最终稿.
- **`confirmed/states/building-shapeshift-loop-v1.svg.html`** — building 确认版. 云宝 → 终端 → 模块方块 → 显示器 → 彩色 M 信封 → 微笑云宝循环; 每次先眨眼, 闭眼时换形, 再睁眼落稳.
- **`confirmed/states/sweeping-context-cards-orbit-loop-v1.svg.html`** — sweeping 确认版. 透明 context cards 从左侧进入, 保持水平绕过云宝前方, 切到身后整齐垫入 stack; 三张后 stack 压缩淡出, 云宝保留呼吸和眼神跟随.
- **`confirmed/states/idle-to-dozing-soft-slump-v1.svg.html`** — idle → dozing 过渡确认版. 正常 idle 胶囊眼 → 两次半闭打盹并睁回 → 自然闭眼薄眼缝过渡 → 软塌下移进入小憩; 默认节奏 9.03s, 带轻呼吸和 timing/body 调参拉杆.

2026-04-30 过渡确认:

- **`confirmed/states/dozing-to-sleeping-v1.svg.html`** — dozing → sleeping 过渡确认版. 小憩 hold 慢吸气回圆, 睡帽轻落, 眼罩滑下接管闭眼, 末帧对齐 `sleeping-loop-v1` 首帧.
- **`confirmed/states/sleeping-to-idle-v1.svg.html`** — sleeping → idle 过渡确认版. day/night toggle 从 night 轻切回 day, 散射短线提示唤醒; 眼罩右上滑走、睡帽左上滑走, 露出参考 dozing 的本体闭眼后撑开成 idle 胶囊眼, 末帧对齐 `idle-follow`.
- **`confirmed/states/dozing-loop-v1.svg.html`** — dozing / 打盹循环确认版. 软塌闭眼 hold + 明确呼吸回圆/塌回 + 低频睡沉点头; 不加帽子、眼罩或 Z 字.

2026-04-30 Mini Mode 确认:

- **`confirmed/states/mini-crabwalk-soft-scoot-v1.svg.html`** — mini-crabwalk 确认版. 不是 mini 最终待机态, 而是右键进入 Mini Mode 时窗口挪向屏幕边缘的软弹赶路动画; SVG 内本体只做小幅 scoot / hop / squash + 轻滚角, 身后三团小云尘保留 V1 气质并已修正浅色模式可读性.
- **`confirmed/states/mini-idle-follow-b-v1.svg.html`** — mini-idle 确认版. B 方案可见中心内收 + 正眼, 动态沿用正常 idle 的跟随 / 呼吸 / 眨眼 / 眼色流动 / 距离 scale; 正式文件保留完整 Cloudling, 不内置裁切线或 ghost.
- **`confirmed/states/mini-enter-roll-in-v1.svg.html`** — mini-enter 确认版. 从屏幕边缘外简单滚入 + 软弹 settle + 睁眼接 mini-idle B; 起点在 WIP 裁切模拟中一点不露, 正式文件保留完整 Cloudling.

2026-05-01 Mini Mode 确认:

- **`confirmed/states/mini-happy-full-ring-v1.svg.html`** — mini-happy 确认版. 选回 V1 完整 full-ring 完成反馈: 白芯 runner + 彩虹环 + 少量 sparkle, 锁定参数 duration 3.6s / ringPower 1.25 / edgeBias 0.30 / bounce 0.040; 正式文件保留完整 Cloudling, 不内置裁切线或 ghost.
- **`confirmed/states/mini-alert-notification-v1.svg.html`** — mini-alert 确认版. 选 WIP punchy 档, 保留强摇晃 + 暖色破碎冲击弧 + rim flash; 锁定参数 duration 2.6s / shakeAngle 16deg / shakeFreqHz 7Hz / jumpY 0.52 / squash 0.046 / pulseScaleEnd 1.62 / rimPower 1.12; 正式文件保留完整 Cloudling, 不内置裁切线或 ghost.
- **`confirmed/states/mini-peek-hover-pose-v1.svg.html`** — mini-peek 确认版. runtime 负责 25px / 200ms 窗口探出, SVG 做 hover 后眼睛从 mini-idle 基准 (2.20×4.65, centers 7.75/12.15) morph 到正常 idle-follow 基准 (2.60×5.00, centers 9/15) + 身体 duangduang 衰减回弹; 锁定参数 eyeReturnDur 0.24s / idleEyeMax 0.50 / settleTx -0.22 / settleScale 1.012 / duangPower 1.16 / duangDur 1.12s / rimPower 1.30; 正式文件保留完整 Cloudling, 不内置裁切线或 ghost.
- **`confirmed/states/mini-enter-sleep-closed-in-v1.svg.html`** — mini-enter-sleep 确认版. DND 下闭眼入场, 复用 mini-enter 的起点完全不露和 duration probe, 但改成轻滑入 + 小幅困倦 settle; 锁定参数 duration 1.45s / startX 15.8 / rollDeg 8deg / overshoot 0.55 / squash 0.035 / eyeDrop 0.12; 正式文件保留完整 Cloudling.
- **`confirmed/states/mini-sleep-closed-breath-v1.svg.html`** — mini-sleep 确认版. DND mini 休眠循环, 接 mini-enter-sleep 末帧; 低频呼吸 + 睡沉点头 + 左侧 zzz lifecycle, 锁定参数 period 6.4s / breath 0.050 / nodDepth 0.40 / zSize 1.90 / zStart 1.40,9.25 / zInterval 2.05s; 正式文件保留完整 Cloudling.
- **`confirmed/states/mini-typing-thinking-left-eye-v1.svg.html`** — mini-working / mini-typing 可选态确认版. 沿用 thinking 放大镜代码流, 镜片固定左眼且放大到 1.14, 右眯眼移到镜片边缘, 镜片内持续纯代码变化, 底眼偶尔轻眨; 正式文件保留完整 Cloudling, 不内置裁切线或 ghost.

## 锁定的状态 (confirmed 接入清单)

打开浏览器即可看锁定数值。详细 final spec 见 `docs/cloudling/specs/`，总进度见 `docs/cloudling/state-progress.md`。

- **`confirmed/states/idle-follow.svg.html`** — idle (eye-follow), 鼠标跟随 + 距离 scale + 流动渐变。✅ 锁定 2026-04-25, V3 描边升级 2026-04-26
- **`confirmed/states/long-idle-cloud-bush-peek-v1.svg.html`** — idle-reading / long-idle, 双层暖云屏障 + 两边轮流探头 + 问号。✅ 锁定 2026-04-28
- **`confirmed/states/typing-original-polish-v2.svg.html`** — typing, 原版代码眼低侵入精修: 190° 卡顿旋转 + 8 token 描边代码符号 + 两眼互斥。✅ 精修锁定 2026-04-27
- **`confirmed/states/thinking-lens-code-v2.svg.html`** — thinking, 轻玻璃放大镜 + 镜片内代码扫描流 + 左右眼循环。✅ 精修锁定 2026-04-27
- **`confirmed/states/notification-alert-polish-v2.svg.html`** — notification, 暖色破碎冲击弧 + 强摇晃 + rim flash, 无 badge / 感叹号气泡。✅ 精修锁定 2026-04-27
- **`confirmed/states/carrying-eat-cloud-v5.svg.html`** — carrying / 吃云, 侧边外鼓包裹 + 快速同化 + duang 回弹。✅ 锁定 2026-04-28
- **`confirmed/states/happy-burst-white-rainbow-ring-v6.svg.html`** — happy burst / attention, 白色 runner / 柔和彩虹能量环 + smile 收尾。✅ 精修锁定 2026-04-28
- **`confirmed/states/conducting-task-sparks-v5.svg.html`** — conducting, 4 颗 task sparks 眼神点名归位 + 本体呼吸/轻摇/soft morph。✅ 锁定 2026-04-29
- **`confirmed/states/building-shapeshift-loop-v1.svg.html`** — building, 云宝连续变身为终端/模块/显示器/彩色 M 信封, 用眨眼承接每次换形。✅ 锁定 2026-04-29
- **`confirmed/states/sweeping-context-cards-orbit-loop-v1.svg.html`** — sweeping / PreCompact, 水平 context cards 绕过云宝前方并垫到身后, 3 张 stack 后压缩淡出。✅ 锁定 2026-04-29
- **`confirmed/states/cloud-plane-orbit-explore.svg.html`** — juggling / 激进彩蛋槽 2, 纸飞机像小行星绕飞。✅ 锁定 2026-04-26, 2026-04-29 复用为 juggling
- **`confirmed/states/error-thundercloud-loop-v9-tuned.svg.html`** — error / 404, 稳定漫反射乌云 + C 眼 + 拧毛巾压扁 + 雨势同步。✅ 锁定 2026-04-26
- **`confirmed/states/sleeping-loop-v1.svg.html`** — sleeping, 戴帽 + 眼罩 + 呼吸 / 帽子 sway / Z 字三层叠循环。✅ 锁定 2026-04-28
- **`confirmed/states/idle-to-sleeping-v1.svg.html`** — idle → sleeping 过渡, day/night toggle Mario bump + 原轮廓 soft-body 压扁回弹 + sleeping 装扮收尾。✅ 锁定 2026-04-28
- **`confirmed/states/idle-to-dozing-soft-slump-v1.svg.html`** — idle → dozing, 两次半闭/睁回模拟真人打盹, 最终自然闭眼后软塌下移, 轻呼吸保留活物感。✅ 锁定 2026-04-29
- **`confirmed/states/dozing-loop-v1.svg.html`** — dozing / 打盹循环, 通过云体轮廓、整体缩放/下沉、闭眼弧线和 halo 共同承担呼吸感。✅ 锁定 2026-04-30
- **`confirmed/states/dozing-to-sleeping-v1.svg.html`** — dozing → sleeping, 小憩 hold 慢吸气回圆后睡帽/眼罩自然落定, 末帧接 sleeping loop。✅ 锁定 2026-04-30
- **`confirmed/states/sleeping-to-idle-v1.svg.html`** — sleeping → idle, 日夜开关切回 day 后眼罩/睡帽滑走, 本体闭眼露出并撑开到 idle 胶囊眼。✅ 锁定 2026-04-30
- **`confirmed/states/mini-crabwalk-soft-scoot-v1.svg.html`** — mini-crabwalk / 边缘软弹小挪步, 右键进入 Mini Mode 时配合壳子横移到屏幕边缘; V1 三团小云尘 + long-idle 同款宽眼变化。✅ 锁定 2026-04-30
- **`confirmed/states/mini-idle-follow-b-v1.svg.html`** — mini-idle / 贴边待机, B 方案正眼内收 + eyeMax 1.85 / maxRotDeg 13 / distMaxScale 1.09 / flowAmp 4.0 / recenter 0.15s; 裁切由运行时窗口层负责。✅ 锁定 2026-04-30
- **`confirmed/states/mini-enter-roll-in-v1.svg.html`** — mini-enter / 贴边入场, 从完全不露到滚入 settle, duration 1.25s / startX 15.8 / rollDeg 28 / overshoot 1.2 / squash 0.07 / eyeOpen 0.64。✅ 锁定 2026-04-30
- **`confirmed/states/mini-peek-hover-pose-v1.svg.html`** — mini-peek / hover 探出反应, runtime 做 25px / 200ms 探出, SVG 做眼睛 0.24s 从 mini-idle 基准 morph 到正常 idle-follow 眼形/间距 + 身体 1.12s duangduang 回弹, mini eye 2.20×4.65 centers 7.75/12.15 -> idle eye 2.60×5.00 centers 9/15, settleScale 1.012 / duangPower 1.16。✅ 锁定 2026-05-01
- **`confirmed/states/mini-enter-sleep-closed-in-v1.svg.html`** — mini-enter-sleep / DND 闭眼入场, 从完全不露到闭眼轻滑入, duration 1.45s / rollDeg 8deg / overshoot 0.55 / squash 0.035。✅ 锁定 2026-05-01
- **`confirmed/states/mini-sleep-closed-breath-v1.svg.html`** — mini-sleep / DND 贴边休眠循环, 首帧接 mini-enter-sleep 末帧, breath 0.050 / nodDepth 0.40 / 左侧 zzz lifecycle。✅ 锁定 2026-05-01
- **`confirmed/states/mini-happy-full-ring-v1.svg.html`** — mini-happy / 完成反馈, 完整 full-ring V1 + duration 3.6s / ringPower 1.25 / edgeBias 0.30 / bounce 0.040, 裁切由运行时窗口层负责。✅ 锁定 2026-05-01
- **`confirmed/states/mini-alert-notification-v1.svg.html`** — mini-alert / 通知提醒, punchy 强摇晃 + 暖色破碎冲击弧 + rim flash, duration 2.6s / shakeAngle 16deg / jumpY 0.52 / squash 0.046。✅ 锁定 2026-05-01
- **`confirmed/states/mini-typing-thinking-left-eye-v1.svg.html`** — mini-working / mini-typing 可选态, thinking 放大镜固定左眼 + 纯代码流 + 底眼轻眨, lensScale 1.14 / rightEyeX 14.85 / sweep 1.72s / codeSteps 9。✅ 锁定 2026-05-01
- **`confirmed/states/drag-react-v3.svg.html`** — drag reaction, 中心自旋 wobble + 呼吸 + ＞＜眼。✅ 锁定 2026-04-29

## `library/` 跨状态共用资产

后续状态磨制时**先看这里**, 别重新发明.

- **`eye-shape-library.svg.html`** — 14 种眼睛 (情绪 6: capsule/微笑/大笑/闭眼线/圆点/X · 代码符号 8: `> < _ : = + / \`). 否决: 心形/星形 (太 emoji)
- **`cloud-morph-explore.svg.html`** — 云朵球化 morph 探索, **t=70% sweet spot 已锁定** (彩蛋槽 2 配套). 跨状态视觉原则: morph 70-90% 准形态比 100% 完美形态精致
- **`draft-rubber-white.svg`** — V2 视觉定稿静态参考 (无动画, 软橡胶白 + 紫蓝豆豆眼)

## `wip/` 进行中 / 历史备份

- **`cloud-plane-orbit-explore.svg.html`** — 云朵球化 + 纸飞机小行星轨道调参 demo. 纯循环 orbit, 鹿鹿参数: rx 17.8 / ry 4.9 / tilt -13 / start 0 / rotOffset 123 / 蓝紫清晰; 短尾迹提示轨道, 左右端点放松成云 / 前后掠过球化, 纸飞机假 3D 翻面, idle 眼睛流动 + 眨眼
- **`notification-pulse-explore.svg.html`** — notification 2026-04-26 版. 保留原 ABC 节奏: A 缓扩散、B 6Hz 摇晃 + 密集短弧、C 回落. 2026-04-27 已由 `confirmed/states/notification-alert-polish-v2.svg.html` 精修替代.
- **`error-thundercloud-loop-v9-tuned.svg.html`** — 404 error 锁定版来源 / 调参备份。当前接入文件已提升到 `confirmed/states/error-thundercloud-loop-v9-tuned.svg.html`. 默认参数来自鹿鹿截图: 4.0s loop, 拧从 0.53 开始, 压扁用时占比 0.60, 呼吸幅度 0.070, 雨线数量 8, 雨线斜移 0.40. 保留 v8 稳定材质, 不让乌云颜色/透明度随大雨闪.
- **`error-thundercloud-loop-v1~v8*.svg.html` / `error-thundercloud-*.svg`** — 404 乌云探索过程: 静态崩溃云、无闪电方向、循环拧毛巾、v6 平滑雨线、v7 雨幕对照、v8 冻结材质排查闪频.
- **`paper-plane-face-debug.svg.html`** — 纸飞机单独面片调试页. 顶点 A-F / 面 P1-P5 标注 + checkbox/solo; P3(backFace) 已判定多余并默认关闭
- **`thinking.svg.html`** — thinking v5 锁定版暂存位置, 后续整理时提升到 root
- **`thinking-magnifier-static.svg.html` / `thinking-v3-clip-backup.svg.html` / `thinking.svg.v4-lid-blink.html`** — thinking 镜片方向的静态稿与历史备份, 用来追溯 v5 决断
- **`sleeping-decoration-explore.svg.html`** — sleeping (装扮路线 A: 帽 + 抱枕变体, 纯装扮无粒子. 鹿鹿 2026-04-26 拍板)

## `_archive/` 历史归档

| 子目录 | 内容 | 价值 |
|---|---|---|
| **early-static/** | V2 视觉定稿前的草稿 (flat-white / cloud-explorer / preview screenshot) | 视觉决断历程 |
| **exploration/** | idle 跑偏方向 (eye "诶?" 反应 / 身体呼吸 4 cell / path 法向噪声"幽灵") | 学习教训 — 看到这些方向被否决的原因 |
| **canvas-prototype/** | idle Canvas 调参版 (rotate+scale Canvas) | "调参 ≠ 最终交付"的分工教训 |
| **svg-iteration/** | SVG 早期版本 (idle V1/V2, typing V1/V2/V3) | 状态迭代记录 (跑偏版归档而非删除) |
| **happy/** | happy 磨制过程 4 个探索 (弧形眼锁定 / 空间 B/D / 颜色 4 选 / 节奏累积 vs 水波纹) | happy 决断历程, 4 个对照 demo 都跑得起来 |

## 关键决断历程 (跨状态适用元教训)

锁定多个状态后沉淀的元教训, 后续磨任何状态都适用:

1. **抽象描述节奏没用要看动起来** — 鹿鹿"想象不出来"后立马做能动对照 demo, 节奏只能看不能说 (happy 元教训)
2. **仓促感来自结构, 不是总时长** — V1 (4 段 2.2s) 太快是收尾塞 3 件事; V4 (7 段 2.0s) 同时长但完美. 时长跟结构耦合, 别先调时长 (happy 元教训)
3. **小活泼 ≠ 抖** — 4-8s 缓周期 + 5-10% 微妙幅度 + 眼睛主导身体响应. 软橡胶白质感最忌高频抖, 1Hz+ 必鬼畜 (idle / 弧形眼 元教训)
4. **调参 ≠ 最终交付** — STLabs Canvas 工具链当**调参工具**好用 (调出锁定数值), 调好迁 SVG. 这是分工 (idle 元教训)
5. **token / 视觉元素选型要看视觉语义不光看几何** — `{ }` 否决因"太喜感"跟苹果精致风冲突, `*` 否决因"4 线密集偏闹". 跟苹果精致风原则一致 (typing / eye-shape-library 元教训)
6. **morph 70-90% 准形态比 100% 完美形态精致** — 球化 t=70% 验证. 后续任何 morph 类动作 (拓扑挤压 / 404 / yawn) 都先试 70-90% 不要默认 100% (跨状态原则, 已写进 CLAUDE.md 宪法 §2 脚注)
7. **材质动画和动作动画要拆开排查** — 404 大雨段闪频不是单纯雨线问题, 乌云颜色/透明度/filter 同步跳也会造成闪屏. 先冻结材质, 只留形变和雨势, 再决定要不要恢复颜色变化.
8. **节奏对时不要重写时间线** — notification 原版 ABC 节奏成立, 失败点是视觉语言. 保留强提醒和摇晃, 视觉从"广播波 / badge"精修成暖色破碎冲击弧 + rim flash, 比重做动画更稳.
9. **鹿鹿偏好: 精修胜过大改** — typing 废案 `typing-code-eyes-v2` 证明: 过度规整会削掉原版性格. 正解是保留有趣设定 (代码眼 / 放大镜跑代码 / 强提醒), 在原设定内部修线重、材质、权重和多余装饰.
