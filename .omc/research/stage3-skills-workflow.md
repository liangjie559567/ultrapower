# Stage 3: Skills 工作流编排机制分析

## [FINDING:SKILL-1] Skill 定义格式与元数据结构

**[CONFIDENCE:HIGH]**

### 核心发现

ultrapower 包含 **75 个 SKILL.md 文件**，分布在 **74 个子目录**中（部分 skill 如 nexus 包含子 skill）。

### Skill 元数据格式

每个 SKILL.md 使用 YAML frontmatter 定义元数据：

```yaml
---
name: skill-name
description: 简短描述
---
```

**[EVIDENCE:SKILL-1]** 示例文件：
- `skills/team/SKILL.md` - 多 agent 协调
- `skills/autopilot/SKILL.md` - 全自主执行
- `skills/ralph/SKILL.md` - 持久化循环
- `skills/ultrawork/SKILL.md` - 并行执行引擎

### Skill 内容结构

所有 skill 遵循统一的文档模板：

1. **`<Purpose>`** - skill 的核心目标
2. **`<Use_When>`** - 激活条件和触发场景
3. **`<Do_Not_Use_When>`** - 反模式和替代方案
4. **`<Why_This_Exists>`** - 设计理念
5. **`<Execution_Policy>`** - 执行规则
6. **`<Steps>`** - 工作流步骤
7. **`<Tool_Usage>`** - 工具调用指南
8. **`<Examples>`** - 正确/错误示例
9. **`<Escalation_And_Stop_Conditions>`** - 停止条件
10. **`<Final_Checklist>`** - 完成验证清单
11. **`<Advanced>`** - 高级配置（可选）

---

## [FINDING:SKILL-2] Skills 分类体系

**[CONFIDENCE:HIGH]**

### 工作流 Skills（核心编排）

| Skill | 触发词 | 功能 |
|-------|--------|------|
| `autopilot` | "autopilot", "build me", "I want a" | 从想法到可运行代码的全自主执行 |
| `ralph` | "ralph", "don't stop", "must complete" | 持久化循环 + 验证 |
| `ultrawork` | "ulw", "ultrawork" | 并行 agent 编排 |
| `team` | "team", "coordinated team" | Claude Code 原生 team 工具 |
| `swarm` | "swarm" | Team 的兼容性外观（旧版 SQLite） |
| `ultrapilot` | "ultrapilot", "parallel build" | Team 的兼容性外观 |
| `pipeline` | "pipeline", "chain agents" | 顺序 agent 链式执行 |
| `plan` | "plan this", "plan the" | 战略规划 + 访谈工作流 |
| `ralplan` | "ralplan", "consensus plan" | 多专家共识规划 |

**[EVIDENCE:SKILL-2]** 文件路径：
- `skills/autopilot/SKILL.md`
- `skills/ralph/SKILL.md`
- `skills/ultrawork/SKILL.md`
- `skills/team/SKILL.md`
- `skills/plan/SKILL.md`

### Agent 快捷方式 Skills

轻量包装器，直接调用对应 agent：

- `analyze` → `debugger`
- `deepsearch` → `explore`
- `tdd` → `test-engineer`
- `build-fix` → `build-fixer`
- `code-review` → `code-reviewer`
- `security-review` → `security-reviewer`
- `frontend-ui-ux` → `designer`
- `git-master` → `git-master`

### Axiom 工作流 Skills

专门的产品开发流水线（13 个 ax-* skills）：

- `ax-draft` - 需求起草
- `ax-review` - 专家评审
- `ax-decompose` - 任务拆解
- `ax-implement` - 实施流水线
- `ax-analyze-error` - 错误分析
- `ax-reflect` - 反思总结
- `ax-status` - 状态查询
- `ax-suspend` - 保存退出
- `ax-rollback` - 回滚
- `ax-knowledge` - 知识库管理
- `ax-evolution` - 进化引擎
- `ax-export` - 导出工作流

**[EVIDENCE:SKILL-2]** 文件路径：
- `skills/ax-draft/SKILL.md`
- `skills/ax-review/SKILL.md`
- `skills/ax-implement/SKILL.md`

### 工具类 Skills

- `cancel` - 取消执行模式
- `note` - 记录笔记
- `learner` - 学习新 skill
- `omc-setup` - OMC 初始化
- `mcp-setup` - MCP 配置
- `hud` - 状态面板
- `omc-doctor` - 诊断工具
- `trace` - 追踪时间线
- `release` - 发布管理

---

## [FINDING:SKILL-3] Skill Bridge 构建机制

**[CONFIDENCE:HIGH]**

### 构建流程

**[EVIDENCE:SKILL-3]** `scripts/build-skill-bridge.mjs`

