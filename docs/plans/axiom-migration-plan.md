# Axiom → ultrapower 深度融合迁移计划

> 日期：2026-02-24 | 状态：待执行 | 策略：深度融合

## 一、迁移总览

### 目标
将 Axiom 的全部核心能力（记忆系统、工作流系统、门禁系统、进化引擎、9个适配器）深度融合到 ultrapower 架构中，形成统一的增强型多 Agent 编排系统。

### 架构映射关系

```
Axiom 组件                    → ultrapower 融合目标
─────────────────────────────────────────────────────────────
.agent/config/agent_config.md → .omc/axiom-config.md (Provider 路由配置)
.agent/adapters/              → .claude/ + AGENTS.md (适配器文件)
.agent/memory/active_context  → .omc/state/axiom-context.json (StateManager)
.agent/memory/project_decisions → .omc/project-memory.json (project_memory)
.agent/memory/evolution/      → .omc/axiom-evolution/ (进化引擎数据)
.agent/workflows/1-drafting   → skills/axiom-draft/SKILL.md
.agent/workflows/2-reviewing  → skills/axiom-review/SKILL.md
.agent/workflows/3-decomposing → skills/axiom-decompose/SKILL.md
.agent/workflows/4-implementing → skills/axiom-implement/SKILL.md
.agent/workflows/analyze-error → skills/axiom-analyze-error/SKILL.md
.agent/workflows/reflect      → skills/axiom-reflect/SKILL.md
.agent/workflows/evolve       → skills/axiom-evolve/SKILL.md
.agent/workflows/start        → src/hooks/axiom-boot/index.ts
.agent/workflows/status       → skills/axiom-status/SKILL.md
.agent/workflows/rollback     → skills/axiom-rollback/SKILL.md
.agent/workflows/suspend      → skills/axiom-suspend/SKILL.md
.agent/guards/                → src/hooks/axiom-guards/index.ts
.agent/skills/context-manager → skills/axiom-context/SKILL.md + agents/axiom-context-manager.md
.agent/skills/evolution-engine → skills/axiom-evolution/SKILL.md + agents/axiom-evolution-engine.md
.agent/skills/requirement-analyst → agents/axiom-requirement-analyst.md
.agent/skills/product-design-expert → agents/axiom-product-designer.md
.agent/skills/review-aggregator → agents/axiom-review-aggregator.md
.agent/skills/system-architect → agents/axiom-system-architect.md
.agent/skills/prd-crafter-lite → agents/axiom-prd-crafter.md
AGENTS.md (Worker 规范)       → agents/axiom-worker.md
```

---

## 二、分阶段实施计划

### Phase 1：基础设施层（无 TypeScript 改动）

**目标**：建立 Axiom 的文件结构骨架，零代码改动即可运行基础功能。

#### Task 1.1 — 创建 Axiom Agent 定义文件（7个）

在 `agents/` 目录创建以下文件，遵循 ultrapower 的 YAML frontmatter + `<Agent_Prompt>` XML 格式：

- `agents/axiom-requirement-analyst.md` — 需求分析师（PASS/CLARIFY/REJECT 三态门禁）
- `agents/axiom-product-designer.md` — 产品设计专家（Draft PRD + Mermaid 流程图）
- `agents/axiom-review-aggregator.md` — 评审聚合器（5专家并行 + 冲突仲裁）
- `agents/axiom-system-architect.md` — 系统架构师（DAG + Manifest 生成）
- `agents/axiom-prd-crafter.md` — PRD 工程师（工程级 PRD + 架构合规检查）
- `agents/axiom-context-manager.md` — 上下文管理器（7个操作 + 状态机）
- `agents/axiom-evolution-engine.md` — 进化引擎（知识收割 + 模式检测 + 反思）
- `agents/axiom-worker.md` — Worker Agent（PM→Worker 协作规范）

#### Task 1.2 — 创建 Axiom Skill 文件（12个）

在 `skills/` 目录创建以下 SKILL.md 文件：

- `skills/axiom-draft/SKILL.md` — `/axiom-draft` 需求起草工作流
- `skills/axiom-review/SKILL.md` — `/axiom-review` 专家评审工作流
- `skills/axiom-decompose/SKILL.md` — `/axiom-decompose` 任务拆解工作流
- `skills/axiom-implement/SKILL.md` — `/axiom-implement` 实施交付工作流
- `skills/axiom-analyze-error/SKILL.md` — `/axiom-analyze-error` 错误分析工作流
- `skills/axiom-reflect/SKILL.md` — `/axiom-reflect` 反思工作流
- `skills/axiom-evolve/SKILL.md` — `/axiom-evolve` 进化工作流
- `skills/axiom-status/SKILL.md` — `/axiom-status` 状态仪表盘
- `skills/axiom-rollback/SKILL.md` — `/axiom-rollback` 回滚工作流
- `skills/axiom-suspend/SKILL.md` — `/axiom-suspend` 暂停保存工作流
- `skills/axiom-context/SKILL.md` — `/axiom-context` 上下文管理
- `skills/axiom-evolution/SKILL.md` — `/axiom-evolution` 进化引擎触发

