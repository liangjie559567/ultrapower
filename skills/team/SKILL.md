---
name: team
description: N 个协调 agent 使用 Claude Code 原生 team 工具共享任务列表
---

# Team Skill

使用 Claude Code 原生 team 工具，生成 N 个协调 agent 共同处理共享任务列表。替代旧版 `/swarm` skill（基于 SQLite），使用内置 team 管理、agent 间消息传递和任务依赖——无需外部依赖。

## 用法

```
/ultrapower:team N:agent-type "task description"
/ultrapower:team "task description"
/ultrapower:team ralph "task description"
```

### 参数

- **N** - 队友 agent 数量（1-20）。可选；默认根据任务分解自动调整大小。
- **agent-type** - 在 `team-exec` 阶段生成的 OMC agent（如 executor、build-fixer、designer）。可选；默认使用阶段感知路由（见下方阶段 Agent 路由）。
- **task** - 要在队友间分解和分配的高级任务
- **ralph** - 可选修饰符。存在时，将 team pipeline 包装在 Ralph 的持久化循环中（失败时重试，完成前进行 architect 验证）。见下方 Team + Ralph 组合。

### 示例

```bash
/team 5:executor "fix all TypeScript errors across the project"
/team 3:build-fixer "fix build errors in src/"
/team 4:designer "implement responsive layouts for all page components"
/team "refactor the auth module with security review"
/team ralph "build a complete REST API for user management"
```

## 架构

```
User: "/team 3:executor fix all TypeScript errors"
              |
              v
      [TEAM ORCHESTRATOR (Lead)]
              |
              +-- TeamCreate("fix-ts-errors")
              |       -> lead becomes team-lead@fix-ts-errors
              |
              +-- Analyze & decompose task into subtasks
              |       -> explore/architect produces subtask list
              |
              +-- TaskCreate x N (one per subtask)
              |       -> tasks #1, #2, #3 with dependencies
              |
              +-- TaskUpdate x N (pre-assign owners)
              |       -> task #1 owner=worker-1, etc.
              |
              +-- Task(team_name="fix-ts-errors", name="worker-1") x 3
              |       -> spawns teammates into the team
              |
              +-- Monitor loop
              |       <- SendMessage from teammates (auto-delivered)
              |       -> TaskList polling for progress
              |       -> SendMessage to unblock/coordinate
              |
              +-- Completion
                      -> SendMessage(shutdown_request) to each teammate
                      <- SendMessage(shutdown_response, approve: true)
                      -> TeamDelete("fix-ts-errors")
                      -> rm .omc/state/team-state.json
```

**存储布局（由 Claude Code 管理）：**
```
~/.claude/
  teams/fix-ts-errors/
    config.json          # Team 元数据 + 成员数组
  tasks/fix-ts-errors/
    .lock                # 并发访问文件锁
    1.json               # 子任务 #1
    2.json               # 子任务 #2（可能为内部任务）
    3.json               # 子任务 #3
    ...
```

## 分阶段 Pipeline（标准 Team 运行时）

Team 执行遵循分阶段 pipeline：

`team-plan -> team-prd -> team-exec -> team-verify -> team-fix (循环)`

### 阶段 Agent 路由

每个 pipeline 阶段使用**专业 agent**——而非仅使用 executor。Lead 根据阶段和任务特征选择 agent。

| 阶段 | 必需 Agent | 可选 Agent | 选择标准 |
|-------|----------------|-----------------|-------------------|
| **team-plan** | `explore` (haiku)、`planner` (opus) | `analyst` (opus)、`architect` (opus) | 需求不明确时使用 `analyst`。系统边界复杂时使用 `architect`。 |
| **team-prd** | `analyst` (opus) | `product-manager` (sonnet)、`critic` (opus) | 面向用户功能时使用 `product-manager`。需要挑战范围时使用 `critic`。 |
| **team-exec** | `executor` (sonnet) | `deep-executor` (opus)、`build-fixer` (sonnet)、`designer` (sonnet)、`writer` (haiku)、`test-engineer` (sonnet) | 根据子任务类型匹配 agent。复杂自主工作用 `deep-executor`，UI 用 `designer`，编译问题用 `build-fixer`，文档用 `writer`，测试创建用 `test-engineer`。 |
| **team-verify** | `verifier` (sonnet) | `test-engineer` (sonnet)、`security-reviewer` (sonnet)、`code-reviewer` (opus)、`quality-reviewer` (sonnet)、`performance-reviewer` (sonnet) | 始终运行 `verifier`。auth/crypto 变更时添加 `security-reviewer`。超过 20 个文件或架构变更时添加 `code-reviewer`。延迟敏感代码时添加 `performance-reviewer`。 |
| **team-fix** | `executor` (sonnet) | `build-fixer` (sonnet)、`debugger` (sonnet)、`deep-executor` (opus) | 类型/构建错误用 `build-fixer`。回归隔离用 `debugger`。复杂多文件修复用 `deep-executor`。 |

