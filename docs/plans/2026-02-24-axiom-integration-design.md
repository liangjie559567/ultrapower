# Axiom → ultrapower 集成设计文档

> **For Claude:** REQUIRED SUB-SKILL: Use `ultrapower:writing-plans` to create the implementation plan after this design is approved.

**目标：** 将 Axiom `.agent/` 配置体系完整集成到 ultrapower v5.0.2，包括 8 个 AI 适配器、6 个角色提示词、18 个工作流、规则引擎、知识库、记忆系统（TypeScript 重写）、进化引擎（TypeScript 重写）和守卫系统（TypeScript 重写）。

**架构方向：** 三阶段渐进式集成——Phase 1 直接迁移 Markdown 文件，Phase 2 内容组织与知识库及配置，Phase 3 Python→TypeScript 重写核心引擎。

**技术栈：** TypeScript/Node.js（ultrapower），Markdown（适配器/角色/工作流），JSON（状态/记忆），SQLite（swarm 任务协调）

---

## 技术栈兼容性矩阵

| 模块 | 来源 | 目标 | 策略 | 优先级 |
|------|------|------|------|--------|
| adapters/ (7 个 AI 工具) | `.agent/adapters/` | `.codex/`, `.gemini/`, `.kiro/` 等 | 直接迁移 | P1 |
| adapters/claude | `.agent/adapters/claude/` | 项目根 `CLAUDE.md` | 合并追加 | P1 |
| prompts/roles/ (6 个角色) | `.agent/prompts/roles/` | `agents/` Markdown 提示词 | 合并增强 | P1 |
| workflows/ (18 个工作流) | `.agent/workflows/` | `skills/` SKILL.md | 合并/新建 | P1 |
| prompts/templates/ | `.agent/prompts/templates/` | `templates/axiom/` | 直接迁移 | P1 |
| rules/ (.rule 文件) | `.agent/rules/` | `templates/rules/` | 直接迁移 | P1 |
| knowledge/ (独立目录) | `.agent/knowledge/` | `.omc/knowledge/axiom-patterns/` | 直接迁移 | P2 |
| memory/knowledge/ (25+ 条目) | `.agent/memory/knowledge/` | `.omc/knowledge/` | 直接迁移 | P2 |
| memory/ (Markdown 文件) | `.agent/memory/*.md` | `.omc/axiom/` | 直接迁移 | P2 |
| config/config_loader.py | `.agent/config/` | `src/config/axiom-config.ts` | TypeScript 重写 | P2 |
| scripts/ (PowerShell) | `.agent/scripts/` | `templates/axiom/scripts/` | 归档 | P2 |
| context_manager.py | `.agent/memory/` | `src/hooks/memory/` | TypeScript 重写 | P3 |
| evolution/ (Python 引擎) | `.agent/evolution/` | `src/hooks/learner/` 增强 | TypeScript 重写 | P3 |
| guards/ Git hooks | `.agent/guards/pre-commit` 等 | `scripts/hooks/` | Shell 脚本迁移 | P3 |
| guards/ Claude hooks | 新增 | `src/hooks/guards/` | TypeScript 新增 | P3 |
| axiom-* agents | `.agent/skills/` | `agents/axiom-*.md` 增强 | 增强现有文件 | P3 |

---

## Phase 依赖关系

```
Phase 1（Markdown 迁移）← 无依赖，可立即执行
    ↓
Phase 2（知识库 + 记忆文件 + config）← 依赖 Phase 1 完成
    ↓
Phase 3（TypeScript 重写）← 依赖 Phase 2 完成
    Task 10（Context Manager）← 依赖 .omc/axiom/ 目录（Phase 2 Task 9）
    Task 11-12（Evolution Engine）← 依赖 Task 10 + axiom-config.ts（Phase 2）
    Task 13（Guards）← 依赖 .omc/axiom/active_context.md（Phase 2 Task 9）
    Task 14（Agents 增强）← 独立，仅依赖 Phase 1 完成
```

---

## Phase 1：直接 Markdown 迁移

