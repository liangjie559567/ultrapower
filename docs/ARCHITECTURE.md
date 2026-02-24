# 架构

> ultrapower 如何编排多智能体工作流。


## 概述

ultrapower 使 Claude Code 能够通过基于 skill 的路由系统编排专业化 agent。

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            ULTRAPOWER                                    │
│                     Intelligent Skill Activation                         │
└─────────────────────────────────────────────────────────────────────────┘

  User Input                      Skill Detection                 Execution
  ──────────                      ───────────────                 ─────────
       │                                │                              │
       ▼                                ▼                              ▼
┌─────────────┐              ┌──────────────────┐           ┌─────────────────┐
│  "ultrawork │              │   CLAUDE.md      │           │ SKILL ACTIVATED │
│   refactor  │─────────────▶│   Auto-Routing   │──────────▶│                 │
│   the API"  │              │                  │           │ ultrawork +     │
└─────────────┘              │ Task Type:       │           │ default +       │
                             │  - Implementation│           │ git-master      │
                             │  - Multi-file    │           │                 │
                             │  - Parallel OK   │           │ ┌─────────────┐ │
                             │                  │           │ │ Parallel    │ │
                             │ Skills:          │           │ │ agents      │ │
                             │  - ultrawork ✓   │           │ │ launched    │ │
                             │  - default ✓     │           │ └─────────────┘ │
                             │  - git-master ✓  │           │                 │
                             └──────────────────┘           │ ┌─────────────┐ │
                                                            │ │ Atomic      │ │
                                                            │ │ commits     │ │
                                                            │ └─────────────┘ │
                                                            └─────────────────┘
```

## 核心概念

### Skills

Skills 是**行为注入**，用于修改编排器的运行方式。我们不是替换 agent，而是通过可组合的 skill 注入能力：

- **Execution Skills**：主要任务处理器（`default`、`planner`、`orchestrate`）
- **Enhancement Skills**：附加能力（`ultrawork`、`git-master`、`frontend-ui-ux`）
- **Guarantee Skills**：完成保障（`ralph`）

Skills 可以叠加组合：
```
Task: "ultrawork: refactor API with proper commits"
Skills: ultrawork + default + git-master
```

### Agents

39 个专业化 agent，按复杂度层级组织：

| 层级 | 模型 | 适用场景 |
|------|-------|---------|
| LOW | Haiku | 快速查询、简单操作 |
| MEDIUM | Sonnet | 标准实现 |
| HIGH | Opus | 复杂推理、架构设计 |

完整 agent 列表请参见 [REFERENCE.md](./REFERENCE.md)。

### 委派

工作通过 Task 工具委派，并进行智能模型路由：

```typescript
Task(
  subagent_type="ultrapower:executor",
  model="sonnet",
  prompt="Implement feature..."
)
```

`visual-engineering` 和 `ultrabrain` 等类别会自动选择模型层级、温度和思考预算。

## Skill 组合

Skills 按层级组合：

```
┌─────────────────────────────────────────────────────────────┐
│  GUARANTEE LAYER（可选）                                      │
│  ralph: "Cannot stop until verified done"                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  ENHANCEMENT LAYER（0-N 个 skill）                            │
│  ultrawork (parallel) | git-master (commits) | frontend-ui-ux│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  EXECUTION LAYER（主 skill）                                  │
│  default (build) | orchestrate (coordinate) | planner (plan) │
└─────────────────────────────────────────────────────────────┘
```

**公式：** `[Execution Skill] + [0-N 个增强] + [可选保障]`

## 状态管理

状态文件遵循标准化路径，支持 7 种模式：

**支持的模式：** `autopilot`、`ultrapilot`、`team`、`pipeline`、`ralph`、`ultrawork`、`ultraqa`

**本地项目状态：**
- `.omc/state/{mode}-state.json` - 会话状态
- `.omc/state/sessions/{sessionId}/` - 会话范围状态
- `.omc/notepads/{plan-name}/` - 计划范围的知识捕获

**全局状态：**
- `~/.omc/state/{name}.json` - 用户偏好和全局配置

旧版路径在读取时自动迁移。

## MCP 集成

ultrapower 包含 4 个 MCP 服务器：

| 服务器 | 模型 | 用途 |
|--------|------|------|
| `codex-server` | gpt-5.3-codex | 代码分析、规划验证、代码审查 |
| `gemini-server` | gemini-3-pro-preview | 大上下文任务（1M tokens）、UI/UX 设计审查 |
| `mcp-server` | - | 通用 MCP 工具服务 |
| `team-bridge` | - | 团队协调桥接 |

调用方式：`mcp__plugin_smart-dev-flow_x__ask_codex`（Codex）、`mcp__plugin_smart-dev-flow_g__ask_gemini`（Gemini）。

## Superpowers × ultrapower 集成

ultrapower v5.0.0 深度集成了 superpowers skill 体系，通过 `next-step-router` 在关键节点串联工作流。

### next-step-router

`next-step-router` 是一个路由层 skill，在每个 superpowers skill 完成后被调用，分析产出内容并用 `AskUserQuestion` 向用户推荐最优下一步。

```
Skill 完成
    │
    ▼