**路由规则：**

1. **Lead 按阶段选择 agent，而非用户。** 用户的 `N:agent-type` 参数仅覆盖 `team-exec` 阶段的 worker 类型。所有其他阶段使用阶段适配的专业 agent。
2. **MCP provider 补充 Claude agent。** 分析/审查路由到 Codex（`ask_codex`），UI/大上下文工作路由到 Gemini（`ask_gemini`）（如可用）。MCP worker 是一次性的，不参与 team 通信。
3. **成本模式影响模型层级。** 降级时：`opus` agent 降为 `sonnet`，`sonnet` 降为 `haiku`（质量允许时）。`team-verify` 始终至少使用 `sonnet`。
4. **风险级别升级审查。** 安全敏感或超过 20 个文件的变更必须在 `team-verify` 中包含 `security-reviewer` + `code-reviewer` (opus)。

### 阶段进入/退出标准

- **team-plan**
  - 进入：Team 调用已解析，编排开始。
  - Agent：`explore` 扫描代码库，`planner` 创建任务图，复杂任务可选 `analyst`/`architect`。
  - 退出：分解完成，可运行的任务图已准备好。
- **team-prd**
  - 进入：范围模糊或缺少验收标准。
  - Agent：`analyst` 提取需求，可选 `product-manager`/`critic`。
  - 退出：验收标准和边界已明确。
- **team-exec**
  - 进入：`TeamCreate`、`TaskCreate`、分配和 worker 生成完成。
  - Agent：根据子任务类型生成适当专业类型的 worker（见路由表）。
  - 退出：当前轮次的执行任务达到终态。
- **team-verify**
  - 进入：执行轮次完成。
  - Agent：`verifier` + 任务适配的审查者（见路由表）。
  - 退出（通过）：验证门控通过，无需后续跟进。
  - 退出（失败）：生成修复任务，控制权转移到 `team-fix`。
- **team-fix**
  - 进入：验证发现缺陷/回归/未完成标准。
  - Agent：根据缺陷类型使用 `executor`/`build-fixer`/`debugger`。
  - 退出：修复完成，流程返回 `team-exec` 然后 `team-verify`。

### 验证/修复循环和停止条件

继续 `team-exec -> team-verify -> team-fix` 直到：
1. 验证通过且无需修复任务，或
2. 工作达到明确的终态阻塞/失败结果并有证据。

`team-fix` 受最大尝试次数限制。如果修复尝试超过配置限制，转为终态 `failed`（无无限循环）。

### 恢复和取消语义

- **恢复：** 使用分阶段状态 + 实时任务状态从最后一个非终态阶段重启。
- **取消：** `/ultrapower:cancel` 请求队友关闭，等待响应（尽力而为），将阶段标记为 `cancelled`（`active=false`），捕获取消元数据，然后根据策略删除 team 资源并清除/保留 Team 状态。
- 终态为 `complete`、`failed` 和 `cancelled`。

## 工作流

### 阶段 1：解析输入

- 提取 **N**（agent 数量），验证 1-20
- 提取 **agent-type**，验证其映射到已知 OMC subagent
- 提取**任务**描述

### 阶段 2：分析与分解

使用 `explore` 或 `architect`（通过 MCP 或 agent）分析代码库并将任务分解为 N 个子任务：

- 每个子任务应**文件范围**或**模块范围**以避免冲突
- 子任务必须独立或有明确的依赖顺序
- 每个子任务需要简洁的 `subject` 和详细的 `description`
- 识别子任务间的依赖关系（如"共享类型必须在消费者之前修复"）

### 阶段 3：创建 Team

使用从任务派生的 slug 调用 `TeamCreate`：

```json
{
  "team_name": "fix-ts-errors",
  "description": "Fix all TypeScript errors across the project"
}
```

**响应：**
```json
{
  "team_name": "fix-ts-errors",
  "team_file_path": "~/.claude/teams/fix-ts-errors/config.json",
  "lead_agent_id": "team-lead@fix-ts-errors"
}
```

当前 session 成为 team lead（`team-lead@fix-ts-errors`）。

使用 `state_write` MCP 工具写入 OMC 状态以实现正确的 session 范围持久化：

```
state_write(mode="team", active=true, current_phase="team-plan", state={
  "team_name": "fix-ts-errors",
  "agent_count": 3,
  "agent_types": "executor",
  "task": "fix all TypeScript errors",
  "fix_loop_count": 0,
  "max_fix_loops": 3,
  "linked_ralph": false,
  "stage_history": "team-plan"
})
```

> **注意：** MCP `state_write` 工具将所有值作为字符串传输。读取状态时，消费者必须将 `agent_count`、`fix_loop_count`、`max_fix_loops` 强制转换为数字，将 `linked_ralph` 强制转换为布尔值。

**状态 schema 字段：**

