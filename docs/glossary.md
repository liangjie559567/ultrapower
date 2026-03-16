# ultrapower 术语表

> **版本**: v5.5.33 | **更新**: 2026-03-16

核心术语分类参考。

---

## Agent（代理）

**Agent** - 专业化的 AI 角色，处理特定类型的工作。ultrapower 包含 49 个 agent，分为 6 个通道。

**Executor** - 代码实现 agent（Sonnet 模型）。处理多文件实现、重构、功能开发。

**Verifier** - 验证 agent（Sonnet 模型）。收集完成证据（BUILD/TEST/LINT/TODO），验证声明。

**Debugger** - 调试 agent（Sonnet 模型）。根因分析、回归隔离、故障诊断。

**Architect** - 架构 agent（Opus 模型）。系统设计、边界定义、接口设计、长期权衡。

**Planner** - 规划 agent（Opus 模型）。任务排序、执行计划、风险标记。

**Explore** - 探索 agent（Haiku 模型）。代码库发现、符号/文件映射、快速扫描。

**Deep-Executor** - 深度执行 agent（Opus 模型）。复杂自主目标导向任务，包含自我验证循环。

---

## Skill（技能）

**Skill** - 行为注入器，修改编排器的运行方式。用户通过 `/ultrapower:<name>` 调用。

**Autopilot** - 全自主执行模式。从想法到可运行代码，无需人工干预。触发词："autopilot"、"build me"。

**Ralph** - 持久循环模式。带 verifier 验证的自引用循环，"不停止直到完成"。触发词："ralph"、"don't stop"。

**Ultrawork** - 最大并行度编排。并行 agent 编排，多个 agent 同时工作。触发词："ulw"、"ultrawork"。

**Team** - 多 agent 协调模式。使用 Claude Code 原生团队，分阶段流水线（plan→prd→exec→verify→fix）。

**Pipeline** - 顺序链式执行。带数据传递的顺序 agent 链。

**Ultrapilot** - Team 的兼容性外观。并行 autopilot，映射到 Team 分阶段运行时。

**Swarm** - 分布式任务认领。N 个协调 agents，SQLite 任务队列，动态任务认领。

---

## Hook（钩子）

**Hook** - 事件驱动的生命周期控制。Claude Code 触发 hook 事件，ultrapower 注册处理器。

**Hook Event** - Claude Code 发出的事件类型。15 种类型：UserPromptSubmit、SubagentStart/Stop、SessionStart/End、PermissionRequest 等。

**Hook Handler** - Hook 事件的处理函数。位于 `src/hooks/` 目录。

**Keyword Detector** - 关键词检测 hook。识别魔法关键词（"autopilot"、"ralph"、"team"），激活对应 skill。

**Bridge Normalize** - Hook 输入规范化。将 Claude Code 的 snake_case 输入转换为内部 camelCase，应用安全过滤。

**SENSITIVE_HOOKS** - 敏感 hook 集合。permission-request、setup-init、setup-maintenance、session-end，严格白名单过滤。

---

## Mode（模式）

**Mode** - 执行模式。8 个有效值：autopilot、ultrapilot、team、pipeline、ralph、ultrawork、ultraqa、swarm。

**Valid Modes** - 白名单模式集合。`['autopilot', 'ultrapilot', 'team', 'pipeline', 'ralph', 'ultrawork', 'ultraqa', 'swarm']`。

**Mode State** - 模式执行状态。存储于 `.omc/state/{mode}-state.json`，包含 active、current_phase、iteration 等字段。

**Exclusive Modes** - 互斥模式。autopilot、ultrapilot、swarm、pipeline 互斥，同时只能激活一个。

**Mode Stale** - 模式过期标记。1 小时未更新的模式状态标记为 stale（不同于 agent stale 的 5 分钟）。

---

## State（状态）

**State File** - 模式状态持久化文件。JSON 格式，存储于 `.omc/state/{mode}-state.json`。

**Session State** - 会话级状态。存储于 `.omc/state/sessions/{sessionId}/{mode}-state.json`，隔离并发会话。

**Atomic Write** - 原子写入。通过临时文件 + rename 保证写入原子性，防止并发损坏。

**State Manager** - 状态管理器。统一的读/写接口，强制路径安全校验（assertValidMode）。

