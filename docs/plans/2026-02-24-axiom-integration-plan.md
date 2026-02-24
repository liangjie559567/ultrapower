# Axiom Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `ultrapower:executing-plans` to implement this plan task-by-task.

**Goal:** 将 Axiom `.agent/` 配置体系完整集成到 ultrapower v5.0.2

**Architecture:** 三阶段渐进式集成——Phase 1 直接迁移 Markdown，Phase 2 知识库与记忆文件，Phase 3 Python→TypeScript 重写

**Tech Stack:** TypeScript/Node.js, Markdown, JSON

**Design Doc:** `docs/plans/2026-02-24-axiom-integration-design.md`

---

## Phase 1: 直接 Markdown 迁移

### Task 1: 创建 AI 适配器目录结构

**Files:**
- Create: `.codex/AGENTS.md`
- Create: `.gemini/GEMINI.md`
- Create: `.gemini/GEMINI-CLI.md`
- Create: `.github/copilot-instructions.md`
- Create: `.cursorrules`
- Create: `.kiro/steering/axiom.md`
- Create: `.opencode/AGENTS.md`

**Step 1: 读取 Axiom 适配器源文件**

读取以下文件内容：
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\codex\CODEX.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\gemini\GEMINI.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\gemini-cli\GEMINI-CLI.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\copilot\copilot-instructions.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\cursor\.cursorrules`
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\kiro\KIRO.md`
- `C:\Users\ljyih\Desktop\Axiom\.agent\adapters\opencode\OPENCODE.md`

**Step 2: 创建目录并写入文件**

```bash
mkdir -p .codex .gemini .github .kiro/steering .opencode
```

将每个适配器文件内容写入对应目标路径。

**Step 3: 验证文件存在**

```bash
ls -la .codex/ .gemini/ .github/ .kiro/steering/ .opencode/
```

Expected: 7 个文件均存在

**Step 4: Commit**

```bash
git add .codex/ .gemini/ .github/copilot-instructions.md .cursorrules .kiro/ .opencode/
git commit -m "feat(adapters): add Axiom AI tool adapters for Codex/Gemini/Copilot/Cursor/Kiro/OpenCode"
```

---

### Task 2: 合并增强 Agent 提示词（critic + architect）

**Files:**
- Modify: `agents/critic.md`
- Modify: `agents/architect.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\prompts\roles\critic.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\prompts\roles\tech_lead.md`

**Step 1: 读取现有 ultrapower agent 文件**

读取 `agents/critic.md` 和 `agents/architect.md` 的当前内容。

**Step 2: 读取 Axiom 角色文件**

读取 Axiom `critic.md`（三维评审清单：Security P0/Edge Cases P1/Logic Gaps P2）和 `tech_lead.md`。

**Step 3: 追加 Axiom 内容到 critic.md**

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

**Step 4: 追加 Axiom tech_lead 内容到 architect.md**

读取 `tech_lead.md` 并提取独特指令追加到 `agents/architect.md`。

**Step 5: 验证文件修改**

```bash
tail -20 agents/critic.md
tail -20 agents/architect.md
```

**Step 6: Commit**

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

**Step 1: 读取所有 Axiom 角色文件**

并行读取 4 个 Axiom 角色文件。

**Step 2: 读取现有 ultrapower agent 文件**

并行读取 4 个 ultrapower agent 文件。

**Step 3: 为每个 agent 追加 Axiom 增强内容**

提取每个 Axiom 角色的独特指令（避免与现有内容重复），追加到对应 ultrapower agent 末尾。

**Step 4: Commit**

```bash
git add agents/product-manager.md agents/ux-researcher.md agents/analyst.md agents/writer.md
git commit -m "feat(agents): enhance product-manager/ux-researcher/analyst/writer with Axiom roles"
```

---

### Task 4: 合并增强现有 Skills（brainstorming + systematic-debugging）

**Files:**
- Modify: `skills/brainstorming/SKILL.md`
- Modify: `skills/systematic-debugging/SKILL.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\1-drafting.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\analyze-error.md`

**Step 1: 读取 Axiom 工作流文件**

读取 `1-drafting.md` 和 `analyze-error.md`。

**Step 2: 读取现有 skill 文件**

读取 `skills/brainstorming/SKILL.md` 和 `skills/systematic-debugging/SKILL.md`。

**Step 3: 提取 Axiom 独特内容并追加**

从 `1-drafting.md` 提取 Axiom 草稿阶段的独特步骤，追加到 brainstorming skill。
从 `analyze-error.md` 提取错误分析的独特步骤，追加到 systematic-debugging skill。

**Step 4: Commit**