| 字段 | 类型 | 描述 |
|-------|------|-------------|
| `active` | boolean | Team 模式是否激活 |
| `current_phase` | string | 当前 pipeline 阶段：`team-plan`、`team-prd`、`team-exec`、`team-verify`、`team-fix` |
| `team_name` | string | Team 的 slug 名称 |
| `agent_count` | number | Worker agent 数量 |
| `agent_types` | string | team-exec 中使用的 agent 类型（逗号分隔） |
| `task` | string | 原始任务描述 |
| `fix_loop_count` | number | 当前修复迭代次数 |
| `max_fix_loops` | number | 失败前的最大修复迭代次数（默认：3） |
| `linked_ralph` | boolean | Team 是否链接到 ralph 持久化循环 |
| `stage_history` | string | 带时间戳的阶段转换列表（逗号分隔） |

**每次阶段转换时更新状态：**

```
state_write(mode="team", current_phase="team-exec", state={
  "stage_history": "team-plan:2026-02-07T12:00:00Z,team-prd:2026-02-07T12:01:00Z,team-exec:2026-02-07T12:02:00Z"
})
```

**读取状态以检测恢复：**

```
state_read(mode="team")
```

如果 `active=true` 且 `current_phase` 为非终态，从最后一个未完成阶段恢复，而非创建新 team。

### 阶段 4：创建任务

为每个子任务调用 `TaskCreate`。使用 `TaskUpdate` 的 `addBlockedBy` 设置依赖关系。

```json
// TaskCreate for subtask 1
{
  "subject": "Fix type errors in src/auth/",
  "description": "Fix all TypeScript errors in src/auth/login.ts, src/auth/session.ts, and src/auth/types.ts. Run tsc --noEmit to verify.",
  "activeForm": "Fixing auth type errors"
}
```

**响应存储任务文件（如 `1.json`）：**
```json
{
  "id": "1",
  "subject": "Fix type errors in src/auth/",
  "description": "Fix all TypeScript errors in src/auth/login.ts...",
  "activeForm": "Fixing auth type errors",
  "owner": "",
  "status": "pending",
  "blocks": [],
  "blockedBy": []
}
```

对于有依赖关系的任务，创建后使用 `TaskUpdate`：

```json
// Task #3 depends on task #1 (shared types must be fixed first)
{
  "taskId": "3",
  "addBlockedBy": ["1"]
}
```

**从 lead 预分配所有者**以避免竞态条件（没有原子性认领）：

```json
// Assign task #1 to worker-1
{
  "taskId": "1",
  "owner": "worker-1"
}
```

### 阶段 5：生成队友

使用带 `team_name` 和 `name` 参数的 `Task` 生成 N 个队友。每个队友获得 team worker preamble（见下文）加上其具体分配。

```json
{
  "subagent_type": "ultrapower:executor",
  "team_name": "fix-ts-errors",
  "name": "worker-1",
  "prompt": "<worker-preamble + assigned tasks>"
}
```

**响应：**
```json
{
  "agent_id": "worker-1@fix-ts-errors",
  "name": "worker-1",
  "team_name": "fix-ts-errors"
}
```

**副作用：**
- 队友添加到 `config.json` 成员数组
- 自动创建**内部任务**（带 `metadata._internal: true`）跟踪 agent 生命周期
- 内部任务出现在 `TaskList` 输出中——计算真实任务时需过滤

**重要：** 并行生成所有队友（它们是后台 agent）。不要等一个完成再生成下一个。

### 阶段 6：监控

Lead 编排者通过两个渠道监控进度：

1. **入站消息** -- 队友完成任务或需要帮助时向 `team-lead` 发送 `SendMessage`。这些消息作为新对话轮次自动到达（无需轮询）。

2. **TaskList 轮询** -- 定期调用 `TaskList` 检查整体进度：
   ```
   #1 [completed] Fix type errors in src/auth/ (worker-1)
   #3 [in_progress] Fix type errors in src/api/ (worker-2)
   #5 [pending] Fix type errors in src/utils/ (worker-3)
   ```
   格式：`#ID [status] subject (owner)`

**Lead 可采取的协调行动：**

- **解除队友阻塞：** 发送带指导或缺失上下文的 `message`
- **重新分配工作：** 如果队友提前完成，使用 `TaskUpdate` 将待处理任务分配给他们并通过 `SendMessage` 通知
- **处理失败：** 如果队友报告失败，重新分配任务或生成替代者

#### 任务看门狗策略

监控卡住或失败的队友：

- **最大进行中时长**：如果任务在没有消息的情况下保持 `in_progress` 超过 5 分钟，发送状态检查
- **疑似死亡 worker**：无消息 + 任务卡住超过 10 分钟 → 将任务重新分配给另一个 worker
- **重新分配阈值**：如果 worker 失败 2 个以上任务，停止向其分配新任务

### 阶段 6.5：阶段转换（状态持久化）