### 1.1 AI 适配器集成

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\`

**目标映射：**

| Axiom 适配器 | 目标路径 | 操作 |
|-------------|---------|------|
| `adapters/claude/CLAUDE.md` | 项目根 `CLAUDE.md` | 合并追加（PM→Worker 协议、三态输出） |
| `adapters/claude-code/CLAUDE-CODE.md` | `docs/CLAUDE.md` | 合并增强 |
| `adapters/codex/CODEX.md` | `.codex/AGENTS.md` | 新建 |
| `adapters/gemini/GEMINI.md` | `.gemini/GEMINI.md` | 新建 |
| `adapters/gemini-cli/GEMINI-CLI.md` | `.gemini/GEMINI-CLI.md` | 新建 |
| `adapters/copilot/copilot-instructions.md` | `.github/copilot-instructions.md` | 新建 |
| `adapters/cursor/.cursorrules` | `.cursorrules` | 新建 |
| `adapters/kiro/KIRO.md` | `.kiro/steering/axiom.md` | 新建 |
| `adapters/opencode/OPENCODE.md` | `.opencode/AGENTS.md` | 新建 |

**合并策略：** 保留 ultrapower 现有内容，追加 Axiom 的 PM→Worker 协议、三态输出格式（QUESTION/BLOCKED/COMPLETE）和 Boot Protocol。

**注意：** `adapters/claude/CLAUDE.md` 合并到项目根目录 `CLAUDE.md`（非 `.claude/CLAUDE.md`），避免与全局用户配置冲突。

### 1.2 角色提示词 → Agent 增强

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\prompts\roles\`

**目标映射：**

| Axiom 角色 | 目标 ultrapower Agent | 操作 |
|-----------|----------------------|------|
| `critic.md` | `agents/critic.md` | 合并增强（已有 critic agent） |
| `tech_lead.md` | `agents/architect.md` | 合并增强（已有 architect agent） |
| `product_director.md` | `agents/product-manager.md` | 合并增强 |
| `ux_director.md` | `agents/ux-researcher.md` | 合并增强 |
| `domain_expert.md` | `agents/analyst.md` | 合并增强 |
| `sub_prd_writer.md` | `agents/writer.md` | 合并增强 |

**合并策略：** 提取 Axiom 角色中的独特指令（如 tech_lead 的代码审查清单、critic 的三维评估框架），追加到对应 ultrapower agent 提示词末尾。

### 1.3 工作流 → Skill 增强/新建

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\`

**目标映射：**

| Axiom 工作流 | 目标 ultrapower Skill | 操作 |
|-------------|----------------------|------|
| `1-drafting.md` | `skills/brainstorming/` | 合并增强 |
| `2-reviewing.md` | `skills/requesting-code-review/` | 合并增强 |
| `3-decomposing.md` | `skills/writing-plans/` | 合并增强 |
| `4-implementing.md` | `skills/executing-plans/` | 合并增强 |
| `analyze-error.md` | `skills/systematic-debugging/` | 合并增强 |
| `evolve.md` | `skills/learner/` | 合并增强 |
| `feature-flow.md` | `skills/subagent-driven-development/` | 合并增强 |
| `init.md` / `start.md` | `skills/deepinit/` | 合并增强 |
| `reflect.md` | 新建 `skills/ax-reflect/` | 新建 |
| `rollback.md` | 新建 `skills/ax-rollback/` | 新建 |
| `status.md` / `meta.md` | 新建 `skills/ax-status/` | 新建（合并两者） |
| `suspend.md` / `suspend1.md` | 新建 `skills/ax-suspend/` | 新建（合并两者） |
| `knowledge.md` / `patterns.md` | 新建 `skills/ax-knowledge/` | 新建（合并两者） |
| `export.md` | 新建 `skills/ax-export/` | 新建 |
| `codex-dispatch.md` | `skills/ccg/` | 合并增强（已有 Codex 调度） |
| `use-flutter-template.md` | 归档 | Flutter 特定，不集成 |

### 1.4 prompts/templates/ 迁移

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\prompts\templates\`

**目标：** `templates/axiom/`

| 文件 | 目标路径 |
|------|---------|
| `dag_analysis.md` | `templates/axiom/dag-analysis.md` |
| `task_execution.md` | `templates/axiom/task-execution.md` |

### 1.5 规则引擎迁移

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\rules\`

**目标：** `templates/rules/`

| Axiom 规则文件 | 目标路径 |
|--------------|---------|
| `gatekeepers.rule` | `templates/rules/axiom-gatekeepers.md` |
| `provider_router.rule` | `templates/rules/axiom-provider-router.md` |
| `router.rule` | `templates/rules/axiom-router.md` |
| `skills.rule` | `templates/rules/axiom-skills.md` |

---

## Phase 2：内容组织与知识库及配置

### 2.1 memory/knowledge/ 迁移（25+ 条目）

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\memory\knowledge\`（25+ 条目）

**目标：** `.omc/knowledge/`（新建目录）

**迁移策略：**
- 直接复制所有 `k-001` 到 `k-025` 的 Markdown 文件
- 保留原始文件名和内容
- 新增 `index.md` 作为知识库索引

**知识条目分类：**
- `k-001` 到 `k-005`：通用 Agent 模式（直接适用于 ultrapower）
- `k-006` 到 `k-020`：Flutter/Dart 相关（保留但标记为项目特定）
- `k-021` 到 `k-025`：通用开发规范（直接适用）

### 2.2 knowledge/ 独立目录迁移

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\knowledge\`（architecture/、pattern/、tooling/ 子目录）

**目标：** `.omc/knowledge/axiom-patterns/`

**迁移策略：** 直接复制，保留子目录结构。

### 2.3 记忆系统 Markdown 文件迁移

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\memory\`

**目标：** `.omc/axiom/`（新建目录）

| 文件 | 目标 | 用途 |
|------|------|------|
| `project_decisions.md` | `.omc/axiom/project_decisions.md` | 项目决策记录 |
| `user_preferences.md` | `.omc/axiom/user_preferences.md` | 用户偏好 |
| `active_context.md` | `.omc/axiom/active_context.md` | 活跃上下文 |
| `reflection_log.md` | `.omc/axiom/reflection_log.md` | 反思日志 |
| `state_machine.md` | `.omc/axiom/state_machine.md` | 状态机定义 |
| `evolution/knowledge_base.md` | `.omc/axiom/evolution/knowledge_base.md` | 进化知识库 |
| `evolution/pattern_library.md` | `.omc/axiom/evolution/pattern_library.md` | 模式库 |

### 2.4 Config 模块迁移（TypeScript 重写）

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\config\config_loader.py`

