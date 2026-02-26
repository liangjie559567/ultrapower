# Axiom Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `ultrapower:executing-plans` to implement this plan task-by-task.

**Goal:** 将 Axiom `.agent/` 配置体系完整集成到 ultrapower v5.0.2

**Architecture:** 三阶段渐进式集成——Phase 1 直接迁移 Markdown，Phase 2 知识库与记忆文件及配置，Phase 3 Python→TypeScript 重写

**Tech Stack:** TypeScript/Node.js, Markdown, JSON

**Design Doc:** `docs/plans/2026-02-24-axiom-integration-design.md`

---

## Phase 1: 直接 Markdown 迁移

### Task 1: 创建 AI 适配器目录结构（7 个新文件 + 2 个合并）

**Files:**
- Merge: `CLAUDE.md`（项目根）← `adapters/claude/CLAUDE.md`
- Merge: `docs/CLAUDE.md` ← `adapters/claude-code/CLAUDE-CODE.md`
- Create: `.codex/AGENTS.md`
- Create: `.gemini/GEMINI.md`
- Create: `.gemini/GEMINI-CLI.md`
- Create: `.github/copilot-instructions.md`
- Create: `.cursorrules`
- Create: `.kiro/steering/axiom.md`
- Create: `.opencode/AGENTS.md`

**Step 1: 读取 Axiom 适配器源文件**

并行读取以下文件：
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\claude\CLAUDE.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\claude-code\CLAUDE-CODE.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\codex\CODEX.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\gemini\GEMINI.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\gemini-cli\GEMINI-CLI.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\copilot\copilot-instructions.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\cursor\.cursorrules`
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\kiro\KIRO.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\opencode\OPENCODE.md`

**Step 2: 合并 CLAUDE.md（项目根）**

读取项目根 `CLAUDE.md` 当前内容，在末尾追加 Axiom 的 PM→Worker 协议和三态输出格式（QUESTION/BLOCKED/COMPLETE）。
注意：不要修改 `~/.claude/CLAUDE.md`（全局用户配置）。

**Step 3: 合并 docs/CLAUDE.md**

读取 `docs/CLAUDE.md` 当前内容，追加 `adapters/claude-code/CLAUDE-CODE.md` 中的独特指令。

**Step 4: 创建目录并写入新文件**

```bash
mkdir -p .codex .gemini .github .kiro/steering .opencode
```

将 7 个适配器文件内容写入对应目标路径。

**Step 5: 验证文件存在**

```bash
ls -la .codex/ .gemini/ .github/ .kiro/steering/ .opencode/
```

Expected: 7 个新文件均存在，CLAUDE.md 末尾有 Axiom 内容

**Step 6: Commit**

```bash
git add .codex/ .gemini/ .github/copilot-instructions.md .cursorrules .kiro/ .opencode/ CLAUDE.md docs/CLAUDE.md
git commit -m "feat(adapters): add Axiom AI tool adapters and merge PM→Worker protocol into CLAUDE.md"
```

---

### Task 2: 合并增强 Agent 提示词（critic + architect）

**Files:**
- Modify: `agents/critic.md`
- Modify: `agents/architect.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\prompts\roles\critic.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\prompts\roles\tech_lead.md`

**Step 1: 并行读取所有文件**

读取 `agents/critic.md`、`agents/architect.md`、Axiom `critic.md`、Axiom `tech_lead.md`。

**Step 2: 追加 Axiom 内容到 critic.md**

在 `agents/critic.md` 末尾追加：
```markdown
## Axiom Review Criteria (增强)

### Security Audit (P0)
- Data Privacy: 用户数据存储位置、加密状态、访问权限
- Authentication: IDOR/SQLi/XSS 潜在绕过
- Compliance: GDPR/CCPA 合规性

### Edge Cases (P1)
- Extreme Inputs: 空字符串、超大文件、Unicode
- Concurrency: 竞态条件、死锁、双重提交
- User Errors: 重复点击、断网、中途取消

### Review Output Format
输出到 `docs/reviews/[feature]/review_critic.md`，格式：Pass | Conditional Pass | Reject
```