每次阶段转换时更新 OMC 状态：

```
// Entering team-exec after planning
state_write(mode="team", current_phase="team-exec", state={
  "stage_history": "team-plan:T1,team-prd:T2,team-exec:T3"
})

// Entering team-verify after execution
state_write(mode="team", current_phase="team-verify")

// Entering team-fix after verify failure
state_write(mode="team", current_phase="team-fix", state={
  "fix_loop_count": 1
})
```

这实现了：
- **恢复**：如果 lead 崩溃，`state_read(mode="team")` 显示最后阶段和 team 名称以供恢复
- **取消**：cancel skill 读取 `current_phase` 以了解需要什么清理
- **Ralph 集成**：Ralph 可以读取 team 状态以了解 pipeline 是否完成或失败

### 阶段 7：完成

当所有真实任务（非内部）完成或失败时：

1. **验证结果** -- 通过 `TaskList` 检查所有子任务是否标记为 `completed`
2. **关闭队友** -- 向每个活跃队友发送 `shutdown_request`：
   ```json
   {
     "type": "shutdown_request",
     "recipient": "worker-1",
     "content": "All work complete, shutting down team"
   }
   ```
3. **等待响应** -- 每个队友以 `shutdown_response(approve: true)` 响应并终止
4. **删除 team** -- 调用 `TeamDelete` 清理：
   ```json
   { "team_name": "fix-ts-errors" }
   ```
   响应：
   ```json
   {
     "success": true,
     "message": "Cleaned up directories and worktrees for team \"fix-ts-errors\"",
     "team_name": "fix-ts-errors"
   }
   ```
5. **清理 OMC 状态** -- 删除 `.omc/state/team-state.json`
6. **报告摘要** -- 向用户展示结果

## Agent Preamble

生成队友时，在 prompt 中包含此 preamble 以建立工作协议。根据每个队友的具体任务分配进行调整。

```
You are a TEAM WORKER in team "{team_name}". Your name is "{worker_name}".
You report to the team lead ("team-lead").

== WORK PROTOCOL ==

1. CLAIM: Call TaskList to see your assigned tasks (owner = "{worker_name}").
   Pick the first task with status "pending" that is assigned to you.
   Call TaskUpdate to set status "in_progress":
   {"taskId": "ID", "status": "in_progress", "owner": "{worker_name}"}

2. WORK: Execute the task using your tools (Read, Write, Edit, Bash).
   Do NOT spawn sub-agents. Do NOT delegate. Work directly.

3. COMPLETE: When done, mark the task completed:
   {"taskId": "ID", "status": "completed"}

4. REPORT: Notify the lead via SendMessage:
   {"type": "message", "recipient": "team-lead", "content": "Completed task #ID: <summary of what was done>", "summary": "Task #ID complete"}

5. NEXT: Check TaskList for more assigned tasks. If you have more pending tasks, go to step 1.
   If no more tasks are assigned to you, notify the lead:
   {"type": "message", "recipient": "team-lead", "content": "All assigned tasks complete. Standing by.", "summary": "All tasks done, standing by"}

6. SHUTDOWN: When you receive a shutdown_request, respond with:
   {"type": "shutdown_response", "request_id": "<from the request>", "approve": true}

== BLOCKED TASKS ==
If a task has blockedBy dependencies, skip it until those tasks are completed.
Check TaskList periodically to see if blockers have been resolved.

== ERRORS ==
If you cannot complete a task, report the failure to the lead:
{"type": "message", "recipient": "team-lead", "content": "FAILED task #ID: <reason>", "summary": "Task #ID failed"}
Do NOT mark the task as completed. Leave it in_progress so the lead can reassign.

== RULES ==
- NEVER spawn sub-agents or use the Task tool
- ALWAYS use absolute file paths
- ALWAYS report progress via SendMessage to "team-lead"
- Use SendMessage with type "message" only -- never "broadcast"
```

## 通信模式

### 队友到 Lead（任务完成报告）

```json
{
  "type": "message",
  "recipient": "team-lead",
  "content": "Completed task #1: Fixed 3 type errors in src/auth/login.ts and 2 in src/auth/session.ts. All files pass tsc --noEmit.",
  "summary": "Task #1 complete"
}
```

### Lead 到队友（重新分配或指导）

```json
{
  "type": "message",
  "recipient": "worker-2",
  "content": "Task #3 is now unblocked. Also pick up task #5 which was originally assigned to worker-1.",
  "summary": "New task assignment"
}
```

### 广播（谨慎使用——发送 N 条独立消息）

```json
{
  "type": "broadcast",
  "content": "STOP: shared types in src/types/index.ts have changed. Pull latest before continuing.",
  "summary": "Shared types changed"
}
```

### 关闭协议

**Lead 发送：**
```json
{
  "type": "shutdown_request",
  "recipient": "worker-1",
  "content": "All work complete, shutting down team"
}
```

