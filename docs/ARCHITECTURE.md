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

30 个专业化 agent，按复杂度层级组织：

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

状态文件遵循标准化路径：

**本地项目状态：**
- `.omc/state/{name}.json` - 会话状态（ultrapilot、swarm、pipeline）
- `.omc/notepads/{plan-name}/` - 计划范围的知识捕获

**全局状态：**
- `~/.omc/state/{name}.json` - 用户偏好和全局配置

旧版路径在读取时自动迁移。

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
