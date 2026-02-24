# Axiom → ultrapower 集成设计文档

> **For Claude:** REQUIRED SUB-SKILL: Use `ultrapower:writing-plans` to create the implementation plan after this design is approved.

**目标：** 将 Axiom `.agent/` 配置体系完整集成到 ultrapower v5.0.2，包括 8 个 AI 适配器、6 个角色提示词、13+ 工作流、规则引擎、知识库、记忆系统（TypeScript 重写）、进化引擎（TypeScript 重写）和守卫系统（TypeScript 重写）。

**架构方向：** 三阶段渐进式集成——Phase 1 直接迁移 Markdown 文件，Phase 2 内容组织与知识库，Phase 3 Python→TypeScript 重写核心引擎。

**技术栈：** TypeScript/Node.js（ultrapower），Markdown（适配器/角色/工作流），JSON（状态/记忆），SQLite（swarm 任务协调）

---

## 技术栈兼容性矩阵

| 模块 | 来源 | 目标 | 策略 | 优先级 |
|------|------|------|------|--------|
| adapters/ (8 个 AI 工具) | `.agent/adapters/` | `.codex/`, `.gemini/`, `.kiro/` 等 | 直接迁移 | P1 |
| prompts/roles/ (6 个角色) | `.agent/prompts/roles/` | `agents/` Markdown 提示词 | 合并增强 | P1 |
| workflows/ (13+ 工作流) | `.agent/workflows/` | `skills/` SKILL.md | 合并增强 | P1 |
| rules/ (.rule 文件) | `.agent/rules/` | `templates/rules/` | 直接迁移 | P1 |
| knowledge/ (25+ 条目) | `.agent/memory/knowledge/` | `.omc/knowledge/` | 直接迁移 | P2 |
| memory/ (Markdown 文件) | `.agent/memory/*.md` | `.omc/axiom/` | 直接迁移 | P2 |
| context_manager.py | `.agent/memory/` | `src/hooks/memory/` | TypeScript 重写 | P2 |
| evolution/ (Python 引擎) | `.agent/evolution/` | `src/hooks/learner/` 增强 | TypeScript 重写 | P3 |
| guards/ (Python+Shell) | `.agent/guards/` | `src/hooks/guards/` | TypeScript 重写 | P3 |

---

## Phase 1：直接 Markdown 迁移

### 1.1 AI 适配器集成

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\`

**目标映射：**

| Axiom 适配器 | 目标路径 | 操作 |
|-------------|---------|------|
| `adapters/claude/CLAUDE.md` | `.claude/CLAUDE.md` (全局) | 合并到现有 CLAUDE.md |
| `adapters/claude-code/CLAUDE-CODE.md` | `docs/CLAUDE.md` | 合并增强 |
| `adapters/codex/CODEX.md` | `.codex/AGENTS.md` | 新建 |
| `adapters/gemini/GEMINI.md` | `.gemini/GEMINI.md` | 新建 |
| `adapters/gemini-cli/GEMINI-CLI.md` | `.gemini/GEMINI-CLI.md` | 新建 |
| `adapters/copilot/copilot-instructions.md` | `.github/copilot-instructions.md` | 新建 |
| `adapters/cursor/.cursorrules` | `.cursorrules` | 新建 |
| `adapters/kiro/KIRO.md` | `.kiro/steering/axiom.md` | 新建 |
| `adapters/opencode/OPENCODE.md` | `.opencode/AGENTS.md` | 新建 |

**合并策略：** 保留 ultrapower 现有内容，追加 Axiom 的 PM→Worker 协议、三态输出格式（QUESTION/BLOCKED/COMPLETE）和 Boot Protocol。

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

### 1.3 工作流 → Skill 增强

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
| `reflect.md` | 新建 `skills/ax-reflect/` | 新建 |
| `rollback.md` | 新建 `skills/ax-rollback/` | 新建 |
| `status.md` | 新建 `skills/ax-status/` | 新建 |
| `suspend.md` | 新建 `skills/ax-suspend/` | 新建 |
| `feature-flow.md` | `skills/subagent-driven-development/` | 合并增强 |
| `init.md` | `skills/deepinit/` | 合并增强 |
| `knowledge.md` | 新建 `skills/ax-knowledge/` | 新建 |

### 1.4 规则引擎迁移

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\rules\`

**目标：** `templates/rules/`

| Axiom 规则文件 | 目标路径 |
|--------------|---------|
| `gatekeepers.rule` | `templates/rules/axiom-gatekeepers.md` |
| `provider_router.rule` | `templates/rules/axiom-provider-router.md` |
| `router.rule` | `templates/rules/axiom-router.md` |
| `skills.rule` | `templates/rules/axiom-skills.md` |

---

## Phase 2：内容组织与知识库

### 2.1 知识库迁移

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

### 2.2 记忆系统 Markdown 文件迁移

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

---

## Phase 3：Python → TypeScript 重写

### 3.1 Context Manager 重写

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\memory\context_manager.py`

**目标：** `src/hooks/memory/`（新建目录）