**队友接收并响应：**
```json
{
  "type": "shutdown_response",
  "request_id": "shutdown-1770428632375@worker-1",
  "approve": true
}
```

批准后：
- 队友进程终止
- 队友自动从 `config.json` 成员数组中移除
- 该队友的内部任务完成

**重要：** `request_id` 在队友收到的 shutdown request 消息中提供。队友必须提取并传回。不要伪造 request ID。

## MCP Worker（混合角色）

Team skill 支持**混合执行**，将 Claude agent 队友与外部 MCP worker（Codex 和 Gemini CLI）结合。两种类型都可以修改代码——区别在于能力和成本。

### 执行模式

任务在分解期间被标记执行模式：

| 执行模式 | Provider | 能力 |
|---------------|----------|-------------|
| `claude_worker` | Claude agent | 完整 Claude Code 工具访问（Read/Write/Edit/Bash/Task）。最适合需要 Claude 推理 + 迭代工具使用的任务。 |
| `mcp_codex` | Codex CLI（`ask_codex`） | 在 working_directory 中完整文件系统访问。自主运行。最适合代码审查、安全分析、重构、架构。 |
| `mcp_gemini` | Gemini CLI（`ask_gemini`） | 完整文件系统访问 + 1M token 上下文。自主运行。最适合 UI/前端工作、大规模变更、文档。 |

### MCP Worker 如何运行

Codex 和 Gemini CLI 以完全自动模式运行，具有文件系统访问权限。它们是**自主执行者**，而非仅仅是分析者：

1. Lead 将任务指令写入 `prompt_file`
2. Lead 调用 `ask_codex` 或 `ask_gemini`，将 `working_directory` 设置为项目根目录
3. CLI 读取文件、进行更改、运行命令——全部在工作目录内
4. 结果/摘要写入 `output_file`
5. Lead 读取输出，将任务标记为完成，并将结果传递给依赖任务

**与 Claude 队友的关键区别：**
- MCP worker 通过 CLI 运行，而非 Claude Code 的工具系统
- 它们无法使用 TaskList/TaskUpdate/SendMessage（无 team 感知）
- 它们作为一次性自主任务运行，而非持久队友
- Lead 管理其生命周期（生成、监控、收集结果）

### 路由决策

| 任务类型 | 最佳路由 | 原因 |
|-----------|-----------|-----|
| 迭代多步骤工作 | Claude 队友 | 需要工具介导的迭代 + team 通信 |
| 代码审查/安全审计 | Codex MCP | 专业化，比 Claude opus 更便宜 |
| 架构分析/规划 | Codex MCP | 外部视角，强分析推理 |
| 重构（范围明确） | Codex MCP | 自主执行，擅长结构化转换 |
| UI/前端实现 | Gemini MCP | 1M 上下文窗口，设计专长，可编辑多文件 |
| 大规模文档 | Gemini MCP | 写作专长 + 大上下文保持一致性 |
| 视觉/图像分析 | Gemini MCP | 多模态能力 |
| 构建/测试迭代循环 | Claude 队友 | 需要 Bash 工具 + 迭代修复周期 |
| 需要 team 协调的任务 | Claude 队友 | 需要 SendMessage 进行状态更新 |

### 示例：带 MCP 执行者的混合 Team

```
/team 3:executor "refactor auth module with security review"

Task decomposition:
#1 [mcp_codex] Security review of current auth code -> output to .omc/research/auth-security.md
#2 [mcp_codex] Refactor auth/login.ts and auth/session.ts (uses #1 findings)
#3 [mcp_gemini] Redesign auth UI components (login form, session indicator)
#4 [claude_worker] Update auth tests + fix integration issues
#5 [mcp_codex] Final code review of all changes
```

Lead 运行 #1（Codex 分析），然后并行运行 #2 和 #3（Codex 重构后端，Gemini 重新设计前端），然后 #4（Claude 队友处理测试迭代），然后 #5（最终 Codex 审查）。

### MCP 预飞行分析（可选）

对于大型模糊任务，在创建 team 前运行分析：

1. 调用 `ToolSearch("mcp")` 发现延迟加载的 MCP 工具（首次使用前必须）
2. 使用任务描述 + 代码库上下文调用 `ask_codex`（planner 角色）
3. 使用分析结果产生更好的任务分解
4. 使用丰富上下文创建 team 和任务

如果 ToolSearch 未找到 MCP 工具，跳过 MCP 预飞行，改用 Claude agent。

这在任务范围不明确且在提交特定分解前受益于外部推理时特别有用。

## 监控增强：Outbox 自动摄取

Lead 可以使用 outbox reader 工具主动摄取来自 MCP worker 的 outbox 消息，实现事件驱动监控，而无需完全依赖 `SendMessage` 传递。

### Outbox Reader 函数

