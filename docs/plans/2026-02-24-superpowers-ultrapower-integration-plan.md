# superpowers × ultrapower Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增 `next-step-router` skill，并为18个 superpowers skills 添加路由触发点，实现 superpowers × ultrapower 深度集成。

**Architecture:** Claude 在每个 skill 关键节点完成后，主动检查路由映射表，通过 AskUserQuestion 向用户推荐最优下一步 agent/skill，并通过 notepad 持久化完整上下文（full_context）。

**Tech Stack:** Markdown skill files, notepad API (notepad_write_working / notepad_read), AskUserQuestion tool

**Design Doc:** `docs/plans/2026-02-24-superpowers-ultrapower-integration-design.md`

---

### Task 1: 创建 next-step-router skill 文件

**Files:**
- Create: `skills/next-step-router/SKILL.md`

**Step 1: 创建目录**

```bash
mkdir -p skills/next-step-router
```

**Step 2: 写入 SKILL.md 内容**

创建 `skills/next-step-router/SKILL.md`，内容如下：

```markdown
---
name: next-step-router
description: 在关键节点分析产出内容，用 AskUserQuestion 推荐最优下一步 agent/skill，并完整传递上下文
---

# Next Step Router

## 触发方式

由其他 skill 在关键节点末尾调用，传入以下参数：
- `current_skill`: 当前完成的 skill 名称（如 "brainstorming"）
- `stage`: 当前阶段标识（如 "design_approved", "root_cause_confirmed", "plan_committed"）
- `output_summary`: 当前 skill 的产出摘要（文件数、变更类型、关键决策）
- `full_context`: 完整上下文对象
  - `doc_paths`: 相关文档路径列表
  - `key_decisions`: 用户已确认的关键决策
  - `user_direction`: 用户选择的方向（前端/后端/架构/调试）
  - `codebase_summary`: explore agent 的代码库理解摘要（如有）

## 智能分析逻辑

### 第一步：分析产出信号

分析 output_summary：
- 文件数 > 10          → 推荐 deep-executor 而非 executor
- 含 "security"/"auth" → 触发 security-reviewer 分支
- 含 "architecture"    → 推荐 architect 而非 planner
- 含 "performance"     → 触发 performance-reviewer 分支
- 含 "API change"      → 推荐 api-reviewer
- 文件数 1-3           → 推荐 executor（轻量）
- 含 "UI"/"component"/"frontend" → 推荐 frontend-ui-ux skill
- 含 "research"/"analysis"       → 推荐 sciomc skill
- 含 "external"/"reference"      → 推荐 external-context skill
- 首次初始化代码库                → 推荐 deepinit skill

### 第二步：结合用户上下文

full_context.user_direction:
- "frontend"  → 优先 frontend-ui-ux skill → designer agent
- "backend"   → 优先 executor agent
- "debug"     → 优先 debugger agent
- "architect" → 优先 architect agent
- "research"  → 优先 sciomc skill → external-context skill

### 第三步：查路由映射表

根据 current_skill + stage 组合查完整路由映射表，得到：
- 主推 agent/skill（置信度 60-95%）
- 备选 agent/skill（置信度 30-60%）
- 推荐理由

## 完整路由映射表

### 阶段0：探索（强制前置）

| current_skill | stage | 主推 | 备选 |
|---|---|---|---|
| explore | codebase_understood (AGENTS.md 已存在) | brainstorming | systematic-debugging |
| explore | codebase_understood (AGENTS.md 不存在) | deepinit | brainstorming |
| deepinit | agents_md_generated | brainstorming | sciomc |
| explore | codebase_understood (需深度研究) | sciomc | brainstorming |
| sciomc | analysis_report_complete | brainstorming | external-context |
| external-context | external_context_gathered | brainstorming | sciomc |

### 阶段1：探索与设计

| current_skill | stage | 主推 | 备选 |
|---|---|---|---|
| using-superpowers | explore_complete | brainstorming | systematic-debugging |
| brainstorming | design_approved | writing-plans | architect |
| brainstorming | ui_design_needed | frontend-ui-ux | designer |
| ralplan | consensus_reached | writing-plans | architect |
| frontend-ui-ux | ui_design_approved | writing-plans | brainstorming |

### 阶段2：规划与隔离

| current_skill | stage | 主推 | 备选 |
|---|---|---|---|
| writing-plans | plan_committed | using-git-worktrees | subagent-driven-development |
| using-git-worktrees | worktree_ready | subagent-driven-development | executing-plans |

### 阶段3：实现

| current_skill | stage | 主推 | 备选 |
|---|---|---|---|
| writing-plans | plan_committed (多组件) | team | ralph |
| subagent-driven-development | subagent_task_complete | requesting-code-review | quality-reviewer |
| executing-plans | batch_complete | requesting-code-review | verification-before-completion |
| dispatching-parallel-agents | all_results_returned | verifier | quality-reviewer |

### 阶段3b：调试支路

| current_skill | stage | 主推 | 备选 |
|---|---|---|---|
| systematic-debugging | root_cause_confirmed | test-driven-development | executor |
| test-driven-development | green_complete | requesting-code-review | verification-before-completion |

### 阶段4：审查

| current_skill | stage | 主推 | 备选 |
|---|---|---|---|
| requesting-code-review | review_returned | receiving-code-review | executor |
| receiving-code-review | review_addressed | verification-before-completion | finishing-a-development-branch |

### 阶段5：验证

| current_skill | stage | 主推 | 备选 |
|---|---|---|---|
| verification-before-completion | verification_passed | build-fixer | finishing-a-development-branch |

### 阶段6：部署测试

| current_skill | stage | 主推 | 备选 |
|---|---|---|---|
| qa-tester | tests_failed | ultraqa | executor |
| qa-tester | tests_passed | test-engineer | product-manager |
| ultraqa | all_tests_passed | test-engineer | product-manager |

### 阶段7：产品验收

| current_skill | stage | 主推 | 备选 |
|---|---|---|---|
| product-manager | prd_accepted | ux-researcher | finishing-a-development-branch |
| ux-researcher | ux_audit_complete | finishing-a-development-branch | executor |

### 阶段8：收尾与发布

| current_skill | stage | 主推 | 备选 |
|---|---|---|---|
| finishing-a-development-branch | merge_strategy_confirmed | git-master | verifier |
| git-master | pr_merged | release | — |

## 输出格式

用 AskUserQuestion 呈现（最多4个选项）：

选项1: [主推] agent/skill 名称
  理由: 基于[信号]，置信度[X]%
选项2: [备选] agent/skill 名称
  理由: [简短说明]
选项3: 跳过，我自己决定
选项4: 查看完整路由映射表

## 用户确认后的处理

用户选择主推或备选后：
1. 调用 `notepad_write_working` 记录本次路由决策（current_skill、stage、选定目标、置信度）
2. 调用 `notepad_read` 获取完整 `full_context`，传递给选定 agent/skill
3. 在传递时附加本次路由决策记录（用于后续追溯）

用户选择"跳过，我自己决定"时：
1. 调用 `notepad_write_working` 保留当前 `full_context`（不丢失上下文）
2. 不触发任何 agent/skill，等待用户下一条消息

## 错误处理路由

| 失败类型 | 路由到 | 说明 |
|---|---|---|
| executor 超时/崩溃 | debugger agent | 分析失败原因，再决定是否重试 |
| build-fixer 无法修复 | 上报用户 + notepad 记录 | 超出自动修复能力，需人工介入 |
| verifier 无法验证 | quality-reviewer agent | 换角度验证 |
| 任意 agent 连续失败2次 | 上报用户 | 避免无限循环，保留上下文供用户决策 |
```