**目标：** `src/config/axiom-config.ts`

**核心功能：**
- `ACTIVE_PROVIDER` 路由（claude/codex/gemini）
- Evolution 参数：`min_confidence: 0.5`、`seed_confidence: 0.85`、`decay_days: 30`、`max_learning_queue: 50`、`pattern_min_occurrences: 3`
- Dispatcher timeout tiers：`simple: 600s`、`medium: 900s`、`complex: 1200s`
- `max_restarts: 3`

**TypeScript 接口：**
```typescript
export interface AxiomConfig {
  activeProvider: 'claude' | 'codex' | 'gemini';
  evolution: {
    minConfidence: number;
    seedConfidence: number;
    decayDays: number;
    maxLearningQueue: number;
    patternMinOccurrences: number;
  };
  dispatcher: {
    maxRestarts: number;
    timeoutTiers: { simple: number; medium: number; complex: number };
  };
}
```

**注意：** 此模块是 Phase 3 Evolution Engine 的依赖，必须在 Phase 2 完成。

### 2.5 scripts/ 归档

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\scripts\`

**目标：** `templates/axiom/scripts/`

**策略：** 归档 PowerShell 脚本（`agent-runner.ps1`、`Check-Memory.ps1`、`Poll-Memory.ps1`、`start-reviews.ps1`、`Watch-Memory.ps1`），不集成到 ultrapower 核心（ultrapower 是跨平台的，PowerShell 脚本仅供参考）。

---

## Phase 3：Python → TypeScript 重写

### 3.1 Context Manager 重写

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\memory\context_manager.py`

**目标：** `src/hooks/memory/`（新建目录）

**前置依赖：** Phase 2 Task 9（`.omc/axiom/` 目录已创建）