```bash
git add skills/brainstorming/SKILL.md skills/systematic-debugging/SKILL.md
git commit -m "feat(skills): enhance brainstorming and systematic-debugging with Axiom workflows"
```

---

### Task 5: 合并增强现有 Skills（writing-plans + executing-plans + subagent-driven-development）

**Files:**
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/executing-plans/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\3-decomposing.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\4-implementing.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\feature-flow.md`

**Step 1: 读取 Axiom 工作流文件**

并行读取 3 个工作流文件。

**Step 2: 读取现有 skill 文件**

并行读取 3 个 skill 文件。

**Step 3: 提取并追加独特内容**

重点提取：
- `3-decomposing.md` 的 DAG 任务分解方法 → `writing-plans`
- `4-implementing.md` 的 PM→Worker 协议 → `executing-plans`
- `feature-flow.md` 的完整功能流程 → `subagent-driven-development`

**Step 4: Commit**

```bash
git add skills/writing-plans/SKILL.md skills/executing-plans/SKILL.md skills/subagent-driven-development/SKILL.md
git commit -m "feat(skills): enhance writing-plans/executing-plans/subagent-driven with Axiom workflows"
```

---

### Task 6: 新建 Axiom 专属 Skills（ax-reflect/ax-rollback/ax-status/ax-suspend/ax-knowledge）

**Files:**
- Create: `skills/ax-reflect/SKILL.md`
- Create: `skills/ax-rollback/SKILL.md`
- Create: `skills/ax-status/SKILL.md`
- Create: `skills/ax-suspend/SKILL.md`
- Create: `skills/ax-knowledge/SKILL.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\reflect.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\rollback.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\status.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\suspend.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\workflows\knowledge.md`

**Step 1: 读取所有 Axiom 工作流源文件**

并行读取 5 个工作流文件。

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

**Step 3: 验证文件创建**

```bash
ls skills/ax-*/SKILL.md
```

Expected: 5 个文件

**Step 4: Commit**

```bash
git add skills/ax-reflect/ skills/ax-rollback/ skills/ax-status/ skills/ax-suspend/ skills/ax-knowledge/
git commit -m "feat(skills): add new Axiom skills ax-reflect/rollback/status/suspend/knowledge"
```

---

### Task 7: 迁移规则引擎文件

**Files:**
- Create: `templates/rules/axiom-gatekeepers.md`
- Create: `templates/rules/axiom-provider-router.md`
- Create: `templates/rules/axiom-router.md`
- Create: `templates/rules/axiom-skills.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\rules\gatekeepers.rule`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\rules\provider_router.rule`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\rules\router.rule`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\rules\skills.rule`

**Step 1: 读取所有规则文件**

并行读取 4 个 `.rule` 文件。

**Step 2: 写入目标路径**

将每个规则文件内容写入 `templates/rules/axiom-*.md`，在文件头部添加注释说明来源。

**Step 3: Commit**

```bash
git add templates/rules/axiom-*.md
git commit -m "feat(rules): migrate Axiom rule engine files to templates/rules/"
```

---

## Phase 2: 知识库与记忆文件

### Task 8: 迁移知识库（25+ 条目）

**Files:**
- Create: `.omc/knowledge/` (目录 + 25+ 文件)
- Create: `.omc/knowledge/index.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\memory\knowledge\k-001` 到 `k-025`

**Step 1: 创建目录**

```bash
mkdir -p .omc/knowledge
```

**Step 2: 复制所有知识条目**

读取并写入每个 `k-0xx-*.md` 文件到 `.omc/knowledge/`。

**Step 3: 创建索引文件**

创建 `.omc/knowledge/index.md`，列出所有知识条目的标题和简介。

**Step 4: Commit**

```bash
git add .omc/knowledge/
git commit -m "feat(knowledge): migrate Axiom knowledge base (25+ entries) to .omc/knowledge/"
```

---

### Task 9: 迁移 Axiom 记忆 Markdown 文件

**Files:**
- Create: `.omc/axiom/project_decisions.md`
- Create: `.omc/axiom/user_preferences.md`
- Create: `.omc/axiom/active_context.md`
- Create: `.omc/axiom/reflection_log.md`
- Create: `.omc/axiom/state_machine.md`
- Create: `.omc/axiom/evolution/knowledge_base.md`
- Create: `.omc/axiom/evolution/pattern_library.md`

**Step 1: 创建目录**

```bash
mkdir -p .omc/axiom/evolution
```

**Step 2: 读取并写入记忆文件**