**Step 3: 验证文件创建**

```bash
cat skills/next-step-router/SKILL.md | head -5
```
Expected: 显示 frontmatter `---` 开头

**Step 4: Commit**

```bash
git add skills/next-step-router/SKILL.md
git commit -m "feat: add next-step-router skill"
```

---

### Task 2: 修改 brainstorming skill — 添加强制前置探索

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

**Step 1: 找到检查清单位置**

```bash
grep -n "Checklist\|检查清单\|## Process" skills/brainstorming/SKILL.md | head -5
```

**Step 2: 在检查清单之前插入强制前置步骤块**

在 `## Checklist` 标题之前插入（使用 Edit 工具，old_string 为 `## Checklist`）：

```markdown
## 强制前置：代码库探索

<HARD-GATE>
在开始任何设计对话之前，必须先完成代码库探索。不允许跳过此步骤。
</HARD-GATE>

### 触发时立即执行

1. 调用 `notepad_read` 检查是否已有 `codebase_summary`
   - 若已有：直接使用，不重复调用 explore
   - 若无：调用 `explore` agent（model: haiku）扫描代码库

2. explore 扫描内容：项目结构、相关文件、近期5个 commit、现有约定

3. 将探索结果写入 notepad（`notepad_write_working`，key: codebase_summary）

4. 探索完成后，才进入"理解想法"阶段

### 探索完成标准
- [ ] 已识别与任务相关的主要文件（≥3个）
- [ ] 已了解现有架构模式
- [ ] 已检查近期相关提交
```

