# 功能参考（v3.1 - v3.4）

## Session Notepad（短期记忆）

位于 `.omc/notepad.md` 的抗压缩记忆系统，分为三个层级：

| 区块 | 行为 | 用途 |
|---------|----------|---------|
| **Priority Context** | 每次 session 启动时始终加载（最多 500 字符） | 关键信息：如"项目使用 pnpm"、"API key 在 .env 中" |
| **Working Memory** | 带时间戳的条目，7 天后自动清理 | 调试线索、临时发现 |
| **MANUAL** | 永不自动清理 | 团队联系人、部署信息、永久笔记 |

**用户 skill：** `/ultrapower:note`
- `/ultrapower:note <content>` - 添加到 Working Memory
- `/ultrapower:note --priority <content>` - 添加到 Priority Context
- `/ultrapower:note --manual <content>` - 添加到 MANUAL 区块
- `/ultrapower:note --show` - 显示 notepad 内容

**自动捕获：** Task agent 输出中的 `<remember>` 标签会被自动捕获：
- `<remember>content</remember>` → 带时间戳写入 Working Memory
- `<remember priority>content</remember>` → 替换 Priority Context

**API：** `initNotepad()`、`addWorkingMemoryEntry()`、`setPriorityContext()`、`addManualEntry()`、`getPriorityContext()`、`getWorkingMemory()`、`formatNotepadContext()`、`pruneOldEntries()`

## Notepad Wisdom 系统（计划范围）

按计划范围捕获学习成果、决策、问题和挑战。

**位置：** `.omc/notepads/{plan-name}/`

| 文件 | 用途 |
|------|---------|
| `learnings.md` | 技术发现和模式 |
| `decisions.md` | 架构和设计决策 |
| `issues.md` | 已知问题和解决方案 |
| `problems.md` | 阻塞项和挑战 |

**API：** `initPlanNotepad()`、`addLearning()`、`addDecision()`、`addIssue()`、`addProblem()`、`getWisdomSummary()`、`readPlanWisdom()`

## 委派类别

语义化任务分类，自动映射到模型层级、温度和思考预算。

| 类别 | 层级 | 温度 | 思考 | 用途 |
|----------|------|-------------|----------|---------|
| `visual-engineering` | HIGH | 0.7 | high | UI/UX、前端、设计系统 |
| `ultrabrain` | HIGH | 0.3 | max | 复杂推理、架构、深度调试 |
| `artistry` | MEDIUM | 0.9 | medium | 创意解决方案、头脑风暴 |
| `quick` | LOW | 0.1 | low | 简单查询、基本操作 |
| `writing` | MEDIUM | 0.5 | medium | 文档、技术写作 |

**自动检测：** 类别根据 prompt 关键词自动识别。

## 目录诊断工具

通过 `lsp_diagnostics_directory` 工具进行项目级类型检查。

**策略：**
- `auto`（默认）- 自动选择最佳策略，存在 tsconfig.json 时优先使用 tsc
- `tsc` - 快速，使用 TypeScript 编译器
- `lsp` - 备用方案，通过 Language Server 逐文件检查

**用途：** 在提交前或重构后检查整个项目的错误。

## Session Resume

后台 agent 可通过 `resume-session` 工具携带完整上下文恢复执行。

## Ultrapilot（v3.4）

并行 autopilot，最多支持 20 个并发 worker，执行速度提升 3-5 倍。

**触发词：** "ultrapilot"、"parallel build"、"swarm build"

**工作原理：**
1. 任务分解引擎将复杂任务拆分为可并行的子任务
2. 文件所有权协调器为 worker 分配不重叠的文件集
3. Worker 并行执行，协调器管理共享文件
4. 结果整合时进行冲突检测

**最适合：** 多组件系统、全栈应用、大规模重构

**状态文件：**
- `.omc/state/ultrapilot-state.json` - Session 状态
- `.omc/state/ultrapilot-ownership.json` - 文件所有权

## Swarm（v3.4）

N 个协调 agent，从共享任务池中原子性地认领任务。

**用法：** `/swarm 5:executor "fix all TypeScript errors"`

**特性：**
- 共享任务列表，包含 pending/claimed/done 状态
- 每个任务 5 分钟超时，超时后自动释放
- 所有任务完成后干净退出

## Pipeline（v3.4）

顺序 agent 链，各阶段之间传递数据。

**内置预设：**
| 预设 | 阶段 |
|--------|--------|
| `review` | explore -> architect -> critic -> executor |
| `implement` | planner -> executor -> tdd-guide |
| `debug` | explore -> architect -> build-fixer |
| `research` | parallel(document-specialist, explore) -> architect -> writer |
| `refactor` | explore -> architect-medium -> executor-high -> qa-tester |
| `security` | explore -> security-reviewer -> executor -> security-reviewer-low |

**自定义 pipeline：** `/pipeline explore:haiku -> architect:opus -> executor:sonnet`

## 统一取消（v3.4）

智能取消，自动检测当前活跃模式。

**用法：** `/cancel` 或直接说 "cancelomc"、"stopomc"

自动检测并取消：autopilot、ultrapilot、ralph、ultrawork、ultraqa、swarm、pipeline
使用 `--force` 或 `--all` 清除所有状态。

## 验证模块（v3.4）

可复用的工作流验证协议。

**标准检查项：** BUILD、TEST、LINT、FUNCTIONALITY、ARCHITECT、TODO、ERROR_FREE

**证据验证：** 5 分钟新鲜度检测，通过/失败追踪

## 状态管理（v3.4）

标准化的状态文件位置。

**所有模式状态文件的标准路径：**
- 主路径：`.omc/state/{name}.json`（本地，按项目）
- 全局备份：`~/.omc/state/{name}.json`（全局，session 连续性）

**模式状态文件：**
| 模式 | 状态文件 |
|------|-----------|
| ralph | `ralph-state.json` |
| autopilot | `autopilot-state.json` |
| ultrapilot | `ultrapilot-state.json` |
| ultrawork | `ultrawork-state.json` |
|  | `-state.json` |
| ultraqa | `ultraqa-state.json` |
| pipeline | `pipeline-state.json` |
| swarm | `swarm-summary.json` + `swarm-active.marker` |

**重要：** 永远不要将 OMC 状态存储在 `~/.claude/` 中——该目录保留给 Claude Code 本身使用。

旧版位置在读取时自动迁移。