从 `C:\Users\ljyih\Desktop\Axiom\.agent\memory\` 读取每个文件并写入目标路径。

**Step 3: Commit**

```bash
git add .omc/axiom/
git commit -m "feat(memory): migrate Axiom memory Markdown files to .omc/axiom/"
```

---

## Phase 3: TypeScript 重写

### Task 10: 实现 Context Manager TypeScript 模块

**Files:**
- Create: `src/hooks/memory/index.ts`
- Create: `src/hooks/memory/types.ts`
- Create: `src/hooks/memory/context-manager.ts`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\memory\context_manager.py`

**Step 1: 读取 Python 源文件**

读取 `context_manager.py` 理解接口和逻辑。

**Step 2: 创建 TypeScript 类型定义**

```typescript
// types.ts
export type MemorySection = 'active' | 'decisions' | 'preferences' | 'reflection';

export interface ContextStatus {
  activeContext: string;
  lastCheckpoint: string | null;
  sessionId: string;
}

export interface ContextManager {
  read(section: MemorySection): Promise<string>;
  write(section: MemorySection, content: string): Promise<void>;
  checkpoint(label: string): Promise<void>;
  restore(label: string): Promise<void>;
  status(): Promise<ContextStatus>;
  merge(section: MemorySection, content: string): Promise<void>;
  clear(section: MemorySection): Promise<void>;
}
```

**Step 3: 实现 context-manager.ts**

实现 7 个操作：read/write/status/checkpoint/restore/merge/clear。
文件路径基于 `.omc/axiom/` 目录。

**Step 4: 创建 index.ts 导出**

```typescript
export { ContextManager, MemorySection, ContextStatus } from './types';
export { createContextManager } from './context-manager';
```

**Step 5: 类型检查**

```bash
npx tsc --noEmit
```

Expected: 无类型错误

**Step 6: Commit**

```bash
git add src/hooks/memory/
git commit -m "feat(hooks): implement Context Manager TypeScript module (7-operation memory system)"
```

---

### Task 11: 实现 Evolution Engine TypeScript 模块（核心部分）

**Files:**
- Create: `src/hooks/learner/harvester.ts`
- Create: `src/hooks/learner/pattern-detector.ts`
- Create: `src/hooks/learner/confidence.ts`
- Create: `src/hooks/learner/metrics.ts`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\harvester.py`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\pattern_detector.py`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\confidence.py`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\evolution\metrics.py`

**Step 1: 读取 Python 源文件**

并行读取 4 个 Python 文件。

**Step 2: 实现 harvester.ts**

从对话历史中提取模式，写入 `.omc/axiom/evolution/pattern_library.md`。

**Step 3: 实现 pattern-detector.ts**

检测重复模式，计算出现频率，标记高价值模式。

**Step 4: 实现 confidence.ts**

为每个知识条目计算信心分数（0-1），基于使用频率和成功率。

**Step 5: 实现 metrics.ts**

收集 agent 执行指标：成功率、平均耗时、错误类型分布。

**Step 6: 类型检查**

```bash
npx tsc --noEmit
```

**Step 7: Commit**

```bash
git add src/hooks/learner/harvester.ts src/hooks/learner/pattern-detector.ts src/hooks/learner/confidence.ts src/hooks/learner/metrics.ts
git commit -m "feat(hooks): implement Evolution Engine core modules (harvester/pattern-detector/confidence/metrics)"
```

---

### Task 12: 实现 Evolution Engine TypeScript 模块（编排部分）

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

**Step 1: 读取 Python 源文件**

并行读取 5 个 Python 文件。

**Step 2: 实现各模块**

- `orchestrator.ts`：协调进化流程，调用 harvester→pattern_detector→reflection
- `reflection.ts`：生成反思报告，写入 `.omc/axiom/reflection_log.md`
- `learning-queue.ts`：管理待学习项目队列（FIFO，最大 100 条）
- `index-manager.ts`：维护知识库索引，支持按标签/置信度查询
- `seed-knowledge.ts`：初始化种子知识，从 `.omc/knowledge/` 加载

**Step 3: 更新 learner hook 的 index.ts**

将新模块集成到现有 `src/hooks/learner/index.ts` 导出。

**Step 4: 类型检查**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/hooks/learner/orchestrator.ts src/hooks/learner/reflection.ts src/hooks/learner/learning-queue.ts src/hooks/learner/index-manager.ts src/hooks/learner/seed-knowledge.ts
git commit -m "feat(hooks): implement Evolution Engine orchestration modules (orchestrator/reflection/queue/index)"
```

---

### Task 13: 实现 Guards TypeScript 模块

**Files:**
- Create: `src/hooks/guards/index.ts`
- Create: `src/hooks/guards/types.ts`
- Create: `src/hooks/guards/pre-commit.ts`
- Create: `src/hooks/guards/post-commit.ts`
- Create: `src/hooks/guards/session-watchdog.ts`
- Create: `src/hooks/guards/status-dashboard.ts`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\guards\pre-commit`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\guards\post-commit`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\guards\session_watchdog.py`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\guards\status_dashboard.py`

**Step 1: 读取 Guards 源文件**

并行读取 4 个源文件。

**Step 2: 创建类型定义**

```typescript
// types.ts
export interface GuardResult {
  passed: boolean;
  message?: string;
  blockers?: string[];
}