**Step 3: 在文件末尾追加路由触发**

```markdown
## 路由触发（设计批准后）

设计文档提交到 git 后，调用 `next-step-router`：
- current_skill: "brainstorming"
- stage: "design_approved"
- output_summary: 设计涉及的文件数、模块数、是否有架构/安全/性能变更
- full_context: { doc_paths: [设计文档路径], key_decisions: [...], codebase_summary: [...] }
```

**Step 4: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat(brainstorming): add mandatory explore gate and next-step-router trigger"
```

---

### Task 3: 修改 using-superpowers skill — 添加新功能路由规则

**Files:**
- Modify: `skills/using-superpowers/SKILL.md`

**Step 1: 找到红旗/Red Flags 位置**

```bash
grep -n "红旗\|Red Flag" skills/using-superpowers/SKILL.md | head -3
```

**Step 2: 在 `## Red Flags` 标题之前插入新功能路由规则**（使用 Edit 工具，old_string 为 `## Red Flags`）

```markdown
## 新功能路由规则

当用户请求涉及**新功能开发**时（非 bug 修复），强制执行以下流程：

1. 调用 explore agent（haiku）→ 理解代码库，写入 notepad（codebase_summary）
2. 调用 brainstorming skill → 设计对话（brainstorming 会读取 notepad，不重复 explore）
3. 设计批准后 → next-step-router 推荐下一步

**判断是否为新功能：**
- 包含"添加"、"新增"、"实现"、"构建"、"创建" → 新功能流程
- 包含"修复"、"bug"、"错误"、"不工作" → 调试流程（systematic-debugging）
- 包含"重构"、"优化"、"改进" → 先 explore，再判断

**路由触发（每次消息到达后）：**
- 新功能 → explore agent → brainstorming
- 已知 bug → systematic-debugging
- 不确定 → AskUserQuestion 询问用户意图
```

**Step 3: Commit**

```bash
git add skills/using-superpowers/SKILL.md
git commit -m "feat(using-superpowers): add new feature routing rules"
```

---

### Task 4: 为规划与隔离阶段 skills 添加路由触发

**Files:**
- Modify: `skills/writing-plans/SKILL.md`
- Modify: `skills/using-git-worktrees/SKILL.md`

**Step 1: writing-plans/SKILL.md 末尾追加**

```markdown
## 路由触发

计划文档提交后调用 `next-step-router`：
- current_skill: "writing-plans"
- stage: "plan_committed"
- output_summary: 计划中的任务数、涉及文件数、是否有架构变更
- full_context: { doc_paths: [计划文档路径], key_decisions: [...] }
```

**Step 2: using-git-worktrees/SKILL.md 末尾追加**

```markdown
## 路由触发

worktree 创建并验证后调用 `next-step-router`：
- current_skill: "using-git-worktrees"
- stage: "worktree_ready"
- output_summary: worktree 路径、基于哪个分支
```

**Step 3: Commit**

```bash
git add skills/writing-plans/SKILL.md skills/using-git-worktrees/SKILL.md
git commit -m "feat: add next-step-router triggers to writing-plans and using-git-worktrees"
```

---