Skill bridge 通过 esbuild 将 TypeScript 模块打包为独立 CJS 文件：

```javascript
// 入口点：src/hooks/learner/bridge.ts
// 输出：dist/hooks/skill-bridge.cjs
// 格式：CommonJS (require() 兼容)
// 目标：Node.js 18+
```

### 关键特性

1. **Bundle 模式**：将所有依赖打包到单个文件
2. **平台**：Node.js 环境
3. **外部化**：Node.js 内置模块（fs, path, crypto 等）不打包
4. **格式**：CJS，供 `skill-injector.mjs` 通过 `require()` 加载

### 用途

Skill bridge 是 hook 系统与 skill 定义之间的桥梁，负责：
- 加载 skill 元数据
- 解析 SKILL.md 文件
- 注入 skill 上下文到 agent prompt
- 管理 skill 生命周期

---

## [FINDING:SKILL-4] Skills 与 Commands 的映射关系

**[CONFIDENCE:HIGH]**

### 调用方式

Skills 通过以下方式激活：

1. **显式调用**：`/ultrapower:skill-name`
2. **关键词检测**：用户消息中包含触发词
3. **Magic Keyword**：Hook 注入 `[MAGIC KEYWORD: SKILL_NAME]`

### 触发词优先级

当多个 skill 触发词同时出现时，遵循优先级规则：

1. **显式模式关键词**（`ulw`, `ultrawork`）覆盖默认值
2. **通用关键词**（"fast", "parallel"）读取 `~/.claude/.omc-config.json` 的 `defaultExecutionMode`
3. **Ralph 包含 ultrawork**（持久性包装器）
4. **Autopilot 可转换为 ralph 或 ultraqa**
5. **Autopilot 和 ultrapilot 互斥**

**[EVIDENCE:SKILL-4]** 来自 `CLAUDE.md` 的 skills 部分：

```markdown
冲突解决：显式模式关键词（`ulw`、`ultrawork`）覆盖默认值。
通用的 "fast"/"parallel" 读取 `~/.claude/.omc-config.json` -> `defaultExecutionMode`。
Ralph 包含 ultrawork（持久性包装器）。
Autopilot 可以转换为 ralph 或 ultraqa。
Autopilot 和 ultrapilot 互斥。
```

---

## [FINDING:SKILL-5] 核心工作流编排模式

**[CONFIDENCE:HIGH]**

### 层次化组合架构

Skills 采用分层组合设计：

```
autopilot（自主执行）
 └── 包含：ralph（持久化循环）
     └── 包含：ultrawork（并行执行）
         └── 提供：仅并行性

team（多 agent 协调）
 └── 分阶段 pipeline：
     team-plan → team-prd → team-exec → team-verify → team-fix
```

### Autopilot 5 阶段流水线

**[EVIDENCE:SKILL-5]** `skills/autopilot/SKILL.md`

1. **阶段 0 - 扩展**：Analyst (Opus) + Architect (Opus) → `.omc/autopilot/spec.md`
2. **阶段 1 - 规划**：Architect (Opus) + Critic (Opus) → `.omc/plans/autopilot-impl.md`
3. **阶段 2 - 执行**：Ralph + Ultrawork（并行 executor agents）
4. **阶段 3 - QA**：UltraQA 模式（最多 5 次循环）
5. **阶段 4 - 验证**：并行多视角审查（Architect + Security + Code-reviewer）
6. **阶段 5 - 清理**：删除所有状态文件，运行 `/ultrapower:cancel`

### Ralph 持久化循环

**[EVIDENCE:SKILL-5]** `skills/ralph/SKILL.md`

```
循环直到完成：
1. 审查进度（TODO 列表 + 状态）
2. 并行委托（适当层级的专业 agent）
3. 后台运行长时间操作
4. 用新鲜证据验证完成
5. Architect 验证（分级）
6. 批准后：/ultrapower:cancel
7. 拒绝后：修复并重新验证
```

### Team 分阶段 Pipeline

**[EVIDENCE:SKILL-5]** `skills/team/SKILL.md`

```
team-plan → team-prd → team-exec → team-verify → team-fix (循环)
```

每个阶段使用专业 agent（而非仅 executor）：

| 阶段 | 必需 Agent | 可选 Agent |
|------|-----------|-----------|
| team-plan | explore (haiku), planner (opus) | analyst, architect |
| team-prd | analyst (opus) | product-manager, critic |
| team-exec | executor (sonnet) | deep-executor, build-fixer, designer, writer, test-engineer |
| team-verify | verifier (sonnet) | security-reviewer, code-reviewer, quality-reviewer |
| team-fix | executor (sonnet) | build-fixer, debugger, deep-executor |

