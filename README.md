# dsh-hitl-confirm

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）打造的 **Human-in-the-Loop（人在环路）人工确认** 插件。

> 社区维护插件，并非 DeepSeek 官方组件。DeepSeek Harness 仍处于 developer preview，本插件会尽量跟随其公开扩展点，但上游破坏性变更可能要求升级插件。

当模型在运行过程中对候选选项（例如 A、B、C 三个选项）无法自行作出唯一决定时，调用本插件的 `hitl_confirm` 工具：**当前执行链路暂停**，Web 运行界面弹出**可见的确认弹窗**，清晰展示每个选项（含对应上下文）；人类用户选择并确认后，确认结果回到模型，执行链路按用户选定选项继续。

## 为什么需要

LLM 在真实任务里经常碰到「只能选一个、但都不确定」的分叉点——部署策略、回滚方向、接口取舍、是否覆盖文件等。让模型猜，风险不可控；让模型自己继续，可能跑偏。HITL 把这类决策点交还给人类：模型只负责提出候选与上下文，人做唯一决定。

## 功能

- **模型工具 `hitl_confirm`** — 模型无法做唯一决定时调用；执行链在 `ctx.userQuestions.ask()` 处暂停，直到人类确认。
- **可见确认弹窗** — 通过官方 composer 链（`conversation.composer` takeover）渲染全屏模态框：问题文本 + 决策上下文 + 编号候选选项（A/B/C…，含 label 与描述）+ 自定义回答输入框。
- **确认即继续** — 人类点击「确认选择」后，答案（所选选项 label / 自定义文本）作为工具结果返回模型，执行链按选定选项继续；点「取消」则按取消语义结算。
- **`/hitl-confirm` 命令** — 人类也可以手动触发同一弹窗（例如先预批准方向再让模型执行）。
- **与内置 `ask_user_question` 和平共存** — 本插件的问题通过固定 `header`（`HITL/Confirm`）打标，composer 链按 `priority: -100` 优先认领自己的问题；其余问题仍由内置提问 UI 处理。
- **中英文双语** — 弹窗文案跟随 DSH 的 `locale` 服务。
- **纯官方扩展点** — host 端只用 `ctx.tools.register` / `ctx.commands.register` / `ctx.userQuestions`；client 端只用 `ctx.slots.inject` + `ctx.locale`，无任何私有协议。

## 兼容性

- Node.js `^22.19.0 || >=24.0.0`
- DeepSeek Harness `0.1.1-rc.2` 系列公开插件接口
- Web profile（确认弹窗）；非 Web profile 会降级到宿主内置问题 UI

## 安装

### 从 GitHub 安装（推荐）

按 release tag 固定版本，避免 `main` 后续变化影响已有环境：

```sh
dsh plugin --profile web add -w github:jinjiang2009/dsh-hitl-confirm#v0.1.0
```

本仓库提交 `lib/` 构建产物，因此 GitHub 安装不依赖 pnpm 在安装阶段运行 `prepare` 脚本。安装后重启 Harness：

```sh
dsh web
```

### 从源码安装

```sh
git clone https://github.com/jinjiang2009/dsh-hitl-confirm.git
cd dsh-hitl-confirm

pnpm install
pnpm build

# dsh plugin 会把参数原样转发给 profile 目录中的 pnpm；
# profile 是 workspace 根时需要 -w（--workspace-root）。
dsh plugin --profile web add -w "$PWD"

# 客户端 bundle 清单在启动时扫描，安装后需重启。
dsh web
```

重启后可在 设置 → 插件 中确认 `dsh-hitl-confirm` 已列出；`dsh --profile web --dump-config` 可离线验证组合树中包含本插件行（`# == dsh-hitl-confirm` 段，含 `- id: hitl-confirm`）。

## 使用

### 模型侧（自动触发）

给模型的指令示例：

> 当你在 A/B/C 等候选方案之间无法自己做出唯一决定时，调用 `hitl_confirm` 工具：给出 question（决策问题）、context（背景与权衡）、options（每个候选的 label 与 description，推荐项 label 后缀 `(Recommended)`）。

调用后：运行暂停 → 弹窗出现 → 人类选择并确认 → 工具返回 `{ "selected": ["Option A: …"] }` → 模型按该选项继续执行。

### 人类侧（手动触发）

在 composer 输入：

```
/hitl-confirm 接下来用哪种部署策略？
- A 蓝绿部署: 零停机但需要双倍资源
- B 金丝雀发布: 风险小、灰度时间较长
- C 直接替换: 最快但有回滚风险
```

不提供选项行时，默认给出 Approve / Reject 两项。

## 工作原理

| 环节 | 机制 |
| --- | --- |
| 暂停执行链 | host 工具 `execute` 内 `await ctx.userQuestions.ask({...})` ——官方能力缝，pending 期间当前运行暂停 |
| host→浏览器 | `dsh-host-apiproxy` 注册的唯一 user-questions provider 把请求推为 `question/requested` mux 帧 |
| 弹窗挂载 | `conversation.composer` 链（composer takeover）；`select` 只认领 `header === 'HITL/Confirm'` 的品牌问题，`priority: -100` 先于内置提问 UI |
| 识别标记 | 标记编码在官方 wire 字段 `header`（宿主 strict schema 会剥离未知字段，只有既有字段能穿透） |
| 确认回传 | `wait.respond({ok:true, value:{sessionId, answer:{answers:[{id, selected, custom?}]}}})` → host resolve → 工具结果回环 |
| 取消 | `wait.respond({ok:false, error:{code:'cancelled'}})` → `ask()` 以 ASK_CANCELLED 拒绝 |
| 降级 | 若本插件 client 未加载（如非 web 平台），带品牌的问题仍由内置提问 UI 渲染（label/description 完整展示） |

## 目录结构

```
dsh-hitl-confirm/
├── package.json          # dsh.client / dsh.bundle.patch 清单
├── cordis.patch.yml      # host 层补丁（一行 insert）
├── tsdown.config.mjs     # lib/index.js(ESM host) + lib/client.js(ModuleLoader bundle)
├── lib/                  # 已提交的可安装构建产物
├── src/
│   ├── index.js          # host：hitl_confirm 工具 + /hitl-confirm 命令
│   └── client/index.js   # client：确认弹窗（composer 链接管 + i18n）
└── README.md
```

## 构建

```sh
pnpm install
pnpm build   # tsdown
```

提交前运行：

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
git diff --exit-code -- lib
```

`lib/` 必须与 `src/` 同步；CI 会拒绝未提交最新构建产物的变更。

## 已知限制

- 一次只问一个问题（`ask()` 批量能力未用满，弹窗聚焦单一决策）。
- 弹窗接管 composer 区域（官方模式），不是浏览器原生 `alert`/独立浮层；视觉上仍是全屏模态框。
- 需要浏览器在线：弹窗依赖 WebSocket mux，离线/后台会话无法应答。
- `header` 品牌串（`HITL/Confirm`）是 host/client 两端的隐式契约，改一处需同步改另一处。

## License

MIT
