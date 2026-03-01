<!-- ultrapower v5.5.5 | updated: 2026-03-02 -->

# ultrapower Features — v5.5.5

> 完整功能参考文档，面向 ultrapower 开发者与高级用户。

## 目录

1. [Notepad System（6 个工具）](#notepad-system)
2. [State Management（5 个工具）](#state-management)
3. [Project Memory（4 个工具）](#project-memory)
4. [LSP / AST / Python REPL](#lsp--ast--python-repl)
5. [Delegation Enforcer（v5.5.2 新增）](#delegation-enforcer)
6. [Axiom Integration（14 agents，14 skills，2 hooks）](#axiom-integration)
7. [Execution Modes Deep Dive](#execution-modes-deep-dive)
8. [Hook System](#hook-system)
9. [Windows Support（v5.5.x 修复）](#windows-support)
10. [MCP Routing](#mcp-routing)

---

## Notepad System

**会话记忆系统**，提供跨工具调用的上下文持久化。所有内容存储在 `{worktree}/.omc/notepad.md`，按章节组织，支持自动清理。

### 工具列表（共 6 个）

#### `notepad_read`

读取 notepad 内容，支持按章节过滤。

```typescript
notepad_read(section?: 'all' | 'priority' | 'working' | 'manual'): string
```

| 章节 | 描述 |
|------|------|
| `all` | 读取全部内容（默认） |
| `priority` | 仅读取优先上下文（会话启动时自动加载） |
| `working` | 读取工作记忆（带时间戳，7 天后自动清理） |
| `manual` | 读取手动记录（永久保存） |

#### `notepad_write_priority`

写入优先上下文，限制 500 字符，会话启动时自动注入系统提示词。

```typescript
notepad_write_priority(content: string): void
// 注意：content 最多 500 字符
// 超出限制时自动截断，并给出警告
```

**适用场景**：记录当前任务状态、关键约束、用户偏好等需要跨会话持久化的关键信息。

#### `notepad_write_working`

写入工作记忆，自动附加时间戳，7 天后由 `notepad_prune` 自动清理。

```typescript
notepad_write_working(content: string): void
// 内容格式：自动附加 <!-- ts: ISO8601 --> 标记
```

**适用场景**：记录执行中间结果、调试信息、临时决策等短期信息。

#### `notepad_write_manual`

写入手动记录，永久保存，不受自动清理影响。

```typescript
notepad_write_manual(content: string): void
```

**适用场景**：记录重要决策、架构约束、用户明确要求保留的信息。

#### `notepad_prune`

清理 N 天前的工作记忆条目，释放空间。

```typescript
notepad_prune(olderThanDays?: number): { pruned: number }
// olderThanDays 默认为 7
```

#### `notepad_stats`

获取 notepad 统计信息，包括条目数、字符数、各章节分布。

```typescript
notepad_stats(): {
  totalChars: number;
  priorityChars: number;
  workingEntries: number;
  manualEntries: number;
  oldestWorkingEntry?: string;
}
```

### 存储格式

```markdown
<!-- .omc/notepad.md -->
## priority
[最多 500 字符的优先上下文]

## working
<!-- ts: 2026-03-02T10:00:00Z -->
[工作记忆条目]

## manual
[永久手动记录]
```

### 禁用方式

```bash
OMC_DISABLE_TOOLS=notepad  # 禁用全部 notepad 工具
```

---

## State Management

**执行模式状态管理系统**，追踪各执行模式的运行状态和进度。所有状态文件存储在 `{worktree}/.omc/state/` 目录下。

### 工具列表（共 5 个）

#### `state_read`

读取指定执行模式的当前状态。

```typescript
state_read(mode: ExecutionMode): ModeState | null
```

#### `state_write`

写入或更新执行模式状态，支持深度合并。

```typescript
state_write(mode: ExecutionMode, data: Partial<ModeState>): boolean
```

#### `state_clear`

清除指定模式的状态文件，重置到初始状态。

```typescript
state_clear(mode: ExecutionMode): boolean
```

#### `state_list_active`

列出所有当前活跃（`active: true`）的执行模式。

```typescript
state_list_active(): ExecutionMode[]
```

#### `state_get_status`

获取指定模式或所有模式的详细状态汇总。

```typescript
state_get_status(mode?: ExecutionMode): StatusSummary | Record<ExecutionMode, StatusSummary>
```

### 支持的执行模式

| 模式 | 状态文件路径 | 描述 |
|------|------------|------|
| `autopilot` | `.omc/state/autopilot-state.json` | 全自主执行状态 |
| `ultrapilot` | `.omc/state/ultrapilot-state.json` | 并行 autopilot 状态 |
| `team` | `.omc/state/team-state.json` | 团队协调状态 |
| `pipeline` | `.omc/state/pipeline-state.json` | 流水线状态 |
| `ralph` | `.omc/state/ralph-state.json` | 持续执行状态 |
| `ultrawork` | `.omc/state/ultrawork-state.json` | 并行工作状态 |
| `ultraqa` | `.omc/state/ultraqa-state.json` | QA 循环状态 |
| `ralplan` | `.omc/state/ralplan-state.json` | 共识规划状态 |

### 会话级状态

当有 session ID 时，状态额外存储到会话专属目录：

```
{worktree}/.omc/state/sessions/{sessionId}/{mode}-state.json
```

### 安全规则

`mode` 参数必须通过 `assertValidMode()` 校验后才能拼接路径，防止路径遍历攻击：

```typescript
import { assertValidMode } from './src/lib/validateMode';
const validMode = assertValidMode(mode);
const path = `.omc/state/${validMode}-state.json`;
```

### 禁用方式

```bash
OMC_DISABLE_TOOLS=state  # 禁用全部 state 工具
```

---

## Project Memory

**项目级持久记忆系统**，跨会话保存项目关键信息。存储在 `{worktree}/.omc/project-memory.json`，按章节组织，支持合并写入。

### 工具列表（共 4 个）

#### `project_memory_read`

读取项目记忆，支持按章节过滤。

```typescript
project_memory_read(section?: MemorySection): ProjectMemory | SectionData
```

| 章节 | 描述 |
|------|------|
| `techStack` | 技术栈信息（语言、框架、工具版本） |
| `build` | 构建命令和配置 |
| `conventions` | 代码规范和命名约定 |
| `structure` | 项目目录结构说明 |
| `notes` | 项目级自由记录 |
| `directives` | 用户明确指令（跨会话持久化，抗压缩） |

#### `project_memory_write`

写入或更新项目记忆，支持深度合并，不覆盖未指定的字段。

```typescript
project_memory_write(data: Partial<ProjectMemory>): boolean
```

**示例：**

```typescript
project_memory_write({
  techStack: {
    language: 'TypeScript 5.4',
    framework: 'Node.js 22',
    testRunner: 'Vitest'
  },
  build: {
    commands: {
      build: 'npm run build',
      test: 'npm test',
      lint: 'npm run lint'
    }
  }
})
```

#### `project_memory_add_note`

向 `notes` 章节追加一条分类笔记，自动附加时间戳。

```typescript
project_memory_add_note(category: string, content: string): boolean
```

#### `project_memory_add_directive`

向 `directives` 章节追加用户指令，永久保存，抗上下文压缩。

```typescript
project_memory_add_directive(directive: string): boolean
```

**适用场景**：用户明确要求"始终"或"永远不要"做某件事时，记录为 directive。

### 存储格式

```json
{
  "techStack": { "language": "TypeScript", "framework": "Node.js" },
  "build": { "commands": { "build": "npm run build" } },
  "conventions": { "commitStyle": "conventional commits" },
  "structure": { "src": "TypeScript 源代码", "docs": "用户文档" },
  "notes": [
    { "category": "architecture", "content": "...", "timestamp": "2026-03-02" }
  ],
  "directives": [
    "始终在修改文件前运行 lsp_diagnostics",
    "禁止直接修改 main 分支"
  ]
}
```

### 禁用方式

```bash
OMC_DISABLE_TOOLS=memory          # 禁用 project-memory 工具
OMC_DISABLE_TOOLS=project-memory  # 等效别名
```

---

## LSP / AST / Python REPL

ultrapower 通过 Language Server Protocol、AST-grep 和 Python REPL 提供类 IDE 的代码智能能力。

### LSP 工具（共 12 个）

通过语言服务器协议实现跨语言代码分析。

| 工具 | 描述 |
|------|------|
| `lsp_hover` | 获取光标位置的类型信息和文档注释 |
| `lsp_goto_definition` | 跳转到符号的定义位置 |
| `lsp_find_references` | 查找符号在整个代码库中的所有引用 |
| `lsp_document_symbols` | 获取文件的符号大纲（函数、类、变量） |
| `lsp_workspace_symbols` | 跨工作区搜索符号 |
| `lsp_diagnostics` | 获取单个文件的错误和警告 |
| `lsp_diagnostics_directory` | 项目级类型检查（优先使用 `tsc --noEmit`，回退到 LSP） |
| `lsp_servers` | 列出当前可用的语言服务器 |
| `lsp_prepare_rename` | 检查符号是否可安全重命名 |
| `lsp_rename` | 预览并执行跨文件重命名重构 |
| `lsp_code_actions` | 获取可用的快速修复和重构操作 |
| `lsp_code_action_resolve` | 获取特定代码操作的详细信息 |

**支持语言：** TypeScript、JavaScript、Python、Rust、Go、C/C++、Java、JSON、HTML、CSS、YAML

#### 诊断策略

`lsp_diagnostics_directory` 使用双策略方法：

```typescript
type DiagnosticsStrategy = 'tsc' | 'lsp' | 'auto';
// auto（默认）：有 tsc 时使用 tsc --noEmit，否则回退到 LSP
// tsc：强制使用 TypeScript 编译器检查
// lsp：强制使用逐文件 LSP 诊断
```

#### 使用模式

```typescript
// 在修改文件后立即验证
const diagnostics = await lsp_diagnostics({ file: 'src/foo.ts' });
if (diagnostics.errorCount > 0) {
  // 在生产代码中修复，而非测试 hack
  console.error(diagnostics.messages);
}

// 项目级检查
const result = await lsp_diagnostics_directory({ directory: process.cwd() });
console.log(`${result.errorCount} errors, ${result.warningCount} warnings`);
```

### AST 工具（共 2 个）

通过 `ast-grep` 进行结构化代码搜索和 AST 感知的代码转换。

#### `ast_grep_search`

使用模式匹配在代码中搜索语法结构。

```typescript
ast_grep_search(pattern: string, language: SupportedLanguage, path?: string): Match[]
```

**元变量语法：**

- `$NAME`：匹配单个语法节点（标识符、表达式等）
- `$$$ARGS`：匹配多个节点（函数参数列表等）
- `$_`：匹配任意节点（不捕获）

**示例：**

```typescript
// 查找所有 console.log 调用
ast_grep_search('console.log($$$ARGS)', 'TypeScript', 'src/')

// 查找所有 async 函数
ast_grep_search('async function $NAME($$$PARAMS) { $$$BODY }', 'TypeScript')
```

#### `ast_grep_replace`

AST 感知的代码转换，默认为 dry-run 模式。

```typescript
ast_grep_replace(
  pattern: string,
  replacement: string,
  language: SupportedLanguage,
  path?: string,
  dryRun?: boolean  // 默认 true
): { matches: number; preview: string }
```

**示例：**

```typescript
// 将 var 替换为 const（预览模式）
ast_grep_replace('var $NAME = $VALUE', 'const $NAME = $VALUE', 'JavaScript')

// 确认后实际执行
ast_grep_replace('var $NAME = $VALUE', 'const $NAME = $VALUE', 'JavaScript', 'src/', false)
```

**支持语言：** JavaScript、TypeScript、TSX、Python、Ruby、Go、Rust、Java、Kotlin、Swift、C、C++、C#、HTML、CSS、JSON、YAML

### Python REPL（共 1 个）

持久化 Python REPL，支持状态跨调用保留。

#### `python_repl`

```typescript
python_repl(code: string): { stdout: string; stderr: string; result: any }
```

**内置可用库：** `pandas`、`numpy`、`matplotlib`、`json`、`os`、`sys`、`re`

**适用场景：**
- CSV/JSON 数据分析
- 统计计算
- 文件内容转换
- 快速原型验证

### 工具禁用

```bash
OMC_DISABLE_TOOLS=lsp            # 禁用全部 LSP 工具
OMC_DISABLE_TOOLS=ast            # 禁用全部 AST 工具
OMC_DISABLE_TOOLS=python         # 禁用 Python REPL
OMC_DISABLE_TOOLS=python-repl    # 等效别名
```

---

## Delegation Enforcer

**v5.5.2 新增功能。** 自动为 Task 委派注入合适的模型层级，无需手动指定 `model` 参数，确保 agent 与模型的最优匹配。

### 工作原理

Delegation Enforcer 通过 `processPreToolUse` 钩子集成在 `bridge.ts` 中，拦截所有 Task 工具调用，根据 `subagent_type` 自动注入 `model` 字段。

```typescript
// bridge.ts 中的集成点
async function processPreToolUse(input: ToolInput): Promise<ToolInput> {
  if (input.tool_name === 'Task' && input.tool_input.subagent_type) {
    const agentType = extractAgentType(input.tool_input.subagent_type);
    const model = resolveModelForAgent(agentType);
    if (model && !input.tool_input.model) {
      input.tool_input.model = model;
    }
  }
  return input;
}
```

### 模型路由规则

| Agent 类型 | 自动注入模型 | 说明 |
|-----------|------------|------|
| `explore` | `haiku` | 代码库发现，轻量扫描 |
| `style-reviewer` | `haiku` | 格式检查，低复杂度 |
| `writer` | `haiku` | 文档生成，简单任务 |
| `executor` | `sonnet` | 标准代码实现 |
| `debugger` | `sonnet` | 根因分析，中等复杂度 |
| `verifier` | `sonnet` | 完成验证 |
| `security-reviewer` | `sonnet` | 安全审查 |
| `quality-reviewer` | `sonnet` | 质量检查 |
| `test-engineer` | `sonnet` | 测试策略 |
| `build-fixer` | `sonnet` | 构建修复 |
| `designer` | `sonnet` | UI/UX 设计 |
| `analyst` | `opus` | 需求分析，高复杂度 |
| `planner` | `opus` | 执行规划 |
| `architect` | `opus` | 系统架构设计 |
| `deep-executor` | `opus` | 复杂自主执行 |
| `critic` | `opus` | 批判性审查 |
| `code-reviewer` | `opus` | 综合代码审查 |

### 覆盖规则

手动指定的 `model` 参数优先级高于自动注入：

```typescript
// 手动指定时，Delegation Enforcer 不会覆盖
Task({
  subagent_type: "ultrapower:executor",
  model: "opus",  // 强制使用 opus，Enforcer 不干预
  prompt: "Complex refactoring task..."
})
```

### 配置

通过 `~/.claude/.omc-config.json` 可自定义路由规则：

```json
{
  "delegationEnforcer": {
    "enabled": true,
    "overrides": {
      "executor": "opus",
      "explore": "sonnet"
    }
  }
}
```

---

## Axiom Integration

ultrapower 深度融合 Axiom 智能体编排框架，提供从需求起草到自动进化的完整工作流，涵盖 14 个专用 agents、14 个 skills 和 2 个 hooks。

### Axiom Agents（14 个）

#### 需求与设计通道（5 个）

| Agent | 模型 | 职责 |
|-------|------|------|
| `axiom-requirement-analyst` | sonnet | 需求三态门：PASS（直接进入 PRD）/ CLARIFY（提问澄清）/ REJECT（拒绝） |
| `axiom-product-designer` | sonnet | 生成 Draft PRD，含 Mermaid 流程图和用户旅程 |
| `axiom-review-aggregator` | sonnet | 聚合 5 个专家并行评审结果，执行冲突仲裁 |
| `axiom-prd-crafter` | sonnet | 生成工程级 PRD，含门控验证和接受标准 |
| `axiom-system-architect` | sonnet | 生成原子任务 DAG（有向无环图）和 Manifest 文件 |

#### 进化与记忆通道（3 个）

| Agent | 模型 | 职责 |
|-------|------|------|
| `axiom-evolution-engine` | sonnet | 知识收割、模式检测（出现 ≥3 次提升）、工作流优化 |
| `axiom-context-manager` | sonnet | 7 种记忆操作：读/写/状态/检查点/恢复/清除/压缩 |
| `axiom-worker` | sonnet | 接收 PM 分配的原子任务，输出三态结果 |

#### 评审专家通道（5 个）

| Agent | 模型 | 职责 | 输出文件 |
|-------|------|------|---------|
| `axiom-ux-director` | sonnet | UX/体验专家评审 | `review_ux.md` |
| `axiom-product-director` | sonnet | 产品战略专家评审 | `review_product.md` |
| `axiom-domain-expert` | sonnet | 领域知识专家评审 | `review_domain.md` |
| `axiom-tech-lead` | sonnet | 技术可行性评审 | `review_tech.md` |
| `axiom-critic` | sonnet | 安全/质量/逻辑评审 | `review_critic.md` |

#### 任务拆解通道（1 个）

| Agent | 模型 | 职责 |
|-------|------|------|
| `axiom-sub-prd-writer` | sonnet | 将 Manifest 任务拆解为可执行的 Sub-PRD 文件 |

### Axiom Worker 规范

Worker agent 采用 PM→Worker 协议，执行原子任务后输出三种格式之一：

```markdown
## QUESTION
问题: [具体需要澄清的内容]
原因: [为什么需要这个信息才能继续]
```

```markdown
## COMPLETE
完成: [任务描述]
变更: [修改的文件列表]
验证: [CI 命令输出，例如 tsc --noEmit 结果]
```

```markdown
## BLOCKED
原因: [阻塞原因详述]
已尝试: [已经尝试过的方法，最多 3 次]
需要: [需要什么外部帮助]
```

**自修复策略：** 最多自动重试 3 次，每次失败后运行 `tsc --noEmit && npm run build && npm test`，3 次均失败后输出 BLOCKED。

### Axiom Skills（14 个）

#### 核心工作流 Skills

| Skill | 命令 | 用途 |
|-------|------|------|
| `ax-draft` | `/ax-draft` | 需求澄清 → Draft PRD → 用户确认（触发 User Gate） |
| `ax-review` | `/ax-review` | 5 专家并行评审 → 聚合仲裁 → Rough PRD |
| `ax-decompose` | `/ax-decompose` | Rough PRD → 系统架构设计 → 原子任务 DAG |
| `ax-implement` | `/ax-implement` | 按 Manifest 执行任务，通过 CI 门禁，自动修复 |
| `ax-analyze-error` | `/ax-analyze-error` | 根因诊断 → 自动修复 → 加入学习队列 |

#### 进化与管理 Skills

| Skill | 命令 | 用途 |
|-------|------|------|
| `ax-reflect` | `/ax-reflect` | 会话反思 → 经验提取 → Action Items |
| `ax-evolve` | `/ax-evolve` | 处理学习队列 → 更新知识库 → 模式检测 |
| `ax-rollback` | `/ax-rollback` | 回滚到最近检查点（需用户明确确认） |
| `ax-suspend` | `/ax-suspend` | 保存会话状态，安全退出 |
| `ax-status` | `/ax-status` | 完整系统状态仪表盘 |

#### 高级工具 Skills

| Skill | 命令 | 用途 |
|-------|------|------|
| `ax-context` | `/ax-context` | 直接操作 Axiom 记忆系统（读/写/状态/检查点） |
| `ax-evolution` | `/ax-evolution [subcommand]` | 进化引擎统一入口（evolve/reflect/knowledge/patterns） |
| `ax-knowledge` | `/ax-knowledge [query]` | 语义查询 Axiom 知识库 |
| `ax-export` | `/ax-export` | 导出 Axiom 工作流产物（PRD、Manifest、Sub-PRD） |

### Axiom Hooks（2 个）

#### `axiom-boot`

位置：`src/hooks/axiom-boot/`

**触发时机：** 会话启动时（PreToolUse，首次工具调用前）

**功能：**
- 检测 `.omc/axiom/` 目录是否存在
- 读取 `active_context.md` 恢复当前任务状态
- 读取 `project_decisions.md` 加载架构约束
- 读取 `user_preferences.md` 加载用户偏好
- 根据状态决定行为：
  - `IDLE`：系统就绪，等待指令
  - `EXECUTING`：检测到中断任务，询问用户是否继续
  - `BLOCKED`：上次任务遇到问题，提示需要人工介入

#### `axiom-guards`

位置：`src/hooks/axiom-guards/`

**触发时机：** PreToolUse，每次工具调用前

**门禁规则：**

| 门禁 | 触发条件 | 强制动作 |
|------|---------|---------|
| Expert Gate | 所有新功能需求 | 必须经过 `/ax-draft` → `/ax-review` 流程 |
| User Gate | PRD 终稿生成完成 | 必须显示确认提示，等待用户 Yes/No |
| CI Gate | 代码修改完成 | 必须执行 `tsc --noEmit && npm run build && npm test` |
| Scope Gate | 修改文件时 | 检查是否在 Manifest 定义的 Impact Scope 内 |

### Axiom 记忆系统

```
{worktree}/.omc/axiom/
├── active_context.md         # 当前任务状态（短期记忆）
├── project_decisions.md      # 架构决策记录 ADR（长期记忆）
├── user_preferences.md       # 用户偏好设置
├── state_machine.md          # 状态机定义（可视化）
├── reflection_log.md         # 历次反思日志
└── evolution/
    ├── knowledge_base.md     # 知识图谱，含置信度系统（0.0-1.0）
    ├── pattern_library.md    # 代码模式库（出现次数 ≥3 时从 pending 提升）
    ├── learning_queue.md     # 待处理学习素材（P0-P3 优先级排队）
    └── workflow_metrics.md   # 工作流执行指标和效率追踪
```

### Axiom 状态机

```
IDLE → PLANNING → CONFIRMING → EXECUTING → AUTO_FIX → BLOCKED → ARCHIVING → IDLE
```

| 状态 | 描述 | 可转换到 |
|------|------|---------|
| `IDLE` | 系统就绪，等待指令 | `PLANNING` |
| `PLANNING` | 正在生成 PRD 或任务计划 | `CONFIRMING`, `IDLE` |
| `CONFIRMING` | 等待用户确认 PRD | `EXECUTING`, `PLANNING` |
| `EXECUTING` | 正在执行原子任务 | `AUTO_FIX`, `BLOCKED`, `ARCHIVING` |
| `AUTO_FIX` | 自动修复失败（最多 3 次） | `EXECUTING`, `BLOCKED` |
| `BLOCKED` | 需要人工介入 | `EXECUTING`（人工解锁后） |
| `ARCHIVING` | 自动触发 `/ax-reflect` | `IDLE` |

### 进化引擎自动行为

| 触发事件 | 自动行为 |
|---------|---------|
| 任务完成 | 将代码变更加入 `learning_queue.md` |
| 错误修复成功 | 将修复模式加入学习队列（P1 优先级） |
| 工作流完成 | 更新 `workflow_metrics.md` |
| 状态 → ARCHIVING | 自动触发 `/ax-reflect` |
| 状态 → IDLE | 处理 P0/P1 优先级的学习队列条目 |

### 多工具适配器

Axiom 配置可跨多个 AI 工具复用：

| 适配器文件 | 目标工具 |
|-----------|---------|
| `.kiro/steering/axiom.md` | Kiro |
| `.cursorrules` | Cursor |
| `.gemini/GEMINI.md` | Gemini |
| `.gemini/GEMINI-CLI.md` | Gemini CLI |
| `.opencode/OPENCODE.md` | OpenCode CLI |
| `.github/copilot-instructions.md` | GitHub Copilot |

---

## Execution Modes Deep Dive

ultrapower 提供 6 种执行模式，覆盖从单任务自动化到大规模并行开发的所有场景。

### autopilot

**触发词：** "autopilot"、"build me"、"I want a"

**描述：** 从想法到经过验证的可运行代码的全自主 5 阶段执行流水线。

**5 阶段工作流：**

```
想法输入
  ↓
[1] Expansion（analyst + architect）
    - 需求澄清和技术规格生成
    - 输出：.omc/autopilot/spec.md
  ↓
[2] Planning（architect + critic 验证）
    - 生成带依赖图的执行计划
    - 输出：.omc/plans/autopilot-impl.md
  ↓
[3] Execution（ralph + ultrawork 并行）
    - 并行执行计划任务（最多 5 个并发）
    - 输出：实际代码变更
  ↓
[4] QA（ultraQA 循环）
    - 测试、修复，最多 5 个修复循环
    - 通过条件：build + lint + test 全部通过
  ↓
[5] Validation（functional + security + quality 三重验证）
    - 专业 architect 角色执行
    - 裁决：APPROVED / REJECTED / NEEDS_FIX
```

**配置选项：**

```typescript
interface AutopilotConfig {
  maxIterations?: number;           // 默认：10
  maxExpansionIterations?: number;  // 默认：2
  maxArchitectIterations?: number;  // 默认：5
  maxQaCycles?: number;             // 默认：5
  maxValidationRounds?: number;     // 默认：3
  parallelExecutors?: number;       // 默认：5
  pauseAfterExpansion?: boolean;    // 默认：false
  pauseAfterPlanning?: boolean;     // 默认：false
  skipQa?: boolean;                 // 默认：false
  skipValidation?: boolean;         // 默认：false
  autoCommit?: boolean;             // 默认：false
}
```

**状态持久化：** `.omc/state/autopilot-state.json`

**恢复方式：** 中断后自动检测并提示是否从上次阶段继续。

---

### ultrawork

**触发词：** "ulw"、"ultrawork"

**描述：** 最大并行度的 agent 编排，适用于可并行分解的大型任务。

**核心机制：**
- 将任务分解为独立子任务，最大化并行执行
- 使用 `run_in_background: true` 实现非阻塞并发（最多 20 个并发）
- 子任务完成后自动聚合结果
- 冲突检测：避免多个 agent 同时修改同一文件

**适用场景：**
- 多模块重构（每个模块由独立 executor 处理）
- 批量文件转换
- 并行测试生成
- 多服务代码审查

---

### ralph

**触发词：** "ralph"、"don't stop"、"must complete"、"don't stop until"

**描述：** 带 verifier 验证的自引用持续执行循环，"不完成不停止"。

**执行逻辑：**

```
执行任务
  ↓
verifier 评估
  ├── APPROVED → 停止，报告完成
  ├── NEEDS_FIX → 修复 → 重新执行（返回顶部）
  └── FAILED（超过最大尝试次数）→ 报告阻塞
```

**包含 ultrawork：** ralph 内部使用 ultrawork 实现并行执行，是 ultrawork 的持久性包装器。

**与 team 组合：** `team ralph "task"` 同时激活团队协调和持续执行，两者状态文件相互关联（`linked_team`/`linked_ralph`）。

**状态持久化：** `.omc/state/ralph-state.json`

---

### ultrapilot

**触发词：** "ultrapilot"、"parallel build"

**描述：** Team 的兼容性外观，映射到 Team 的分阶段运行时，支持文件所有权管理的并行 autopilot。

**与 autopilot 的区别：** ultrapilot 通过文件所有权追踪（file ownership tracking）防止多个 executor 同时修改同一文件，适合大型功能开发。

**注意：** autopilot 和 ultrapilot 互斥，同时只能运行一个。

**状态持久化：** `.omc/state/ultrapilot-state.json`

---

### swarm

**触发词：** "swarm"、"swarm N agents"

**描述：** Team 的兼容性外观，保留 `/swarm` 语法，路由到 Team 分阶段流水线。

**任务协调机制：**
- 使用 `better-sqlite3` 实现 SQLite 任务认领
- N 个并发 executor 竞争认领任务队列中的任务
- 通过数据库锁防止重复执行
- 每个 executor 独立处理已认领任务

**适用场景：** 大量同质化任务（如批量代码审查、批量测试生成）。

---

### pipeline

**触发词：** "pipeline"、"chain agents"

**描述：** 带结构化数据传递的顺序 agent 链式执行，前一个 agent 的输出作为后一个的输入。

**数据传递格式：**

```typescript
interface PipelineStage {
  agent: string;
  model?: string;
  input: string | PipelineOutput;  // 来自上一阶段的输出
  output?: PipelineOutput;
}
```

**适用场景：** 有明确依赖顺序的多步骤工作流（如：explore → analyze → plan → execute → verify）。

**状态持久化：** `.omc/state/pipeline-state.json`

---

### 模式优先级与冲突解决

| 情况 | 行为 |
|------|------|
| 同时检测到 `ulw` 和 `ultrawork` | 显式模式关键词覆盖通用词 |
| 通用词 "fast"/"parallel" | 读取 `~/.claude/.omc-config.json` → `defaultExecutionMode` |
| `team` + `ralph` 同时触发 | 两者都激活，状态文件相互关联 |
| `autopilot` + `ultrapilot` | 互斥，后触发的覆盖前者（给出警告） |
| ralph 已激活 | 包含 ultrawork，不需要额外触发 |

### Team Pipeline（所有模式的底层基础）

所有协调模式最终都路由到 Team 的分阶段流水线：

```
team-plan → team-prd → team-exec → team-verify → team-fix（循环）
```

| 阶段 | 主要 Agent | 可选 Agent |
|------|-----------|-----------|
| `team-plan` | explore (haiku) + planner (opus) | analyst, architect |
| `team-prd` | analyst (opus) | product-manager, critic |
| `team-exec` | executor (sonnet) | designer, build-fixer, writer, test-engineer, deep-executor |
| `team-verify` | verifier (sonnet) | security-reviewer, code-reviewer, quality-reviewer, performance-reviewer |
| `team-fix` | 按缺陷类型 | executor / build-fixer / debugger |

---

## Hook System

ultrapower 通过 hooks 在工具调用的生命周期各节点插入自定义逻辑，实现事件驱动的增强功能。

### Hook 事件类型

hooks 监听以下 15 类事件：

| 事件 | 时机 | 常见用途 |
|------|------|---------|
| `PreToolUse` | 工具调用前 | 输入验证、模型注入、门禁检查 |
| `PostToolUse` | 工具调用后 | 结果记录、状态更新、学习触发 |
| `SessionStart` | 会话启动 | 记忆加载、上下文恢复 |
| `SessionEnd` | 会话结束 | 状态保存、知识收割 |
| `ToolError` | 工具调用失败 | 错误记录、自动恢复 |
| `SubagentStart` | 子 agent 启动 | 委派追踪、开销记录 |
| `SubagentStop` | 子 agent 完成 | 结果聚合、成本统计 |
| `TaskCreate` | 任务创建 | 任务注册、依赖检查 |
| `TaskUpdate` | 任务状态变更 | 进度追踪、阶段转换 |
| `MessageReceive` | 收到消息 | 意图识别、skill 触发 |
| `PermissionRequest` | 权限请求 | 权限过滤、安全审查 |
| `Setup` | 初始化配置 | 环境检查、工具注册 |
| `ModeChange` | 执行模式切换 | 状态文件切换、清理 |
| `ToolSearch` | 工具发现 | MCP 工具延迟加载 |
| `Stop` | 执行停止 | 清理、最终状态写入 |

### Hook 输入格式

所有 hook 输入使用 snake_case 字段：

```typescript
interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response?: Record<string, unknown>;
  session_id: string;
  cwd: string;
  hook_event_name: HookEventType;
}
```

**重要：** `session-end` hook 必须包含 `sessionId` 和 `directory` 字段，否则验证失败。

### 安全规则

**Hook 输入消毒：** 所有 hook 输入经 `bridge-normalize.ts` 白名单过滤，未知字段被丢弃：

```typescript
// bridge-normalize.ts 中的严格白名单
const ALLOWED_FIELDS = {
  'permission-request': ['tool_name', 'session_id', 'cwd'],
  'setup': ['session_id', 'cwd', 'version'],
  'session-end': ['sessionId', 'directory', 'duration_ms']
};
```

**SubagentStop 推断：** 禁止直接读取 `input.success`，必须使用 `input.success !== false`：

```typescript
// 错误方式
const succeeded = input.success;  // 可能为 undefined，被误判为 false

// 正确方式
const succeeded = input.success !== false;  // undefined 视为成功
```

### 终止开关

```bash
DISABLE_OMC=true                    # 禁用所有 hooks
OMC_SKIP_HOOKS=axiom-boot,ralph     # 按名称跳过特定 hooks
```

### 关键 Hook 列表

| Hook | 位置 | 功能 |
|------|------|------|
| `autopilot` | `src/hooks/autopilot/` | 全自主执行阶段管理 |
| `ralph` | `src/hooks/ralph/` | 持续执行循环控制 |
| `ultrawork` | `src/hooks/ultrawork/` | 并行执行协调 |
| `ultrapilot` | `src/hooks/ultrapilot/` | 文件所有权追踪 |
| `learner` | `src/hooks/learner/` | Skill 提取和学习 |
| `recovery` | `src/hooks/recovery/` | 错误恢复和重试 |
| `rules-injector` | `src/hooks/rules-injector/` | 规则文件自动注入 |
| `think-mode` | `src/hooks/think-mode/` | 增强推理模式激活 |
| `axiom-boot` | `src/hooks/axiom-boot/` | Axiom 记忆上下文加载 |
| `axiom-guards` | `src/hooks/axiom-guards/` | Axiom 门禁规则执行 |
| `bridge-normalize` | `src/hooks/bridge-normalize.ts` | Hook 输入白名单消毒 |
| `subagent-tracker` | `src/hooks/subagent-tracker/` | 子 agent 生命周期追踪 |
| `delegation-enforcer` | `src/hooks/bridge.ts` | 自动模型注入（v5.5.2 新增） |

### Hook 上下文注入

Hooks 通过 `<system-reminder>` 标签向对话注入上下文。识别模式：

```
hook success: Success          → 正常继续
hook additional context: ...  → 读取相关上下文
[MAGIC KEYWORD: skill-name]   → 立即调用指定 skill
The boulder never stops       → 处于 ralph/ultrawork 模式，继续工作
```

---

## Windows Support

v5.5.x 系列修复了在 Windows 平台上的多个兼容性问题，确保 ultrapower 在 Windows 11 / PowerShell 环境下稳定运行。

### v5.5.1 修复项

#### `which` / `where` 分支

**问题：** `which` 命令在 Windows 上不存在，导致工具检测失败。

**修复：** 检测系统平台，Windows 上使用 `where` 命令替代 `which`：

```typescript
// 修复前
const toolPath = execSync(`which ${toolName}`).toString().trim();

// 修复后
const isWindows = process.platform === 'win32';
const cmd = isWindows ? `where ${toolName}` : `which ${toolName}`;
const toolPath = execSync(cmd).toString().trim().split('\n')[0];
```

**影响文件：** `src/tools/lsp/servers.ts`、`src/tools/lsp/client.ts`

#### `path.relative()` 路径分隔符

**问题：** Windows 上 `path.relative()` 返回反斜杠 `\`，导致 URI 和模式匹配失败。

**修复：** 统一将路径分隔符转换为正斜杠：

```typescript
// 修复后
const relativePath = path.relative(root, filePath).replace(/\\/g, '/');
```

**影响文件：** `src/hooks/bridge-normalize.ts`、`src/tools/lsp/client.ts`

#### `os.tmpdir()` 临时目录

**问题：** 硬编码 `/tmp/` 路径在 Windows 上不存在。

**修复：** 使用 `os.tmpdir()` 获取平台无关的临时目录：

```typescript
// 修复前
const tmpPath = `/tmp/omc-${sessionId}.json`;

// 修复后
import os from 'os';
const tmpPath = path.join(os.tmpdir(), `omc-${sessionId}.json`);
```

**影响文件：** `src/notifications/session-registry.ts`、`src/team/mcp-team-bridge.ts`

#### `pathToFileURL()` 文件 URI

**问题：** Windows 路径（如 `C:\Users\...`）直接拼接为 `file:///C:\Users\...` 格式不正确，LSP 服务器无法识别。

**修复：** 使用 `url.pathToFileURL()` 生成正确的文件 URI：

```typescript
// 修复前
const uri = `file://${filePath}`;

// 修复后
import { pathToFileURL } from 'url';
const uri = pathToFileURL(filePath).toString();
// 输出：file:///C:/Users/...（正确格式）
```

**影响文件：** `src/tools/lsp/client.ts`

### v5.5.x 其他改进

| 版本 | 改进项 |
|------|-------|
| v5.5.1 | PowerShell 默认 shell 检测 |
| v5.5.1 | Windows 行尾符（CRLF）处理 |
| v5.5.2 | 文件路径比较使用 `path.normalize()` 确保一致性 |
| v5.5.3 | LSP 服务器 Windows 可执行文件后缀处理（`.cmd`、`.exe`） |
| v5.5.4 | Git worktree 路径在 Windows 上的规范化 |
| v5.5.5 | 子进程 `shell: true` 选项确保 Windows 命令可执行 |

### 环境检测

ultrapower 在运行时检测操作系统并调整行为：

```typescript
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

// Shell 选择
const defaultShell = isWindows ? 'powershell.exe' : '/bin/bash';
```

---

## MCP Routing

ultrapower 通过 MCP（Model Context Protocol）集成外部 AI 提供商，实现专业化任务委派，同时支持延迟工具发现。

### 提供商概览

| 提供商 | 工具前缀 | 模型 | 特长 |
|--------|---------|------|------|
| Codex (GPT) | `mcp__x__ask_codex` | gpt-5.3-codex | 代码分析、架构审查、批判性分析 |
| Gemini | `mcp__g__ask_gemini` | gemini-3-pro-preview | 大上下文（1M token）、UI/UX、视觉分析 |

### 延迟工具发现

**重要机制：** MCP 工具是延迟加载的，在会话开始时不在工具列表中。使用前必须通过 `ToolSearch` 触发发现：

```typescript
// 推荐：一次性发现所有 MCP 工具
ToolSearch("mcp")

// 按需发现
ToolSearch("ask_codex")   // 发现 Codex 工具
ToolSearch("ask_gemini")  // 发现 Gemini 工具
```

**如果 ToolSearch 返回无结果：** MCP 服务器未配置，回退到等效的 Claude agent，不阻塞工作流。

### Codex（GPT）路由

**工具：** `mcp__x__ask_codex`

**最适合角色：**

| 角色 | 适用场景 |
|------|---------|
| `architect` | 系统设计评审、接口设计建议 |
| `planner` | 执行计划验证、任务排序 |
| `critic` | 批判性分析、计划缺陷发现 |
| `analyst` | 需求澄清、验收标准制定 |
| `code-reviewer` | 代码质量综合审查 |
| `security-reviewer` | 漏洞分析、信任边界审查 |
| `tdd-guide` | 测试策略、覆盖率分析 |

**调用示例：**

```typescript
mcp__x__ask_codex({
  agent_role: 'security-reviewer',
  prompt: '审查以下认证代码，识别潜在的安全漏洞...',
  context_files: ['src/auth/login.ts', 'src/auth/session.ts']
})
```

### Gemini 路由

**工具：** `mcp__g__ask_gemini`

**最适合角色：**

| 角色 | 适用场景 |
|------|---------|
| `designer` | UI/UX 设计审查、组件设计建议 |
| `writer` | 文档生成、迁移指南、用户手册 |
| `vision` | 截图分析、图表解读、UI 元素识别 |

**大上下文优势：** Gemini 支持 1M token 上下文，适合整个代码库级别的分析。

**调用示例：**

```typescript
mcp__g__ask_gemini({
  agent_role: 'designer',
  prompt: '分析这个组件的 UX 问题并提供改进建议...',
  files: ['src/components/Dashboard.tsx', 'src/styles/dashboard.css']
})
```

### 后台模式

使用 `background: true` 提交后台任务，最多等待 1 小时：

```typescript
// 提交后台任务
const jobId = await mcp__x__ask_codex({
  background: true,
  agent_role: 'code-reviewer',
  prompt: '全量代码审查...',
  context_files: ['src/']
})

// 检查状态
const status = await check_job_status(jobId)

// 等待完成（最多 1 小时）
const result = await wait_for_job(jobId)
```

### 路由决策准则

| 任务类型 | 推荐路由 | 原因 |
|---------|---------|------|
| 架构审查 | Codex (`architect`) | 代码分析能力强 |
| 规划验证 | Codex (`planner`) | 批判性分析准确 |
| 安全审查 | Codex (`security-reviewer`) | 漏洞识别专项优化 |
| UI 设计审查 | Gemini (`designer`) | 视觉理解能力强 |
| 文档生成 | Gemini (`writer`) | 大上下文，全库感知 |
| 图表分析 | Gemini (`vision`) | 多模态原生支持 |
| 实现/调试 | Claude agent（executor/debugger） | 需要工具访问权限 |
| 代码编辑 | Claude agent（executor） | 只有 Claude 可以直接修改文件 |

### 无 MCP 替代品的 Agent

以下 agents 需要 Claude 的工具访问权限，无法通过 MCP 提供商替代：

- `executor`、`deep-executor`：需要文件编辑工具
- `explore`：需要 Glob/Grep/Read 工具
- `debugger`、`verifier`：需要运行构建和测试命令
- `dependency-expert`：需要联网工具
- `scientist`：需要 Python REPL 工具
- `build-fixer`：需要文件编辑和构建工具
- `qa-tester`：需要进程启动工具
- `git-master`：需要 git 命令执行
- 所有审查通道 agents（review lane）
- 所有产品通道 agents（product lane）

### 本地 MCP 工具

通过 `claude mcp add` 配置的本地工具，无需 API key：

| 工具 | 适用场景 |
|------|---------|
| `sequential-thinking` | 架构决策分析、根因排查、多步骤规划 |
| `software-planning-tool` | 需求拆解、sprint 规划、技术方案评估 |

### 安全约束

MCP 输出被包装为不可信内容，应用以下约束：

- `prompt_file` 和 `output_file` 路径相对于 `working_directory` 解析
- 受 `OMC_MCP_OUTPUT_PATH_POLICY` 控制：`strict`（默认）或 `redirect_output`
- MCP 输出是建议性的，验证（测试、类型检查）必须由 Claude agent 执行
- 未配置的 MCP 服务器静默失败，回退到等效 Claude agent

---

## 参见

- [CHANGELOG.md](../CHANGELOG.md) — 版本历史和发布说明
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 系统架构设计
- [REFERENCE.md](./REFERENCE.md) — 完整 API 参考（agents/skills/hooks 列表）
- [MIGRATION.md](./MIGRATION.md) — 版本迁移指南
- [COMPATIBILITY.md](./COMPATIBILITY.md) — 兼容性要求
- [Agent Definitions](../src/agents/definitions.ts) — Agent 规范配置
- [Hook Bridge](../src/hooks/bridge.ts) — Delegation Enforcer 实现