**Stale Threshold** - 过期阈值。Agent stale：5 分钟（警告日志）；Mode stale：1 小时（标记过期）。

**Subagent Tracking** - Agent 生命周期追踪。`.omc/state/subagent-tracking.json`，记录活跃 agents、超时、孤儿检测。

---

## Tool（工具）

**Tool** - 可调用的功能单元。35 个自定义工具：LSP x12、AST x2、REPL x1、Notepad x6、State x5、Memory x4、Trace x2、Skills x3。

**LSP Tool** - 语言服务器协议工具。ultrapower:lsp_hover、ultrapower:lsp_goto_definition、ultrapower:lsp_find_references、ultrapower:lsp_diagnostics 等。

**AST Tool** - 抽象语法树工具。ast_grep_search（结构化代码搜索）、ast_grep_replace（结构化转换）。

**State Tool** - 状态管理工具。state_read、state_write、state_clear、state_list_active、state_get_status。

**Notepad Tool** - 会话记忆工具。notepad_read、notepad_write_priority、notepad_write_working、notepad_write_manual。

**MCP Tool** - 模型上下文协议工具。ask_codex（GPT-5.3）、ask_gemini（Gemini-3-pro）。

---

## 核心概念

**Delegation** - 委派。将工作路由到专业 agent 而非直接处理。多文件实现、复杂重构、架构决策必须委派。

**Model Routing** - 模型路由。任务复杂度 → 模型层级映射：Haiku（快速）→ Sonnet（标准）→ Opus（复杂）。

**Verification** - 验证。完成前收集证据（BUILD/TEST/LINT/TODO/ERROR_FREE），verifier 确认。

**Boulder State** - 岩石状态。Ralph/ultrawork 的持久化状态，"岩石永不停止"直到完成。

**Magic Keyword** - 魔法关键词。用户输入中的触发词，激活对应 skill 或 mode。

**Context Injection** - 上下文注入。在 hook 时注入 AGENTS.md、规则文件、Axiom 记忆。

**Path Traversal Guard** - 路径遍历防护。assertValidMode() 校验 mode 参数，防止 `../../etc/passwd` 攻击。

**Axiom System** - Axiom 系统。需求→PRD→实现→验证→知识演化的完整工作流引擎。

---

## 执行流程

**Team Pipeline** - Team 分阶段流水线：team-plan → team-prd → team-exec → team-verify → team-fix（循环）。

**Expert Gate** - 专家评审门禁。所有新功能需求必须通过 `/ax-draft` → `/ax-review` 流程。

**User Gate** - 用户确认门禁。PRD 生成完成后，显示确认提示，用户确认才能进入开发。

**CI Gate** - 编译提交门禁。代码修改完成后，必须执行 `tsc --noEmit && npm run build && npm test`，无错误才允许完成。

**Scope Gate** - 范围门禁。修改文件时检查是否在 manifest 定义的 Impact Scope 内，越界修改需用户确认。

---

## 反模式

**AP-S01** - 未校验 mode 参数直接拼接路径。路径遍历风险。正确做法：先调用 assertValidMode()。

**AP-ST01** - 混淆两种 stale 阈值。Agent stale（5分钟）vs Mode stale（1小时）。

**AP-ST02** - 跨会话误清理状态文件。必须检查 session_id 匹配后才能清理。

**AP-ST03** - 在 `~/.claude/` 中存储 OMC 状态。应存储在 worktree 根目录 `.omc/state/`。

**AP-AL02** - 混淆超时阈值。5 分钟（警告）vs 10 分钟（自动终止）。

**AP-MR01** - 同时激活互斥模式。autopilot、ultrapilot、swarm、pipeline 互斥。

**AP-MR02** - 使用不在白名单中的 mode。只能使用 VALID_MODES 中的 8 个值。

---

## 文件路径

**Worktree Root** - Git worktree 根目录。所有 OMC 状态存储于此，不在 `~/.claude/`。

**.omc/state/** - 模式状态目录。存储 `{mode}-state.json` 和 `sessions/{sessionId}/` 子目录。

**.omc/axiom/** - Axiom 系统目录。active_context.md、project_decisions.md、evolution/ 等。

**.omc/notepad.md** - 会话记忆文件。7 天自动清理的 working 部分 + 永久 manual 部分。

**.omc/project-memory.json** - 项目记忆。持久化的项目知识、架构决策、用户偏好。