---

## [FINDING:SKILL-6] Skill 状态持久化机制

**[CONFIDENCE:HIGH]**

### 状态存储位置

所有 OMC 状态存储在 git worktree 根目录：

```
{worktree}/.omc/state/
├── autopilot-state.json
├── ralph-state.json
├── ultrawork-state.json
├── team-state.json
├── pipeline-state.json
└── sessions/{sessionId}/
```

### 状态管理工具

通过 MCP 工具操作状态：

- `state_read(mode)` - 读取状态
- `state_write(mode, active, current_phase, state)` - 写入状态
- `state_clear(mode)` - 清除状态
- `state_list_active()` - 列出活跃模式
- `state_get_status(mode)` - 获取详细状态

**[EVIDENCE:SKILL-6]** 支持的模式：
- `autopilot`, `ultrapilot`, `swarm`, `pipeline`, `team`, `ralph`, `ultrawork`, `ultraqa`, `ralplan`

### Team 状态 Schema

**[EVIDENCE:SKILL-6]** `skills/team/SKILL.md` 第 216-229 行

```typescript
{
  active: boolean,
  current_phase: "team-plan" | "team-prd" | "team-exec" | "team-verify" | "team-fix",
  team_name: string,
  agent_count: number,
  agent_types: string,  // 逗号分隔
  task: string,
  fix_loop_count: number,
  max_fix_loops: number,
  linked_ralph: boolean,
  stage_history: string  // 带时间戳的阶段转换列表
}
```

### 恢复机制

Skills 支持幂等恢复：

1. 检查现有状态文件（`state_read`）
2. 如果 `active=true` 且 `current_phase` 为非终态
3. 从最后未完成阶段恢复
4. 而非创建新实例

---

## [FINDING:SKILL-7] MCP 集成与外部 AI 委派

**[CONFIDENCE:HIGH]**

### MCP 提供商

Skills 可委派给外部 AI 提供商：

1. **Codex** (`ask_codex`) - OpenAI gpt-5.3-codex
   - 擅长：架构审查、规划验证、代码审查、安全审查
   - 推荐角色：architect, planner, critic, analyst, code-reviewer, security-reviewer

2. **Gemini** (`ask_gemini`) - Google gemini-3-pro-preview
   - 擅长：UI/UX 设计、文档、视觉分析、大上下文任务（1M token）
   - 推荐角色：designer, writer, vision

### 延迟工具发现

**[EVIDENCE:SKILL-7]** MCP 工具是延迟加载的，首次使用前必须调用：

```
ToolSearch("mcp")  // 发现所有 MCP 工具
```

### 回退策略

如果 ToolSearch 返回无结果：
- MCP 服务器未配置
- 回退到等效的 Claude agent
- 不阻塞在不可用的 MCP 工具上

### Autopilot 中的 MCP 使用

**[EVIDENCE:SKILL-7]** `skills/autopilot/SKILL.md` 第 86-96 行

```markdown
* 首次使用 MCP 工具前，调用 `ToolSearch("mcp")` 发现延迟加载的 MCP 工具
* 阶段 4 架构验证使用 `ask_codex` 配合 `agent_role: "architect"`
* 阶段 4 安全审查使用 `ask_codex` 配合 `agent_role: "security-reviewer"`
* 阶段 4 质量审查使用 `ask_codex` 配合 `agent_role: "code-reviewer"`
* 若 ToolSearch 未找到 MCP 工具或 Codex 不可用，继续执行 —— 永不阻塞于外部工具
```

---

## [STAGE_COMPLETE:3]

### 总结

ultrapower 的 skills 工作流编排机制具有以下特征：

1. **75 个 skill**，采用统一的 YAML frontmatter + 结构化文档格式
2. **分层组合架构**：autopilot ⊃ ralph ⊃ ultrawork
3. **分阶段 pipeline**：team 使用 5 阶段流水线，每阶段路由到专业 agent
4. **状态持久化**：通过 MCP 工具管理 `.omc/state/` 中的 JSON 状态文件
5. **幂等恢复**：所有主要 skill 支持从中断处恢复
6. **MCP 集成**：可委派给 Codex/Gemini，带延迟发现和回退机制
7. **触发词系统**：支持显式调用、关键词检测和 Magic Keyword 注入
8. **Skill bridge**：通过 esbuild 打包的 CJS 模块连接 hook 系统与 skill 定义

### 关键证据文件

- `skills/*/SKILL.md` - 75 个 skill 定义
- `scripts/build-skill-bridge.mjs` - Skill bridge 构建脚本
- `CLAUDE.md` - Skills 触发词和冲突解决规则
- `.omc/state/` - 状态持久化目录