**Step 3: 提取 tech_lead.md 独特内容追加到 architect.md**

从 `tech_lead.md` 提取代码审查清单、架构决策框架等独特指令，追加到 `agents/architect.md` 末尾。

**Step 4: Commit**

```bash
git add agents/critic.md agents/architect.md
git commit -m "feat(agents): enhance critic and architect with Axiom role prompts"
```

---

### Task 3: 合并增强 Agent 提示词（product-manager + ux-researcher + analyst + writer）

**Files:**
- Modify: `agents/product-manager.md`
- Modify: `agents/ux-researcher.md`
- Modify: `agents/analyst.md`
- Modify: `agents/writer.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\prompts\roles\product_director.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\prompts\roles\ux_director.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\prompts\roles\domain_expert.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\prompts\roles\sub_prd_writer.md`

**Step 1: 并行读取所有文件**

并行读取 4 个 Axiom 角色文件和 4 个 ultrapower agent 文件。

**Step 2: 为每个 agent 追加 Axiom 增强内容**

提取每个 Axiom 角色的独特指令（避免与现有内容重复），追加到对应 ultrapower agent 末尾。

**Step 3: Commit**

```bash
git add agents/product-manager.md agents/ux-researcher.md agents/analyst.md agents/writer.md
git commit -m "feat(agents): enhance product-manager/ux-researcher/analyst/writer with Axiom roles"
```

---

### Task 4: 合并增强现有 Skills（brainstorming + systematic-debugging + requesting-code-review）

**Files:**
- Modify: `skills/brainstorming/SKILL.md`
- Modify: `skills/systematic-debugging/SKILL.md`
- Modify: `skills/requesting-code-review/SKILL.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\1-drafting.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\analyze-error.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\2-reviewing.md`

**Step 1: 并行读取所有文件**

**Step 2: 提取 Axiom 独特内容并追加**

- `1-drafting.md` 的草稿阶段独特步骤 → `brainstorming`
- `analyze-error.md` 的错误分析独特步骤 → `systematic-debugging`
- `2-reviewing.md` 的评审流程独特步骤 → `requesting-code-review`

**Step 3: Commit**

```bash
git add skills/brainstorming/SKILL.md skills/systematic-debugging/SKILL.md skills/requesting-code-review/SKILL.md
git commit -m "feat(skills): enhance brainstorming/systematic-debugging/requesting-code-review with Axiom workflows"
```

---

### Task 5: 合并增强现有 Skills（writing-plans + executing-plans + subagent-driven-development + deepinit + learner + ccg）

**Files:**
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/executing-plans/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/deepinit/SKILL.md`
- Modify: `skills/learner/SKILL.md`
- Modify: `skills/ccg/SKILL.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\3-decomposing.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\4-implementing.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\feature-flow.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\init.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\start.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\evolve.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\codex-dispatch.md`

**Step 1: 并行读取所有文件**

**Step 2: 提取并追加独特内容**

- `3-decomposing.md` 的 DAG 任务分解方法 → `writing-plans`
- `4-implementing.md` 的 PM→Worker 协议 → `executing-plans`
- `feature-flow.md` 的完整功能流程 → `subagent-driven-development`
- `init.md` + `start.md` 的初始化步骤 → `deepinit`
- `evolve.md` 的进化触发逻辑 → `learner`
- `codex-dispatch.md` 的 Codex 调度协议 → `ccg`

**Step 3: Commit**

```bash
git add skills/writing-plans/SKILL.md skills/executing-plans/SKILL.md skills/subagent-driven-development/SKILL.md skills/deepinit/SKILL.md skills/learner/SKILL.md skills/ccg/SKILL.md
git commit -m "feat(skills): enhance writing-plans/executing-plans/subagent-driven/deepinit/learner/ccg with Axiom workflows"
```

---

### Task 6: 新建 Axiom 专属 Skills（ax-reflect/ax-rollback/ax-status/ax-suspend/ax-knowledge/ax-export）

**Files:**
- Create: `skills/ax-reflect/SKILL.md`
- Create: `skills/ax-rollback/SKILL.md`
- Create: `skills/ax-status/SKILL.md`
- Create: `skills/ax-suspend/SKILL.md`
- Create: `skills/ax-knowledge/SKILL.md`
- Create: `skills/ax-export/SKILL.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\reflect.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\rollback.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\status.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\meta.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\suspend.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\suspend1.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\knowledge.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\patterns.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\export.md`

**Step 1: 并行读取所有 Axiom 工作流源文件**

**Step 2: 为每个工作流创建 SKILL.md**

每个 SKILL.md 格式：
```markdown
---
name: ax-[name]
description: [描述]
triggers: ["[触发词1]", "[触发词2]"]
---