**核心功能（需重写）：**
- 读取/写入 `active_context.md`
- 读取 `project_decisions.md` 和 `user_preferences.md`
- 7 操作记忆系统：read/write/merge/clear/checkpoint/restore/status
- 上下文窗口管理（防止溢出）

**TypeScript 接口设计：**
```typescript
export type MemorySection = 'active' | 'decisions' | 'preferences' | 'reflection';

export interface ContextStatus {
  activeContext: string;
  lastCheckpoint: string | null;
  sessionId: string;
}

export interface ContextManager {
  read(section: MemorySection): Promise<string>;
  write(section: MemorySection, content: string): Promise<void>;
  merge(section: MemorySection, content: string): Promise<void>;  // 追加而非覆盖
  clear(section: MemorySection): Promise<void>;
  checkpoint(label: string): Promise<void>;
  restore(label: string): Promise<void>;
  status(): Promise<ContextStatus>;
}
```

**集成点：** 注册为 `PostToolUse` hook，在每次工具调用后更新 active_context。

### 3.2 Evolution Engine 重写

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\`（9 个 Python 模块）

**目标：** 增强现有 `src/hooks/learner/`

**前置依赖：** Phase 3 Task 10（Context Manager）+ Phase 2 axiom-config.ts

**模块映射：**

| Python 模块 | TypeScript 目标 | 功能 |
|------------|----------------|------|
| `orchestrator.py` | `src/hooks/learner/orchestrator.ts` | 进化流程编排 |
| `harvester.py` | `src/hooks/learner/harvester.ts` | 对话模式收割 |
| `pattern_detector.py` | `src/hooks/learner/pattern-detector.ts` | 模式检测 |
| `reflection.py` | `src/hooks/learner/reflection.ts` | 反思生成 |
| `confidence.py` | `src/hooks/learner/confidence.ts` | 信心评分 |
| `metrics.py` | `src/hooks/learner/metrics.ts` | 指标收集 |
| `learning_queue.py` | `src/hooks/learner/learning-queue.ts` | 学习队列 |
| `index_manager.py` | `src/hooks/learner/index-manager.ts` | 知识索引管理 |
| `seed_knowledge.py` | `src/hooks/learner/seed-knowledge.ts` | 种子知识初始化 |

**与现有 learner hook 的集成：** 现有 `src/hooks/learner/` 负责 skill 提取，新增模块负责更深层的模式学习和进化。两者通过共享的 `.omc/axiom/evolution/` 状态文件协作。

### 3.3 Guards 系统重写（双层架构）

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\guards\`

**重要设计决策：** Guards 分为两个独立层，不可混淆：

**层 A：Git Hooks（Shell 脚本迁移）**

| 来源文件 | 目标路径 | 触发时机 |
|---------|---------|---------|
| `pre-commit` | `scripts/hooks/pre-commit.sh` | `git commit` 前 |
| `post-commit` | `scripts/hooks/post-commit.sh` | `git commit` 后 |
| `install_hooks.py` | `scripts/hooks/install-hooks.sh` | 手动安装 |

**层 B：Claude Code Hooks（TypeScript 新增）**

| 目标文件 | Hook 事件 | 功能 |
|---------|---------|------|
| `src/hooks/guards/pre-tool.ts` | `PreToolUse` | 权限检查、范围验证 |
| `src/hooks/guards/post-tool.ts` | `PostToolUse` | 更新 `active_context.md` |
| `src/hooks/guards/session-watchdog.ts` | `Stop` | 会话超时检测、状态清理 |
| `src/hooks/guards/status-dashboard.ts` | 工具函数 | 输出 Axiom 系统状态 |

**前置依赖：** Phase 2 Task 9（`.omc/axiom/active_context.md` 已创建）

### 3.4 Axiom Agents 增强（非新建）

**重要：** 以下 7 个 axiom-* agents 已存在于 `agents/` 目录，Task 14 为增强现有文件，而非新建。

| 现有 Agent 文件 | 对应 Axiom Skill | 增强内容 |
|---------------|----------------|---------|
| `agents/axiom-requirement-analyst.md` | `skills/requirement-analyst/` | 追加独特指令 |
| `agents/axiom-product-designer.md` | `skills/product-design-expert/` | 追加独特指令 |
| `agents/axiom-review-aggregator.md` | `skills/review-aggregator/` | 追加独特指令 |
| `agents/axiom-prd-crafter.md` | `skills/prd-crafter-lite/` | 追加独特指令 |
| `agents/axiom-system-architect.md` | `skills/system-architect/` | 追加独特指令 |
| `agents/axiom-evolution-engine.md` | `skills/evolution-engine/` | 追加独特指令 |
| `agents/axiom-context-manager.md` | `skills/context-manager/` | 追加独特指令 |

---

## 新增 Skill 列表（Phase 1 新建）

| Skill 名称 | 触发词 | 来源工作流 |
|-----------|--------|-----------|
| `ax-reflect` | "reflect", "反思" | `reflect.md` |
| `ax-rollback` | "rollback", "回滚" | `rollback.md` |
| `ax-status` | "ax-status", "axiom status" | `status.md` + `meta.md` |
| `ax-suspend` | "suspend", "暂停任务" | `suspend.md` + `suspend1.md` |
| `ax-knowledge` | "knowledge", "知识库" | `knowledge.md` + `patterns.md` |
| `ax-export` | "ax-export", "导出" | `export.md` |

---

## 文件变更摘要

**新建目录：**
- `.omc/knowledge/` — memory/knowledge 知识库（25+ 条目）
- `.omc/knowledge/axiom-patterns/` — knowledge/ 独立目录
- `.omc/axiom/` — Axiom 记忆文件
- `.omc/axiom/evolution/` — 进化数据
- `src/hooks/memory/` — Context Manager TypeScript
- `src/hooks/guards/` — Guards Claude Code Hooks TypeScript
- `scripts/hooks/` — Guards Git Hooks Shell 脚本
- `templates/axiom/` — prompts/templates + scripts 归档
- `.codex/`, `.gemini/`, `.kiro/`, `.opencode/` — AI 适配器

**修改文件：**
- `CLAUDE.md`（项目根）— 追加 PM→Worker 协议
- `docs/CLAUDE.md` — 合并 claude-code 适配器
- `agents/critic.md`, `agents/architect.md` 等（合并增强）
- `agents/axiom-*.md`（7 个，增强现有文件）
- `skills/brainstorming/`, `skills/systematic-debugging/` 等（合并增强）
- `src/hooks/learner/` — 增强进化引擎

**新建文件（约 55+）：**
- 9 个 AI 适配器文件
- 6 个新 skill SKILL.md（ax-reflect/rollback/status/suspend/knowledge/export）
- 2 个 templates/axiom/ 模板文件
- 4 个 templates/rules/ 规则文件
- 1 个 src/config/axiom-config.ts
- 9 个 TypeScript evolution 模块
- 4 个 TypeScript guards 模块（Claude Code hooks）
- 3 个 Shell guards 脚本（Git hooks）
- 1 个 TypeScript context manager 模块
- 25+ 知识库条目

---

## 验收标准

- [ ] 9 个 AI 适配器文件就位（含 CLAUDE.md 合并到项目根）
- [ ] 6 个 agent 提示词已合并增强
- [ ] 18 个工作流已映射到对应 skill（15 合并增强 + 6 新建）
- [ ] 4 个规则文件已迁移到 templates/rules/
- [ ] 2 个 prompts/templates 文件已迁移到 templates/axiom/
- [ ] 25+ memory/knowledge 条目已迁移到 `.omc/knowledge/`
- [ ] knowledge/ 独立目录已迁移到 `.omc/knowledge/axiom-patterns/`
- [ ] 7 个记忆文件已迁移到 `.omc/axiom/`
- [ ] scripts/ 已归档到 `templates/axiom/scripts/`
- [ ] axiom-config.ts 实现通过类型检查
- [ ] Context Manager TypeScript 实现通过类型检查（7 操作含 merge/clear）
- [ ] Evolution Engine TypeScript 实现通过类型检查
- [ ] Guards 双层架构：Git hooks（scripts/hooks/）+ Claude Code hooks（src/hooks/guards/）
- [ ] 7 个现有 axiom-* agents 已增强（非新建）
- [ ] `npm run build` 无错误
- [ ] 新增 skill 可通过 `/ultrapower:ax-*` 调用
