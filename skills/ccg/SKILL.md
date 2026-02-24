---
name: ccg
description: Claude-Codex-Gemini 三模型编排 —— 将后端任务并行分发给 Codex，将前端/UI 任务分发给 Gemini，再由 Claude 综合结果
---

# CCG（Claude-Codex-Gemini）编排

## 概述

CCG 是一种三模型编排模式：

- **Claude** —— 编排者/指挥：分解请求、分发工作、综合结果
- **Codex**（OpenAI）—— 后端/代码引擎：架构、API、安全、代码分析
- **Gemini**（Google）—— 前端/设计处理器：UI 组件、样式、视觉设计、大上下文任务

Claude 将 Codex 和 Gemini **并行**分发，然后将其输出综合为统一解决方案。

## 触发条件

当用户在提示中说 `ccg` 或 `claude-codex-gemini` 时激活。

## 执行协议

**立即宣布**：`"CCG MODE ENABLED — Orchestrating Claude + Codex + Gemini"`

### 阶段 1：分解

分析请求并拆分为：
- **后端任务** → Codex（API、数据模型、业务逻辑、测试、安全）
- **前端任务** → Gemini（UI 组件、样式、布局、响应式设计）
- **综合任务** → Claude（集成、横切关注点、最终连接）

### 阶段 2：并行分发

使用后台模式**同时**运行 Codex 和 Gemini。

**Codex —— 后端**：
1. 将提示写入 `.omc/prompts/codex-{purpose}-{timestamp}.md`
2. 调用 `ask_codex` MCP 工具：
   - `agent_role`：从 `architect`、`executor`、`code-reviewer`、`security-reviewer`、`planner`、`critic` 中选择
   - `prompt_file`：刚写入的文件
   - `output_file`：`.omc/prompts/codex-{purpose}-{timestamp}-output.md`
   - `context_files`：相关源文件
   - `background: true` 用于非阻塞执行

**Gemini —— 前端**：
1. 将提示写入 `.omc/prompts/gemini-{purpose}-{timestamp}.md`
2. 调用 `ask_gemini` MCP 工具：
   - `agent_role`：从 `designer`、`writer`、`vision` 中选择
   - `prompt_file`：刚写入的文件
   - `output_file`：`.omc/prompts/gemini-{purpose}-{timestamp}-output.md`
   - `files`：相关源文件
   - `background: true` 用于非阻塞执行

### 阶段 3：等待结果

对两个任务使用 `wait_for_job`（或用 `check_job_status` 轮询）。综合前等待两者完成。

### 阶段 4：综合

Claude 读取两个输出文件并：
1. 协调任何冲突（如 API 形状与组件 props）
2. 将后端 + 前端解决方案整合为统一整体
3. 应用横切关注点（错误处理、类型、认证）
4. 实现剩余的集成胶水代码

## MCP 工具选择指南

### 使用 Codex（`ask_codex`）处理：
- REST/GraphQL API 设计和实现
- 数据库 schema、迁移、数据模型
- 后端业务逻辑和服务
- 安全审计和漏洞分析
- 架构审查和重构
- 测试策略、TDD、单元/集成测试
- 构建错误和 TypeScript 问题

**角色**：`architect`、`code-reviewer`、`security-reviewer`、`executor`、`planner`、`critic`、`tdd-guide`

### 使用 Gemini（`ask_gemini`）处理：
- React/Vue/Svelte 组件实现
- CSS、Tailwind、styled-components
- 响应式布局和视觉设计
- UI/UX 审查和启发式审计
- 大规模文档（1M token 上下文）
- 图像/截图/图表分析

**角色**：`designer`、`writer`、`vision`

## 回退

若 **Codex MCP 不可用** → 使用 `Task(subagent_type="ultrapower:executor", model="sonnet")` 处理后端任务。

若 **Gemini MCP 不可用** → 使用 `Task(subagent_type="ultrapower:designer", model="sonnet")` 处理前端任务。

若**两者均不可用** → 直接使用 Claude 配合标准 agent 目录。

## 示例

**用户**：`ccg Add a user profile page with a REST API endpoint and React frontend`

```
CCG MODE ENABLED — Orchestrating Claude + Codex + Gemini

Decomposition:
  Backend  → Codex: /api/users/:id endpoint, Prisma user model, auth middleware
  Frontend → Gemini: React UserProfile component, avatar, form, responsive layout

Fan-out (parallel):
  [Codex]  Implementing REST endpoint + data layer...
  [Gemini] Designing UserProfile component + styling...

[Both complete]

Synthesis:
  - Align API response type with React component props
  - Wire fetch hook to /api/users/:id endpoint
  - Add error boundary and loading state across layers
  - Export unified UserProfilePage with data fetching
```

## 与其他 Skill 集成

CCG 可与其他 OMC 模式组合：

| 组合 | 效果 |
|-------------|--------|
| `ccg ralph` | CCG 循环配合 ralph 持久化，直到验证完成 |
| `ccg ultrawork` | CCG 在每个模型内使用最大并行度 |
| `ccg team` | CCG 在多 agent team 内编排 |

## 取消

停止活跃的 CCG 工作：说 `cancelomc` 或运行 `/ultrapower:cancel`。

## 状态

CCG 不维护持久状态文件。每次调用都是无状态的 —— Claude 在会话中内联管理工作流。MCP 任务 ID 在会话期间在上下文中跟踪。

## Axiom Codex 分发协议（增强）

此 skill 是 Axiom `codex-dispatch.md` 的兼容性入口点。

### Codex 分发优先级规则

当任务同时涉及后端和前端时，按以下优先级分配：

| 任务类型 | 分发目标 | 优先级 |
|---------|---------|--------|
| API 设计、数据模型、业务逻辑 | Codex | P0 |
| 安全审计、架构审查 | Codex | P0 |
| React/Vue 组件、CSS 样式 | Gemini | P1 |
| 大上下文文档分析（>100K tokens） | Gemini | P1 |
| 集成胶水代码、横切关注点 | Claude 直接处理 | P2 |

### 与 DAG 执行集成

CCG 可与 Axiom 任务队列集成：
1. 读取任务队列中的并行组（Parallel Group）
2. 将后端任务 → Codex，前端任务 → Gemini，同时分发
3. 等待两者完成后，Claude 综合结果并提交
4. 执行编译门控：`tsc --noEmit && npm run build`

### 输出文件约定

- Codex 输出：`.omc/prompts/codex-[task-id]-output.md`
- Gemini 输出：`.omc/prompts/gemini-[task-id]-output.md`
- 综合结果：直接写入目标源文件