**`readNewOutboxMessages(teamName, workerName)`** -- 使用字节偏移游标读取单个 worker 的新 outbox 消息。每次调用推进游标，因此后续调用只返回上次读取后写入的消息。镜像 `readNewInboxMessages()` 的 inbox 游标模式。

**`readAllTeamOutboxMessages(teamName)`** -- 读取 team 中**所有** worker 的新 outbox 消息。返回 `{ workerName, messages }` 条目数组，跳过无新消息的 worker。适用于监控循环中的批量轮询。

**`resetOutboxCursor(teamName, workerName)`** -- 将 worker 的 outbox 游标重置回字节 0。在 lead 重启后重新读取历史消息或调试时有用。

### 在监控阶段使用 `getTeamStatus()`

`getTeamStatus(teamName, workingDirectory, heartbeatMaxAgeMs?)` 函数提供统一快照，包含：

- **Worker 注册** -- 哪些 MCP worker 已注册（来自 shadow registry / config.json）
- **心跳新鲜度** -- 每个 worker 是否基于心跳年龄存活
- **任务进度** -- 每个 worker 和 team 范围的任务计数（pending、in_progress、completed）
- **当前任务** -- 每个 worker 正在执行哪个任务
- **最近 outbox 消息** -- 上次状态检查后的新消息

监控循环中的示例用法：

```typescript
const status = getTeamStatus('fix-ts-errors', workingDirectory);

for (const worker of status.workers) {
  if (!worker.isAlive) {
    // Worker is dead -- reassign its in-progress tasks
  }
  for (const msg of worker.recentMessages) {
    if (msg.type === 'task_complete') {
      // Mark task complete, unblock dependents
    } else if (msg.type === 'task_failed') {
      // Handle failure, possibly retry or reassign
    } else if (msg.type === 'error') {
      // Log error, check if worker needs intervention
    }
  }
}

if (status.taskSummary.pending === 0 && status.taskSummary.inProgress === 0) {
  // All work done -- proceed to shutdown
}
```

### 来自 Outbox 消息的事件驱动行动

| 消息类型 | 行动 |
|-------------|--------|
| `task_complete` | 将任务标记为完成，检查被阻塞任务是否已解除，通知依赖 worker |
| `task_failed` | 增加失败计数，决定重试 vs 重新分配 vs 跳过 |
| `idle` | Worker 无分配任务——分配待处理工作或开始关闭 |
| `error` | 记录错误，检查心跳中的 `consecutiveErrors` 以确定隔离阈值 |
| `shutdown_ack` | Worker 确认关闭——可安全从 team 中移除 |
| `heartbeat` | 更新存活跟踪（与心跳文件冗余，但对延迟监控有用） |

此方法通过提供基于拉取的机制补充现有的基于 `SendMessage` 的通信，适用于无法使用 Claude Code team 消息工具的 MCP worker。

## 错误处理

### 队友任务失败

1. 队友向 lead 发送 `SendMessage` 报告失败
2. Lead 决定：重试（将同一任务重新分配给相同或不同 worker）或跳过
3. 重新分配：`TaskUpdate` 设置新所有者，然后 `SendMessage` 通知新所有者

### 队友卡住（无消息）

1. Lead 通过 `TaskList` 检测——任务在 `in_progress` 中卡住太久
2. Lead 向队友发送 `SendMessage` 询问状态
3. 如无响应，认为队友已死亡
4. 通过 `TaskUpdate` 将任务重新分配给另一个 worker

### 依赖阻塞

1. 如果阻塞任务失败，lead 必须决定是否：
   - 重试阻塞者
   - 移除依赖关系（`TaskUpdate` 修改 blockedBy）
   - 完全跳过被阻塞任务
2. 通过 `SendMessage` 将决定传达给受影响的队友

### 队友崩溃

1. 该队友的内部任务将显示意外状态
2. 队友从 `config.json` 成员中消失
3. Lead 将孤立任务重新分配给剩余 worker
4. 如需要，使用 `Task(team_name, name)` 生成替代队友

## Team + Ralph 组合

当用户调用 `/team ralph`、说"team ralph"或同时使用两个关键词时，team 模式将自身包装在 Ralph 的持久化循环中。这提供：

- **Team 编排** -- 每个阶段使用专业 agent 的多 agent 分阶段 pipeline
- **Ralph 持久化** -- 失败时重试，完成前进行 architect 验证，迭代跟踪

### 激活

Team+Ralph 在以下情况激活：
1. 用户调用 `/team ralph "task"` 或 `/ultrapower:team ralph "task"`
2. 关键词检测器在 prompt 中同时找到 `team` 和 `ralph`
3. Hook 在 team 上下文旁检测到 `MAGIC KEYWORD: RALPH`

### 状态链接

两种模式都写入各自的状态文件并相互引用：