### Task 5: 为实现阶段 skills 添加路由触发

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`
- Modify: `skills/executing-plans/SKILL.md`
- Modify: `skills/dispatching-parallel-agents/SKILL.md`

**Step 1: subagent-driven-development/SKILL.md 末尾追加**

```markdown
## 路由触发

每个 subagent 任务完成后调用 `next-step-router`：
- current_skill: "subagent-driven-development"
- stage: "subagent_task_complete"
- output_summary: 完成的任务描述、修改的文件列表
```

**Step 2: executing-plans/SKILL.md 末尾追加**

```markdown
## 路由触发

每批次执行完毕后调用 `next-step-router`：
- current_skill: "executing-plans"
- stage: "batch_complete"
- output_summary: 本批次完成的任务数、剩余任务数
```

**Step 3: dispatching-parallel-agents/SKILL.md 末尾追加**

```markdown
## 路由触发

所有并行 agent 结果汇聚后调用 `next-step-router`：
- current_skill: "dispatching-parallel-agents"
- stage: "all_results_returned"
- output_summary: agent 数量、成功/失败数、汇总结果
```

**Step 4: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md skills/executing-plans/SKILL.md skills/dispatching-parallel-agents/SKILL.md
git commit -m "feat: add next-step-router triggers to implementation skills"
```

---

### Task 6: 为调试支路 skills 添加路由触发

**Files:**
- Modify: `skills/systematic-debugging/SKILL.md`
- Modify: `skills/test-driven-development/SKILL.md`

**Step 1: systematic-debugging/SKILL.md 末尾追加**

```markdown
## 路由触发

根因确认后调用 `next-step-router`：
- current_skill: "systematic-debugging"
- stage: "root_cause_confirmed"
- output_summary: 根因描述、涉及文件、是否需要测试先行
```

**Step 2: test-driven-development/SKILL.md 末尾追加**

```markdown
## 路由触发

GREEN 阶段完成后调用 `next-step-router`：
- current_skill: "test-driven-development"
- stage: "green_complete"
- output_summary: 通过的测试数、修改的文件列表
```

**Step 3: Commit**

```bash
git add skills/systematic-debugging/SKILL.md skills/test-driven-development/SKILL.md
git commit -m "feat: add next-step-router triggers to debugging skills"
```

---

### Task 7: 为审查阶段 skills 添加路由触发

**Files:**
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/receiving-code-review/SKILL.md`

**Step 1: requesting-code-review/SKILL.md 末尾追加**

```markdown
## 路由触发

审查报告返回后调用 `next-step-router`：
- current_skill: "requesting-code-review"
- stage: "review_returned"
- output_summary: 审查意见数量、严重程度分布
```

**Step 2: receiving-code-review/SKILL.md 末尾追加**

```markdown
## 路由触发

所有审查意见处理完毕后调用 `next-step-router`：
- current_skill: "receiving-code-review"
- stage: "review_addressed"
- output_summary: 处理的意见数、修改的文件列表
```

**Step 3: Commit**

```bash
git add skills/requesting-code-review/SKILL.md skills/receiving-code-review/SKILL.md
git commit -m "feat: add next-step-router triggers to review skills"
```

---

### Task 8: 为验证与收尾 skills 添加路由触发

**Files:**
- Modify: `skills/verification-before-completion/SKILL.md`
- Modify: `skills/finishing-a-development-branch/SKILL.md`
- Modify: `skills/writing-skills/SKILL.md`

**Step 1: verification-before-completion/SKILL.md 末尾追加**

```markdown
## 路由触发

验证通过后调用 `next-step-router`：
- current_skill: "verification-before-completion"
- stage: "verification_passed"
- output_summary: 验证项目数、通过率、是否有构建错误
```

**Step 2: finishing-a-development-branch/SKILL.md 末尾追加**

```markdown
## 路由触发

用户选择整合方式后调用 `next-step-router`：
- current_skill: "finishing-a-development-branch"
- stage: "merge_strategy_confirmed"
- output_summary: 选择的整合方式（merge/squash/rebase）
```

**Step 3: writing-skills/SKILL.md 末尾追加**

```markdown
## 路由触发