#### Task 1.3 — 创建记忆系统目录结构

```
.omc/axiom/
├── active_context.md          ← 当前任务状态（短期记忆）
├── project_decisions.md       ← 架构决策记录（长期记忆）
├── user_preferences.md        ← 用户偏好
├── state_machine.md           ← 状态机定义
├── reflection_log.md          ← 反思日志
└── evolution/
    ├── knowledge_base.md      ← 知识图谱索引
    ├── pattern_library.md     ← 代码模式库
    ├── learning_queue.md      ← 待处理学习素材
    └── workflow_metrics.md    ← 工作流执行指标
```

#### Task 1.4 — 迁移 9 个适配器文件

将 Axiom 适配器迁移到 ultrapower 对应位置：

| Axiom 源文件 | ultrapower 目标位置 |
|-------------|-------------------|
| `adapters/claude-code/CLAUDE-CODE.md` | 合并到项目 `CLAUDE.md` |
| `adapters/kiro/KIRO.md` | `.kiro/steering/axiom.md` |
| `adapters/cursor/.cursorrules` | `.cursorrules` |
| `adapters/codex/CODEX.md` | `AGENTS.md` (Codex 部分) |
| `adapters/gemini/GEMINI.md` | `.gemini/GEMINI.md` |
| `adapters/gemini-cli/GEMINI-CLI.md` | `.gemini/GEMINI-CLI.md` |
| `adapters/opencode/OPENCODE.md` | `.opencode/OPENCODE.md` |
| `adapters/copilot/copilot-instructions.md` | `.github/copilot-instructions.md` |
| `adapters/claude/CLAUDE.md` | 合并到 `~/.claude/CLAUDE.md` |

---

### Phase 2：Hook 集成层（TypeScript 扩展）

**目标**：将 Axiom 的启动协议和门禁系统集成到 ultrapower 的 Hook 事件流中。

#### Task 2.1 — 创建 axiom-boot Hook

文件：`src/hooks/axiom-boot/index.ts`

功能：
- 在 `UserPromptSubmit` 事件时触发
- 读取 `.omc/axiom/active_context.md`
- 检测 `task_status`（IDLE / EXECUTING / BLOCKED）
- EXECUTING 状态时注入恢复提示到上下文
- 通过 `contextCollector.register({ source: 'axiom-boot', priority: 'high' })` 注入

#### Task 2.2 — 创建 axiom-guards Hook

文件：`src/hooks/axiom-guards/index.ts`

功能（对应 Axiom 四大门禁）：
- Expert Gate：检测新功能请求，注入"需先经过 axiom-review 流程"提示
- User Gate：PRD 生成后注入用户确认要求
- Complexity Gate：检测工时估算 > 1 天时注入拆解建议
- CI Gate：代码变更后注入构建验证要求

#### Task 2.3 — 扩展 context-injector 类型

文件：`src/features/context-injector/types.ts`

添加新的 `ContextSourceType` 值：
- `'axiom-boot'` — 启动恢复上下文
- `'axiom-guards'` — 门禁规则上下文
- `'axiom-memory'` — 记忆系统上下文

#### Task 2.4 — 创建 axiom StateManager

文件：`src/hooks/axiom-boot/storage.ts`

使用现有 `createStateManager<T>('axiom-context')` 管理 Axiom 状态，映射到 `.omc/state/axiom-context.json`。

---

### Phase 3：进化引擎集成（增强现有系统）

**目标**：将 Axiom 的自进化能力融合到 ultrapower 的 project_memory 和 notepad 系统中。

#### Task 3.1 — 迁移知识库数据

将 Axiom 的 28 条知识条目（k-001 至 k-028）迁移到 ultrapower 的 project_memory：
- architecture 类 → `project_memory_add_note(category="architecture")`
- workflow 类 → `project_memory_add_note(category="workflow")`
- pattern 类 → `project_memory_add_directive(priority="high")`
- tooling 类 → `project_memory_add_note(category="build")`

#### Task 3.2 — 创建 learning_queue 处理机制

在 `skills/axiom-evolve/SKILL.md` 中定义：
- 读取 `.omc/axiom/evolution/learning_queue.md`
- 按 source_type 分类处理（code_change / error_fix / workflow_run）
- 更新 knowledge_base.md 和 pattern_library.md
- 调用 `project_memory_add_note` 持久化高置信知识

#### Task 3.3 — 迁移 pattern_library

将 Axiom 的 P-001 Markdown Workflow Pattern 迁移到 ultrapower：
- 写入 `.omc/axiom/evolution/pattern_library.md`
- 高置信模式（confidence >= 0.85）通过 `project_memory_add_directive` 持久化

---