export interface WatchdogStatus {
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  isStale: boolean;
}
```

**Step 3: 实现 pre-commit.ts**

Hook 事件：`PreToolUse`（Write/Edit 工具）
检查：文件是否在允许范围内、内容是否包含敏感信息。

**Step 4: 实现 post-commit.ts**

Hook 事件：`PostToolUse`（Write/Edit 工具）
动作：更新 `active_context.md`，记录变更摘要。

**Step 5: 实现 session-watchdog.ts**

Hook 事件：`Stop`
检查：会话是否超时（>2小时），清理过期状态文件。

**Step 6: 实现 status-dashboard.ts**

输出当前 Axiom 系统状态：活跃上下文、进化队列长度、知识库条目数。

**Step 7: 创建 index.ts**

导出所有 guards 模块。

**Step 8: 类型检查**

```bash
npx tsc --noEmit
```

**Step 9: Commit**

```bash
git add src/hooks/guards/
git commit -m "feat(hooks): implement Guards TypeScript module (pre/post-commit, watchdog, dashboard)"
```

---

### Task 14: 注册新 Axiom Agents 到 definitions.ts

**Files:**
- Modify: `src/agents/definitions.ts`
- Create: `agents/axiom-requirement-analyst.md`
- Create: `agents/axiom-product-designer.md`
- Create: `agents/axiom-review-aggregator.md`
- Create: `agents/axiom-prd-crafter.md`
- Create: `agents/axiom-system-architect.md`
- Create: `agents/axiom-evolution-engine.md`
- Create: `agents/axiom-context-manager.md`
- Reference: `C:\Users\ljyih\Desktop\Axiom\.agent\skills\` (7 个 skill 目录)

**Step 1: 读取 Axiom skills 目录**

读取 7 个 Axiom skill 目录中的主要文件，提取 agent 角色定义。

**Step 2: 为每个 agent 创建 Markdown 提示词文件**

基于 Axiom skill 内容创建 7 个 `agents/axiom-*.md` 文件。

**Step 3: 读取 definitions.ts**

读取 `src/agents/definitions.ts` 了解现有注册格式。

**Step 4: 追加新 agent 注册**

在 `getAgentDefinitions()` 中追加 7 个新 agent 定义。

**Step 5: 类型检查**

```bash
npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add agents/axiom-*.md src/agents/definitions.ts
git commit -m "feat(agents): register 7 new Axiom agents in definitions.ts"
```

---

### Task 15: 更新文档（CLAUDE.md + README.md）

**Files:**
- Modify: `docs/CLAUDE.md`
- Modify: `README.md`

**Step 1: 更新 agent 数量**

将 docs/CLAUDE.md 和 README.md 中的 "38 个 agents" 更新为 "45 个 agents"（+7 Axiom agents）。

**Step 2: 更新 skill 数量**

将 "67 个 skills" 更新为 "72 个 skills"（+5 新 Axiom skills）。

**Step 3: 在 README.md 中添加 Axiom 集成章节**

在 Agents 表格中添加 Axiom Agents 小节，在 Skills 表格中添加 Axiom Skills 小节。

**Step 4: 构建验证**

```bash
npm run build
```

Expected: 构建成功，无错误

**Step 5: Commit**

```bash
git add docs/CLAUDE.md README.md
git commit -m "docs: update agent count to 45 and skill count to 72 after Axiom integration"
```

---

## 验收检查清单

- [ ] Task 1: 9 个 AI 适配器文件就位
- [ ] Task 2-3: 6 个 agent 提示词已合并增强
- [ ] Task 4-5: 5 个现有 skill 已合并增强
- [ ] Task 6: 5 个新 Axiom skill 已创建
- [ ] Task 7: 4 个规则文件已迁移
- [ ] Task 8: 25+ 知识条目已迁移到 `.omc/knowledge/`
- [ ] Task 9: 7 个记忆文件已迁移到 `.omc/axiom/`
- [ ] Task 10: Context Manager TypeScript 通过类型检查
- [ ] Task 11-12: Evolution Engine TypeScript 通过类型检查
- [ ] Task 13: Guards TypeScript 通过类型检查
- [ ] Task 14: 7 个新 Axiom agents 已注册
- [ ] Task 15: `npm run build` 无错误，文档已更新