next-step-router
    │  分析 current_skill + stage + output_summary
    ▼
AskUserQuestion（最多4个选项，带置信度）
    │
    ▼
用户选择 → 下一个 skill/agent 启动
```

### 路由阶段映射

| 阶段 | 触发 Skill | 典型下一步 |
|------|-----------|-----------|
| 0 | using-superpowers（新功能检测） | brainstorming |
| 1 | brainstorming（设计批准） | writing-plans |
| 2 | writing-plans（计划提交） | using-git-worktrees |
| 3 | using-git-worktrees（worktree 就绪） | executing-plans / subagent-driven-development |
| 4 | executing-plans / subagent-driven-development（批次完成） | verification-before-completion |
| 5 | systematic-debugging（根因确认） | test-driven-development |
| 6 | test-driven-development（绿灯完成） | requesting-code-review |
| 7 | requesting-code-review / receiving-code-review（审查完成） | finishing-a-development-branch |
| 8 | finishing-a-development-branch（合并策略确认） | release |

### 上下文持久化

跨 skill 的上下文通过 notepad 持久化：

```
notepad_write_working("full_context", {
  current_skill, stage, output_summary,
  history: [...previous stages]
})
```

每次 next-step-router 调用时读取并追加，确保完整上下文在整个工作流中传递。

### 集成的 Skills

以下 18 个 superpowers skills 末尾均包含 `## 路由触发` 块：

`writing-plans`、`using-git-worktrees`、`subagent-driven-development`、`executing-plans`、`dispatching-parallel-agents`、`systematic-debugging`、`test-driven-development`、`requesting-code-review`、`receiving-code-review`、`verification-before-completion`、`finishing-a-development-branch`、`writing-skills`、`deepinit`、`sciomc`、`external-context`、`frontend-ui-ux`、`release`

---

## Hooks

ultrapower 在 `src/hooks/` 中包含 34 个 hook，用于生命周期事件：

| 事件 | 用途 |
|-------|---------|
| `UserPromptSubmit` | 关键词检测、模式激活 |
| `Stop` | 续行强制、会话结束 |
| `PreToolUse` | 权限验证 |
| `PostToolUse` | 错误恢复、规则注入 |

完整 hook 列表请参见 [REFERENCE.md](./REFERENCE.md)。

## 验证协议

验证模块通过证据确保工作完成：

**标准检查项：**
- BUILD：编译通过
- TEST：所有测试通过
- LINT：无 lint 错误
- FUNCTIONALITY：功能按预期运行
- ARCHITECT：Opus 层级审查通过
- TODO：所有任务已完成
- ERROR_FREE：无未解决的错误

证据必须是新鲜的（5 分钟内），并包含实际命令输出。

## 更多详情

- **完整参考**：参见 [REFERENCE.md](./REFERENCE.md)
- **内部 API**：参见 [FEATURES.md](./FEATURES.md)
- **用户指南**：参见 [README.md](../README.md)
- **Skills 参考**：参见项目中的 CLAUDE.md