skill 压力测试通过后调用 `next-step-router`：
- current_skill: "writing-skills"
- stage: "stress_test_passed"
- output_summary: 测试的 skill 名称、通过的测试场景数
```

**Step 4: Commit**

```bash
git add skills/verification-before-completion/SKILL.md skills/finishing-a-development-branch/SKILL.md skills/writing-skills/SKILL.md
git commit -m "feat: add next-step-router triggers to verification and finishing skills"
```

---

### Task 9: 为新增 skills 添加路由触发

**Files:**
- Modify: `skills/deepinit/SKILL.md`
- Modify: `skills/sciomc/SKILL.md`
- Modify: `skills/external-context/SKILL.md`
- Modify: `skills/frontend-ui-ux/SKILL.md`
- Modify: `skills/release/SKILL.md`

**Step 1: deepinit/SKILL.md 末尾追加**

```markdown
## 路由触发

层级化 AGENTS.md 文档生成完成后调用 `next-step-router`：
- current_skill: "deepinit"
- stage: "agents_md_generated"
- output_summary: 生成的 AGENTS.md 文件数、覆盖的目录层级数
```

**Step 2: sciomc/SKILL.md 末尾追加**

```markdown
## 路由触发

并行 scientist 分析完成、综合报告生成后调用 `next-step-router`：
- current_skill: "sciomc"
- stage: "analysis_report_complete"
- output_summary: 参与的 scientist agent 数、分析维度数、关键发现摘要
```

**Step 3: external-context/SKILL.md 末尾追加**

```markdown
## 路由触发

并行外部搜索完成、资料汇总后调用 `next-step-router`：
- current_skill: "external-context"
- stage: "external_context_gathered"
- output_summary: 搜索切面数、收集的文档数、关键参考资料摘要
```

**Step 4: frontend-ui-ux/SKILL.md 末尾追加**

```markdown
## 路由触发

UI/UX 设计方案经用户确认后调用 `next-step-router`：
- current_skill: "frontend-ui-ux"
- stage: "ui_design_approved"
- output_summary: 设计的组件数、是否有设计系统变更、是否有无障碍要求
```

**Step 5: release/SKILL.md 末尾追加**

```markdown
## 路由触发

发布流程完成后调用 `next-step-router`：
- current_skill: "release"
- stage: "release_complete"
- output_summary: 发布版本号、发布渠道、是否有回滚计划
```

**Step 6: Commit**

```bash
git add skills/deepinit/SKILL.md skills/sciomc/SKILL.md skills/external-context/SKILL.md skills/frontend-ui-ux/SKILL.md skills/release/SKILL.md
git commit -m "feat: add next-step-router triggers to deepinit, sciomc, external-context, frontend-ui-ux, release"
```

---

### Task 10: 验证所有修改

**Step 1: 检查所有 skill 文件都有路由触发**

```bash
for skill in brainstorming using-superpowers writing-plans using-git-worktrees \
  subagent-driven-development executing-plans dispatching-parallel-agents \
  systematic-debugging test-driven-development requesting-code-review \
  receiving-code-review verification-before-completion finishing-a-development-branch \
  writing-skills deepinit sciomc external-context frontend-ui-ux release; do
  if grep -q "路由触发\|next-step-router" skills/$skill/SKILL.md 2>/dev/null; then
    echo "$skill: OK"
  else
    echo "$skill: MISSING"
  fi
done
```

Expected: 所有18个 skill 都显示 OK

**Step 2: 检查 next-step-router skill 存在**

```bash
ls skills/next-step-router/SKILL.md && echo "next-step-router: OK"
```

**Step 3: 检查 git log**

```bash
git log --oneline -12
```

Expected: 显示 Task 1-9 的所有 commit

---

## 执行选项

计划已完成并保存到 `docs/plans/2026-02-24-superpowers-ultrapower-integration-plan.md`。两种执行选项：

**1. Subagent 驱动（本 session）** - 每个任务派发新 subagent，任务间审查，快速迭代

**2. 并行 Session（独立）** - 使用 executing-plans 打开新 session，带检查点的批量执行

选择哪种方式？