```
// Team state (via state_write)
state_write(mode="team", active=true, current_phase="team-plan", state={
  "team_name": "build-rest-api",
  "linked_ralph": true,
  "task": "build a complete REST API"
})

// Ralph state (via state_write)
state_write(mode="ralph", active=true, iteration=1, max_iterations=10, current_phase="execution", state={
  "linked_team": true,
  "team_name": "build-rest-api"
})
```

### 执行流程

1. Ralph 外层循环启动（迭代 1）
2. Team pipeline 运行：`team-plan -> team-prd -> team-exec -> team-verify`
3. 如果 `team-verify` 通过：Ralph 运行 architect 验证（最低 STANDARD 层级）
4. 如果 architect 批准：两种模式完成，运行 `/ultrapower:cancel`
5. 如果 `team-verify` 失败或 architect 拒绝：team 进入 `team-fix`，然后循环回 `team-exec -> team-verify`
6. 如果修复循环超过 `max_fix_loops`：Ralph 增加迭代次数并重试完整 pipeline
7. 如果 Ralph 超过 `max_iterations`：终态 `failed`

### 取消

取消任一模式都会取消两者：
- **取消 Ralph（已链接）：** 先取消 Team（优雅关闭），然后清除 Ralph 状态
- **取消 Team（已链接）：** 清除 Team，将 Ralph 迭代标记为已取消，停止循环

详见下方取消部分。

## 幂等恢复

如果 lead 在运行中途崩溃，team skill 应检测现有状态并恢复：

1. 检查 `~/.claude/teams/` 中与任务 slug 匹配的 team
2. 如果找到，读取 `config.json` 发现活跃成员
3. 恢复监控模式而非创建重复 team
4. 调用 `TaskList` 确定当前进度
5. 从监控阶段继续

这防止重复 team 并允许从 lead 失败中优雅恢复。

## 对比：Team vs 旧版 Swarm

| 方面 | Team（原生） | Swarm（旧版 SQLite） |
|--------|--------------|----------------------|
| **存储** | `~/.claude/teams/` 和 `~/.claude/tasks/` 中的 JSON 文件 | `.omc/state/swarm.db` 中的 SQLite |
| **依赖** | 不需要 `better-sqlite3` | 需要 `better-sqlite3` npm 包 |
| **任务认领** | `TaskUpdate(owner + in_progress)` -- lead 预分配 | SQLite IMMEDIATE 事务——原子性 |
| **竞态条件** | 如果两个 agent 认领同一任务可能发生（通过预分配缓解） | 无（SQLite 事务） |
| **通信** | `SendMessage`（DM、广播、关闭） | 无（即发即忘 agent） |
| **任务依赖** | 内置 `blocks` / `blockedBy` 数组 | 不支持 |
| **心跳** | Claude Code 自动发送空闲通知 | 手动心跳表 + 轮询 |
| **关闭** | 优雅请求/响应协议 | 基于信号的终止 |
| **Agent 生命周期** | 通过内部任务 + config 成员自动跟踪 | 通过心跳表手动跟踪 |
| **进度可见性** | `TaskList` 显示带所有者的实时状态 | 对任务表的 SQL 查询 |
| **冲突预防** | 所有者字段（lead 分配） | 带超时的基于租约的认领 |
| **崩溃恢复** | Lead 通过缺失消息检测，重新分配 | 5 分钟租约超时后自动释放 |
| **状态清理** | `TeamDelete` 删除所有内容 | 手动 `rm` SQLite 数据库 |

**何时使用 Team 而非 Swarm：** 新工作始终优先使用 `/team`。它使用 Claude Code 内置基础设施，无需外部依赖，支持 agent 间通信，并具有任务依赖管理。

## 取消

`/ultrapower:cancel` skill 处理 team 清理：

1. 通过 `state_read(mode="team")` 读取 team 状态以获取 `team_name` 和 `linked_ralph`
2. 向所有活跃队友（来自 `config.json` 成员）发送 `shutdown_request`
3. 等待每个成员的 `shutdown_response`（每个成员 15 秒超时）
4. 调用 `TeamDelete` 删除 team 和任务目录
5. 通过 `state_clear(mode="team")` 清除状态
6. 如果 `linked_ralph` 为 true，同时清除 ralph：`state_clear(mode="ralph")`

### 链接模式取消（Team + Ralph）

当 team 链接到 ralph 时，取消遵循依赖顺序：

- **从 Ralph 上下文触发取消：** 先取消 Team（优雅关闭所有队友），然后清除 Ralph 状态。这确保在持久化循环退出前停止 worker。
- **从 Team 上下文触发取消：** 清除 Team 状态，然后将 Ralph 标记为已取消。Ralph 的 stop hook 将检测缺失的 team 并停止迭代。
- **强制取消（`--force`）：** 通过 `state_clear` 无条件清除 `team` 和 `ralph` 状态。

如果队友无响应，`TeamDelete` 可能失败。在这种情况下，cancel skill 应短暂等待并重试，或通知用户手动清理 `~/.claude/teams/{team_name}/` 和 `~/.claude/tasks/{team_name}/`。

