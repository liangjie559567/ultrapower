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
选项4: 查看完整路由映射表（展示上方完整路由映射表）

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