**核心功能（需重写）：**
- 读取/写入 `active_context.md`
- 读取 `project_decisions.md` 和 `user_preferences.md`
- 7 操作记忆系统：read/write/status/checkpoint/restore/merge/clear
- 上下文窗口管理（防止溢出）

**TypeScript 接口设计：**
```typescript
interface ContextManager {
  read(section: 'active' | 'decisions' | 'preferences'): Promise<string>;
  write(section: string, content: string): Promise<void>;
  checkpoint(label: string): Promise<void>;
  restore(label: string): Promise<void>;
  status(): Promise<ContextStatus>;
}
```

**集成点：** 注册为 `PostToolUse` hook，在每次工具调用后更新 active_context。

### 3.2 Evolution Engine 重写

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\`（9 个 Python 模块）

**目标：** 增强现有 `src/hooks/learner/`

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

### 3.3 Guards 系统重写

**来源：** `C:\Users\ljyih\Desktop\Axiom\.agent\guards\`

**目标：** `src/hooks/guards/`（新建目录）

**模块映射：**

| Python/Shell 文件 | TypeScript 目标 | 功能 |
|-----------------|----------------|------|
| `pre-commit` | `src/hooks/guards/pre-commit.ts` | 提交前质量检查 |
| `post-commit` | `src/hooks/guards/post-commit.ts` | 提交后上下文更新 |
| `session_watchdog.py` | `src/hooks/guards/session-watchdog.ts` | 会话监控 |
| `status_dashboard.py` | `src/hooks/guards/status-dashboard.ts` | 状态仪表板 |
| `install_hooks.py` | `src/hooks/guards/install-hooks.ts` | Hook 安装器 |

**Hook 事件映射：**
- `pre-commit` → `PreToolUse` (Write/Edit 工具)
- `post-commit` → `PostToolUse` (Write/Edit 工具)
- `session_watchdog` → `Stop` hook（会话结束时）

---

## 新增 Skill 列表（Phase 1 新建）

| Skill 名称 | 触发词 | 来源工作流 |
|-----------|--------|-----------|
| `ax-reflect` | "reflect", "反思" | `reflect.md` |
| `ax-rollback` | "rollback", "回滚" | `rollback.md` |
| `ax-status` | "ax-status", "axiom status" | `status.md` |
| `ax-suspend` | "suspend", "暂停任务" | `suspend.md` |
| `ax-knowledge` | "knowledge", "知识库" | `knowledge.md` |

---

## 新增 Agent 列表（Phase 3 新建）

以下 Axiom skills 中的专业 agent 将作为新 ultrapower agents 注册：

| Agent 名称 | 来源 | 模型 | 用途 |
|-----------|------|------|------|
| `axiom-requirement-analyst` | `skills/requirement-analyst/` | opus | 需求分析三态门 |
| `axiom-product-designer` | `skills/product-design-expert/` | sonnet | Draft PRD 生成 |
| `axiom-review-aggregator` | `skills/review-aggregator/` | opus | 5 专家并行审查聚合 |
| `axiom-prd-crafter` | `skills/prd-crafter-lite/` | opus | 工程级 PRD |
| `axiom-system-architect` | `skills/system-architect/` | opus | 原子任务 DAG |
| `axiom-evolution-engine` | `skills/evolution-engine/` | sonnet | 知识收割与优化 |
| `axiom-context-manager` | `skills/context-manager/` | sonnet | 7 操作记忆系统 |

---

## 文件变更摘要

**新建目录：**
- `.omc/knowledge/` — 知识库（25+ 条目）
- `.omc/axiom/` — Axiom 记忆文件
- `.omc/axiom/evolution/` — 进化数据
- `src/hooks/memory/` — Context Manager TypeScript
- `src/hooks/guards/` — Guards TypeScript
- `.codex/`, `.gemini/`, `.kiro/`, `.opencode/` — AI 适配器

**修改文件：**
- `agents/critic.md`, `agents/architect.md`, `agents/product-manager.md` 等（合并增强）
- `skills/brainstorming/`, `skills/systematic-debugging/` 等（合并增强）
- `src/hooks/learner/` — 增强进化引擎
- `docs/CLAUDE.md` — 更新 agent/skill 数量

**新建文件（约 50+）：**
- 9 个 AI 适配器文件
- 5 个新 skill SKILL.md
- 7 个新 agent Markdown
- 9 个 TypeScript evolution 模块
- 5 个 TypeScript guards 模块
- 1 个 TypeScript context manager 模块
- 25+ 知识库条目

---

## 验收标准

- [ ] 所有 8 个 AI 适配器文件就位
- [ ] 6 个 agent 提示词已合并增强
- [ ] 13 个工作流已映射到对应 skill
- [ ] 4 个规则文件已迁移
- [ ] 25+ 知识条目已迁移到 `.omc/knowledge/`
- [ ] Context Manager TypeScript 实现通过类型检查
- [ ] Evolution Engine TypeScript 实现通过类型检查
- [ ] Guards TypeScript 实现通过类型检查
- [ ] `npm run build` 无错误
- [ ] 新增 skill 可通过 `/ultrapower:ax-*` 调用