# [Skill 名称]

[从 Axiom 工作流转换的内容]
```

合并规则：
- `ax-status`：合并 `status.md` + `meta.md`
- `ax-suspend`：合并 `suspend.md` + `suspend1.md`（去重）
- `ax-knowledge`：合并 `knowledge.md` + `patterns.md`

**Step 3: 验证文件创建**

```bash
ls skills/ax-*/SKILL.md
```

Expected: 6 个文件

**Step 4: Commit**

```bash
git add skills/ax-reflect/ skills/ax-rollback/ skills/ax-status/ skills/ax-suspend/ skills/ax-knowledge/ skills/ax-export/
git commit -m "feat(skills): add new Axiom skills ax-reflect/rollback/status/suspend/knowledge/export"
```

---

### Task 7: 迁移规则引擎文件 + prompts/templates

**Files:**
- Create: `templates/rules/axiom-gatekeepers.md`
- Create: `templates/rules/axiom-provider-router.md`
- Create: `templates/rules/axiom-router.md`
- Create: `templates/rules/axiom-skills.md`
- Create: `templates/axiom/dag-analysis.md`
- Create: `templates/axiom/task-execution.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\rules\gatekeepers.rule`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\rules\provider_router.rule`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\rules\router.rule`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\rules\skills.rule`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\prompts\templates\dag_analysis.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\prompts\templates\task_execution.md`

**Step 1: 并行读取所有源文件**

**Step 2: 创建目录并写入**

```bash
mkdir -p templates/rules templates/axiom
```

将规则文件写入 `templates/rules/axiom-*.md`，在文件头部添加来源注释。
将模板文件写入 `templates/axiom/`。

**Step 3: Commit**

```bash
git add templates/rules/axiom-*.md templates/axiom/
git commit -m "feat(templates): migrate Axiom rule engine files and prompts/templates"
```

---

## Phase 2: 知识库、记忆文件与配置

### Task 8: 迁移 memory/knowledge 知识库（25+ 条目）

**Files:**
- Create: `.omc/knowledge/` 目录（25+ 条目）
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\memory\knowledge\`

**Step 1: 列出所有知识条目**

```bash
ls C:/Users/ljyih/Desktop/Axiom/.agent/memory/knowledge/
```

**Step 2: 创建目录并批量复制**

```bash
mkdir -p .omc/knowledge
cp -r C:/Users/ljyih/Desktop/Axiom/.agent/memory/knowledge/* .omc/knowledge/
```

**Step 3: 创建索引文件**

在 `.omc/knowledge/index.md` 中创建索引，格式：
```markdown
# Axiom Knowledge Base Index

## 通用 Agent 模式（直接适用）
- k-001 ~ k-005: [条目标题]

## Flutter/Dart 相关（项目特定，保留供参考）
- k-006 ~ k-020: [条目标题]

## 通用开发规范（直接适用）
- k-021 ~ k-025: [条目标题]
```

**Step 4: 验证**

```bash
ls .omc/knowledge/ | wc -l
```

Expected: 26+ 文件（25+ 条目 + index.md）

**Step 5: Commit**

```bash
git add .omc/knowledge/
git commit -m "feat(knowledge): migrate Axiom memory/knowledge 25+ entries to .omc/knowledge/"
```

---

### Task 9: 迁移 knowledge/ 独立目录

**Files:**
- Create: `.omc/knowledge/axiom-patterns/` 目录
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\knowledge\`

**Step 1: 列出子目录结构**

```bash
ls C:/Users/ljyih/Desktop/Axiom/.agent/knowledge/
```

**Step 2: 创建目录并复制（保留子目录结构）**

```bash
mkdir -p .omc/knowledge/axiom-patterns
cp -r C:/Users/ljyih/Desktop/Axiom/.agent/knowledge/* .omc/knowledge/axiom-patterns/
```

**Step 3: 验证**

```bash
ls -la .omc/knowledge/axiom-patterns/
```

Expected: architecture/、pattern/、tooling/ 子目录存在

**Step 4: Commit**

```bash
git add .omc/knowledge/axiom-patterns/
git commit -m "feat(knowledge): migrate Axiom knowledge/ independent dir to .omc/knowledge/axiom-patterns/"
```

---

### Task 10: 迁移 Axiom 记忆 Markdown 文件

**Files:**
- Create: `.omc/axiom/` 目录（7 个文件）
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\memory\`

**Step 1: 并行读取所有记忆文件**

并行读取：
- `C:\Users\ljyih\Desktop\Axiom\.agent\memory\project_decisions.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\memory\user_preferences.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\memory\active_context.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\memory\reflection_log.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\memory\state_machine.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\memory\evolution\knowledge_base.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\memory\evolution\pattern_library.md`

**Step 2: 创建目录并写入**

```bash
mkdir -p .omc/axiom/evolution
```

将 7 个文件写入对应目标路径（见设计文档 2.3 节映射表）。

**Step 3: 验证**

```bash
ls .omc/axiom/
ls .omc/axiom/evolution/
```

Expected: 5 个根文件 + evolution/ 目录含 2 个文件

**Step 4: Commit**

```bash
git add .omc/axiom/
git commit -m "feat(memory): migrate Axiom memory Markdown files to .omc/axiom/"
```

---

### Task 11: 实现 axiom-config.ts

**Files:**
- Create: `src/config/axiom-config.ts`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\config\config_loader.py`

**Step 1: 读取源文件**

读取 `C:\Users\ljyih\Desktop\Axiom\.agent\config\config_loader.py`，提取：
- `ACTIVE_PROVIDER` 路由逻辑
- Evolution 参数值（min_confidence、seed_confidence 等）
- Dispatcher timeout tiers
- max_restarts 值

**Step 2: 创建 TypeScript 实现**

在 `src/config/axiom-config.ts` 中实现以下接口（从设计文档复制）：

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

export const defaultAxiomConfig: AxiomConfig = {
  activeProvider: 'claude',
  evolution: {
    minConfidence: 0.5,
    seedConfidence: 0.85,
    decayDays: 30,
    maxLearningQueue: 50,
    patternMinOccurrences: 3,
  },
  dispatcher: {
    maxRestarts: 3,
    timeoutTiers: { simple: 600, medium: 900, complex: 1200 },
  },
};

export function loadAxiomConfig(overrides?: Partial<AxiomConfig>): AxiomConfig {
  return { ...defaultAxiomConfig, ...overrides };
}
```

**Step 3: 类型检查**

```bash
npx tsc --noEmit src/config/axiom-config.ts
```

Expected: 无错误

**Step 4: Commit**

```bash
git add src/config/axiom-config.ts
git commit -m "feat(config): add axiom-config.ts with AxiomConfig interface and defaults"
```

---

### Task 12: 归档 scripts/ 到 templates/axiom/scripts/

**Files:**
- Create: `templates/axiom/scripts/` 目录（5 个 PowerShell 脚本）
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\scripts\`

**Step 1: 列出脚本文件**

```bash
ls C:/Users/ljyih/Desktop/Axiom/.agent/scripts/
```

**Step 2: 创建目录并复制**

```bash
mkdir -p templates/axiom/scripts
cp C:/Users/ljyih/Desktop/Axiom/.agent/scripts/*.ps1 templates/axiom/scripts/
```

**Step 3: 创建 README**

在 `templates/axiom/scripts/README.md` 中写入：
```markdown
# Axiom PowerShell Scripts (归档)

这些脚本来自 Axiom `.agent/scripts/`，仅供参考。
ultrapower 是跨平台的，不直接集成这些 Windows 专用脚本。

## 文件列表
- `agent-runner.ps1`: Axiom agent 运行器
- `Check-Memory.ps1`: 记忆检查工具
- `Poll-Memory.ps1`: 记忆轮询工具
- `start-reviews.ps1`: 启动审查流程
- `Watch-Memory.ps1`: 记忆监控工具
```

**Step 4: Commit**

```bash
git add templates/axiom/scripts/
git commit -m "feat(templates): archive Axiom PowerShell scripts to templates/axiom/scripts/"
```

---

## Phase 3: Python → TypeScript 重写

### Task 13: 实现 Context Manager TypeScript（7 操作）

**前置依赖：** Task 10（`.omc/axiom/` 目录已创建）

**Files:**
- Create: `src/hooks/memory/index.ts`
- Create: `src/hooks/memory/types.ts`
- Create: `src/hooks/memory/constants.ts`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\memory\context_manager.py`

**Step 1: 读取源文件**

读取 `C:\Users\ljyih\Desktop\Axiom\.agent\memory\context_manager.py`，理解：
- 7 个操作的实现逻辑（read/write/merge/clear/checkpoint/restore/status）
- 文件路径约定
- 上下文窗口管理逻辑

**Step 2: 创建 types.ts**

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
  merge(section: MemorySection, content: string): Promise<void>;
  clear(section: MemorySection): Promise<void>;
  checkpoint(label: string): Promise<void>;
  restore(label: string): Promise<void>;
  status(): Promise<ContextStatus>;
}
```

**Step 3: 创建 constants.ts**

定义文件路径映射：
```typescript
export const SECTION_FILES: Record<string, string> = {
  active: '.omc/axiom/active_context.md',
  decisions: '.omc/axiom/project_decisions.md',
  preferences: '.omc/axiom/user_preferences.md',
  reflection: '.omc/axiom/reflection_log.md',
};
export const CHECKPOINT_DIR = '.omc/axiom/checkpoints';
```

**Step 4: 创建 index.ts**

实现 `ContextManager` 接口，使用 `fs/promises` 进行文件操作。merge 操作追加内容而非覆盖。

**Step 5: 类型检查**

```bash
npx tsc --noEmit
```

Expected: 无错误

**Step 6: Commit**

```bash
git add src/hooks/memory/
git commit -m "feat(hooks): add Context Manager TypeScript with 7-operation interface"
```

---

### Task 14: Evolution Engine 核心模块（4 个）

**前置依赖：** Task 11（axiom-config.ts）、Task 13（Context Manager）

**Files:**
- Create: `src/hooks/learner/harvester.ts`
- Create: `src/hooks/learner/pattern-detector.ts`
- Create: `src/hooks/learner/confidence.ts`
- Create: `src/hooks/learner/metrics.ts`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\harvester.py`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\pattern_detector.py`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\confidence.py`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\metrics.py`

**Step 1: 并行读取 4 个 Python 源文件**

**Step 2: 实现 harvester.ts**

从对话历史中提取模式，输出到学习队列。

**Step 3: 实现 pattern-detector.ts**

检测重复模式，使用 `patternMinOccurrences` 阈值（来自 axiom-config.ts）。

**Step 4: 实现 confidence.ts**

计算模式置信度分数，使用 `minConfidence` 和 `seedConfidence` 参数。

**Step 5: 实现 metrics.ts**

收集进化指标，写入 `.omc/axiom/evolution/` 目录。

**Step 6: 类型检查**

```bash
npx tsc --noEmit
```

Expected: 无错误

**Step 7: Commit**

```bash
git add src/hooks/learner/harvester.ts src/hooks/learner/pattern-detector.ts src/hooks/learner/confidence.ts src/hooks/learner/metrics.ts
git commit -m "feat(learner): add Evolution Engine core modules (harvester/pattern-detector/confidence/metrics)"
```

---

### Task 15: Evolution Engine 编排模块（5 个）

**前置依赖：** Task 14（核心模块）

**Files:**
- Create: `src/hooks/learner/orchestrator.ts`
- Create: `src/hooks/learner/reflection.ts`
- Create: `src/hooks/learner/learning-queue.ts`
- Create: `src/hooks/learner/index-manager.ts`
- Create: `src/hooks/learner/seed-knowledge.ts`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\orchestrator.py`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\reflection.py`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\learning_queue.py`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\index_manager.py`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\seed_knowledge.py`

**Step 1: 并行读取 5 个 Python 源文件**

**Step 2: 实现 orchestrator.ts**

编排进化流程，调用 harvester → pattern-detector → confidence → reflection。

**Step 3: 实现 reflection.ts**

生成反思内容，写入 `.omc/axiom/reflection_log.md`。

**Step 4: 实现 learning-queue.ts**

管理学习队列，使用 `maxLearningQueue` 限制（来自 axiom-config.ts）。

**Step 5: 实现 index-manager.ts**

管理 `.omc/knowledge/` 索引，维护知识条目的可检索性。

**Step 6: 实现 seed-knowledge.ts**

初始化种子知识，从 `.omc/axiom/evolution/knowledge_base.md` 加载。

**Step 7: 类型检查**

```bash
npx tsc --noEmit
```

Expected: 无错误

**Step 8: Commit**

```bash
git add src/hooks/learner/orchestrator.ts src/hooks/learner/reflection.ts src/hooks/learner/learning-queue.ts src/hooks/learner/index-manager.ts src/hooks/learner/seed-knowledge.ts
git commit -m "feat(learner): add Evolution Engine orchestration modules (orchestrator/reflection/queue/index/seed)"
```

---

### Task 16: Guards 双层架构

**前置依赖：** Task 10（`.omc/axiom/active_context.md` 已创建）

**层 A：Git Hooks（Shell 脚本）**

**Files:**
- Create: `scripts/hooks/pre-commit.sh`
- Create: `scripts/hooks/post-commit.sh`
- Create: `scripts/hooks/install-hooks.sh`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\guards\pre-commit`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\guards\post-commit`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\guards\install_hooks.py`

**Step 1: 读取 Axiom guards 源文件**

**Step 2: 创建目录并写入 Shell 脚本**

```bash
mkdir -p scripts/hooks
```

将 pre-commit 和 post-commit 逻辑转换为 Shell 脚本（`.sh`），install_hooks.py 转换为 `install-hooks.sh`。

**层 B：Claude Code Hooks（TypeScript）**

**Files:**
- Create: `src/hooks/guards/pre-tool.ts`
- Create: `src/hooks/guards/post-tool.ts`
- Create: `src/hooks/guards/session-watchdog.ts`
- Create: `src/hooks/guards/status-dashboard.ts`

**Step 3: 实现 pre-tool.ts**

注册 `PreToolUse` 事件，执行权限检查和范围验证。

**Step 4: 实现 post-tool.ts**

注册 `PostToolUse` 事件，更新 `.omc/axiom/active_context.md`。

**Step 5: 实现 session-watchdog.ts**

注册 `Stop` 事件，检测会话超时并清理状态。

**Step 6: 实现 status-dashboard.ts**

工具函数，输出 Axiom 系统状态摘要。

**Step 7: 类型检查**

```bash
npx tsc --noEmit
```

Expected: 无错误

**Step 8: Commit**

```bash
git add scripts/hooks/ src/hooks/guards/
git commit -m "feat(guards): add dual-layer Guards (Git hooks shell scripts + Claude Code hooks TypeScript)"
```

---

### Task 17: 增强现有 axiom-* agents（非新建）

**重要：** 以下 7 个文件已存在，本任务为增强，不是新建。

**Files:**
- Modify: `agents/axiom-requirement-analyst.md`
- Modify: `agents/axiom-product-designer.md`
- Modify: `agents/axiom-review-aggregator.md`
- Modify: `agents/axiom-prd-crafter.md`
- Modify: `agents/axiom-system-architect.md`
- Modify: `agents/axiom-evolution-engine.md`
- Modify: `agents/axiom-context-manager.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\skills\` 对应子目录

**Step 1: 验证 7 个文件存在**

```bash
ls agents/axiom-*.md
```

Expected: 7 个文件

**Step 2: 并行读取所有文件**

并行读取 7 个 agent 文件和对应的 Axiom skill 文件。

**Step 3: 为每个 agent 追加独特指令**

提取 Axiom skill 中不重复的指令，追加到对应 agent 末尾。

**Step 4: Commit**

```bash
git add agents/axiom-*.md
git commit -m "feat(agents): enhance existing axiom-* agents with Axiom skill instructions"
```

---

### Task 18: 更新文档

**Files:**
- Modify: `CLAUDE.md`（项目根）
- Modify: `README.md`（如存在）

**Step 1: 读取当前 CLAUDE.md**

**Step 2: 追加新 skill 列表**

在 CLAUDE.md 的 skills 部分追加：
```markdown
- `ax-reflect`（"reflect"、"反思"）：Axiom 反思工作流
- `ax-rollback`（"rollback"、"回滚"）：Axiom 回滚工作流
- `ax-status`（"ax-status"、"axiom status"）：Axiom 状态查看
- `ax-suspend`（"suspend"、"暂停任务"）：Axiom 任务暂停
- `ax-knowledge`（"knowledge"、"知识库"）：Axiom 知识库管理
- `ax-export`（"ax-export"、"导出"）：Axiom 导出工作流
```

**Step 3: 运行构建验证**

```bash
npm run build
```

Expected: 无错误

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with new Axiom ax-* skills"
```

---

## 验收标准

- [ ] 9 个 AI 适配器文件就位（含 CLAUDE.md 合并到项目根）
- [ ] 6 个 agent 提示词已合并增强（critic/architect/product-manager/ux-researcher/analyst/writer）
- [ ] 10 个工作流已合并增强到现有 skills
- [ ] 6 个新 ax-* skills 已创建（ax-reflect/rollback/status/suspend/knowledge/export）
- [ ] 4 个规则文件已迁移到 templates/rules/
- [ ] 2 个 prompts/templates 文件已迁移到 templates/axiom/
- [ ] 25+ memory/knowledge 条目已迁移到 `.omc/knowledge/`
- [ ] knowledge/ 独立目录已迁移到 `.omc/knowledge/axiom-patterns/`
- [ ] 7 个记忆文件已迁移到 `.omc/axiom/`
- [ ] scripts/ 已归档到 `templates/axiom/scripts/`
- [ ] axiom-config.ts 实现通过类型检查
- [ ] Context Manager TypeScript 实现通过类型检查（7 操作含 merge/clear）
- [ ] Evolution Engine TypeScript 实现通过类型检查（9 个模块）
- [ ] Guards 双层架构：Git hooks（scripts/hooks/）+ Claude Code hooks（src/hooks/guards/）
- [ ] 7 个现有 axiom-* agents 已增强（非新建）
- [ ] `npm run build` 无错误
- [ ] 新增 skill 可通过 `/ultrapower:ax-*` 调用