## 配置

通过 `.omc-config.json` 的可选设置：

```json
{
  "team": {
    "maxAgents": 20,
    "defaultAgentType": "executor",
    "monitorIntervalMs": 30000,
    "shutdownTimeoutMs": 15000
  }
}
```

- **maxAgents** - 最大队友数（默认：20）
- **defaultAgentType** - 未指定时的 agent 类型（默认：`executor`）
- **monitorIntervalMs** - 轮询 `TaskList` 的频率（默认：30 秒）
- **shutdownTimeoutMs** - 等待关闭响应的时长（默认：15 秒）

> **注意：** Team 成员没有硬编码的模型默认值。每个队友是一个独立的 Claude Code session，继承用户配置的模型。由于队友可以生成自己的 subagent，session 模型充当编排层，而 subagent 可以使用任何模型层级。

## 状态清理

成功完成时：

1. `TeamDelete` 处理所有 Claude Code 状态：
   - 删除 `~/.claude/teams/{team_name}/`（配置）
   - 删除 `~/.claude/tasks/{team_name}/`（所有任务文件 + 锁）
2. 通过 MCP 工具清理 OMC 状态：
   ```
   state_clear(mode="team")
   ```
   如果链接到 Ralph：
   ```
   state_clear(mode="ralph")
   ```
3. 或运行 `/ultrapower:cancel`，它自动处理所有清理。

**重要：** 仅在所有队友关闭后调用 `TeamDelete`。如果 config 中仍有活跃成员（除 lead 外），`TeamDelete` 将失败。

## Git Worktree 集成

MCP worker 可以在隔离的 git worktree 中运行，以防止并发 worker 之间的文件冲突。

### 工作原理

1. **Worktree 创建**：在生成 worker 前，调用 `createWorkerWorktree(teamName, workerName, repoRoot)` 在 `.omc/worktrees/{team}/{worker}` 创建隔离 worktree，分支名为 `omc-team/{teamName}/{workerName}`。

2. **Worker 隔离**：将 worktree 路径作为 worker `BridgeConfig` 中的 `workingDirectory` 传递。Worker 仅在其自己的 worktree 中运行。

3. **合并协调**：Worker 完成任务后，使用 `checkMergeConflicts()` 验证分支可以干净合并，然后使用 `mergeWorkerBranch()` 以 `--no-ff` 合并以保留清晰历史。

4. **Team 清理**：Team 关闭时，调用 `cleanupTeamWorktrees(teamName, repoRoot)` 删除所有 worktree 及其分支。

### API 参考

| 函数 | 描述 |
|----------|-------------|
| `createWorkerWorktree(teamName, workerName, repoRoot, baseBranch?)` | 创建隔离 worktree |
| `removeWorkerWorktree(teamName, workerName, repoRoot)` | 删除 worktree 和分支 |
| `listTeamWorktrees(teamName, repoRoot)` | 列出所有 team worktree |
| `cleanupTeamWorktrees(teamName, repoRoot)` | 删除所有 team worktree |
| `checkMergeConflicts(workerBranch, baseBranch, repoRoot)` | 非破坏性冲突检查 |
| `mergeWorkerBranch(workerBranch, baseBranch, repoRoot)` | 合并 worker 分支（--no-ff） |
| `mergeAllWorkerBranches(teamName, repoRoot, baseBranch?)` | 合并所有已完成 worker 的分支 |

### 重要说明

- `tmux-session.ts` 中的 `createSession()` **不**处理 worktree 创建——worktree 生命周期通过 `git-worktree.ts` 单独管理
- Worktree **不**在单个 worker 关闭时清理——仅在 team 关闭时清理，以允许事后检查
- 分支名通过 `sanitizeName()` 净化以防止注入
- 所有路径都经过目录遍历验证

## 注意事项

1. **内部任务污染 TaskList** -- 生成队友时，系统自动创建带 `metadata._internal: true` 的内部任务。这些出现在 `TaskList` 输出中。计算真实任务进度时需过滤。内部任务的 subject 是队友的名称。

2. **无原子认领** -- 与 SQLite swarm 不同，`TaskUpdate` 没有事务保证。两个队友可能竞争认领同一任务。**缓解措施：** Lead 应在生成队友前通过 `TaskUpdate(taskId, owner)` 预分配所有者。队友只应处理分配给自己的任务。

3. **任务 ID 是字符串** -- ID 是自增字符串（"1"、"2"、"3"），而非整数。始终向 `taskId` 字段传递字符串值。

4. **TeamDelete 需要空 team** -- 调用 `TeamDelete` 前所有队友必须已关闭。Lead（唯一剩余成员）不在此检查范围内。

5. **消息自动传递** -- 队友消息作为新对话轮次到达 lead。入站消息无需轮询或检查 inbox。但如果 lead 正在处理中（mid-turn），消息会排队并在轮次结束时传递。