### Phase 4：CLAUDE.md 增强（配置层融合）

**目标**：将 Axiom 的启动协议和工作流路由规则融合到 ultrapower 的 CLAUDE.md 配置中。

#### Task 4.1 — 更新项目 CLAUDE.md

在 `CLAUDE.md` 中添加 Axiom 集成部分：
- Axiom 启动协议（读取 active_context → 恢复状态）
- 工作流触发表（用户意图 → skill 命令映射）
- 门禁规则说明
- 知识利用优先级

#### Task 4.2 — 更新 AGENTS.md

将 Axiom 的 Worker 规范融合到 `AGENTS.md`：
- PM → Worker 协作模式
- 三种标准输出格式（QUESTION/COMPLETE/BLOCKED）
- 自修复策略和重试规则
- 质量门禁（强制）

---

### Phase 5：文档和测试

#### Task 5.1 — 更新 REFERENCE.md

记录所有新增的 Axiom skills 和 agents。

#### Task 5.2 — 创建迁移验证脚本

验证所有文件已正确创建，所有 skill 可被 ultrapower 加载。

---

## 三、文件创建清单（完整）

### 新增 Agent 文件（8个）
```
agents/axiom-requirement-analyst.md
agents/axiom-product-designer.md
agents/axiom-review-aggregator.md
agents/axiom-system-architect.md
agents/axiom-prd-crafter.md
agents/axiom-context-manager.md
agents/axiom-evolution-engine.md
agents/axiom-worker.md
```

### 新增 Skill 文件（12个）
```
skills/axiom-draft/SKILL.md
skills/axiom-review/SKILL.md
skills/axiom-decompose/SKILL.md
skills/axiom-implement/SKILL.md
skills/axiom-analyze-error/SKILL.md
skills/axiom-reflect/SKILL.md
skills/axiom-evolve/SKILL.md
skills/axiom-status/SKILL.md
skills/axiom-rollback/SKILL.md
skills/axiom-suspend/SKILL.md
skills/axiom-context/SKILL.md
skills/axiom-evolution/SKILL.md
```

### 新增 Hook 文件（TypeScript）
```
src/hooks/axiom-boot/index.ts
src/hooks/axiom-boot/types.ts
src/hooks/axiom-boot/storage.ts
src/hooks/axiom-guards/index.ts
src/hooks/axiom-guards/types.ts
src/hooks/axiom-guards/constants.ts
```

### 新增记忆系统文件
```
.omc/axiom/active_context.md
.omc/axiom/project_decisions.md
.omc/axiom/user_preferences.md
.omc/axiom/state_machine.md
.omc/axiom/reflection_log.md
.omc/axiom/evolution/knowledge_base.md
.omc/axiom/evolution/pattern_library.md
.omc/axiom/evolution/learning_queue.md
.omc/axiom/evolution/workflow_metrics.md
```

### 新增适配器文件（9个）
```
.kiro/steering/axiom.md
.cursorrules
.gemini/GEMINI.md
.gemini/GEMINI-CLI.md
.opencode/OPENCODE.md
.github/copilot-instructions.md
```

### 修改现有文件
```
CLAUDE.md                              ← 添加 Axiom 启动协议和工作流路由
AGENTS.md                              ← 添加 Worker 规范
src/hooks/index.ts                     ← 注册新 hooks
src/features/context-injector/types.ts ← 添加新 ContextSourceType
```

---

## 四、执行顺序

```
Phase 1 (并行) → Phase 2 (顺序) → Phase 3 (并行) → Phase 4 (顺序) → Phase 5
     ↓                ↓                ↓                ↓
  Task 1.1-1.4    Task 2.1-2.4    Task 3.1-3.3    Task 4.1-4.2
  (纯文件创建)    (TypeScript)    (数据迁移)      (配置更新)
```

**Phase 1 可完全并行执行**（4个独立任务）
**Phase 2 需顺序执行**（2.3 依赖 2.1/2.2 的类型需求）
**Phase 3 可完全并行执行**（3个独立任务）
**Phase 4 需顺序执行**（4.2 依赖 4.1 的上下文）

---

## 五、验收标准

- [ ] 所有 8 个 Axiom agent 文件存在且格式正确
- [ ] 所有 12 个 Axiom skill 文件存在且可被 ultrapower 加载
- [ ] `/axiom-draft`、`/axiom-review`、`/axiom-decompose`、`/axiom-implement` 命令可用
- [ ] `/axiom-status`、`/axiom-reflect`、`/axiom-evolve` 命令可用
- [ ] axiom-boot hook 在会话启动时正确读取 active_context
- [ ] axiom-guards hook 正确注入门禁规则
- [ ] 记忆系统目录结构完整
- [ ] 9 个适配器文件已迁移到正确位置
- [ ] 28 条知识条目已迁移到 project_memory
- [ ] CLAUDE.md 包含 Axiom 启动协议
- [ ] AGENTS.md 包含 Worker 规范
