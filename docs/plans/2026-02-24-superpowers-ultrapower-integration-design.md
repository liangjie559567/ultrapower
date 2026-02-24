# superpowers × ultrapower 深度集成设计

**日期：** 2026-02-24
**状态：** 草稿（待批准）
**作者：** brainstorming session

---

## 背景

ultrapower v5.0.0 集成了 superpowers skill 体系，但两者目前是独立运行的——superpowers skills 完成后不会自动引导用户进入 ultrapower 的 agent 编排系统。本设计旨在通过新增 `next-step-router` skill，在关键节点用 AskUserQuestion 向用户推荐最优的下一步 ultrapower agent/skill，并完整传递上下文。

---

## 核心组件：`next-step-router` Skill

**文件路径：** `skills/next-step-router/SKILL.md`

### 工作原理

1. Claude 在每个 skill 的关键节点完成后，**主动检查路由映射表**（不依赖程序化调用）
2. 综合分析产出内容（复杂度、文件数、是否有安全/架构变更）
3. 结合上下文（用户在 brainstorming 中选择的方向、任务类型）
4. 用 AskUserQuestion 呈现带置信度的推荐（主选+备选+原因）
5. 用户确认后，将完整上下文传递给选定 agent/skill

### 上下文持久化机制

`full_context` 对象通过 **notepad** 持久化，存储于 `{worktree}/.omc/notepad.md`：

```
持久化时机：每次 skill 关键节点完成后，调用 notepad_write_working 写入：
  - current_skill + stage（当前位置）
  - output_summary（本阶段产出摘要）
  - doc_paths（相关文档路径）
  - key_decisions（用户已确认的关键决策）
  - user_direction（用户选择的方向）
  - codebase_summary（explore agent 的代码库理解摘要）

读取时机：next-step-router 触发时，调用 notepad_read 获取完整上下文
```

### 强制前置规则

```
brainstorming 触发时的强制流程：
  1. 触发 explore agent（model: haiku）→ 扫描代码库结构、关键文件、近期提交
  2. explore agent 完成 → 输出代码库理解摘要
  3. 将摘要写入 notepad（codebase_summary）
  4. 才进入设计对话

⚠️ 不允许跳过 explore 直接进入 brainstorming
⚠️ 判断"首次初始化"：检查 {worktree}/AGENTS.md 是否存在，不存在则触发 deepinit
```

### 智能推荐逻辑

```
分析产出内容:
  - 涉及文件数 > 10 → 推荐 deep-executor 而非 executor
  - 有安全相关变更 → 触发安全审查分支
  - 有架构变更 → 推荐 architect 而非 planner
  - 有性能敏感路径 → 触发性能验证分支

结合上下文:
  - 用户选择的方向（前端/后端/架构/调试）
  - 当前所处阶段（设计/实现/审查/验证）

输出带置信度的推荐:
  例："基于你的设计涉及3个模块且有API变更，
       推荐使用 architect（置信度85%）而非 planner"
```

---

## 完整端到端推荐流程

### 阶段总览

```
阶段0: 探索（强制前置）
  explore agent → [代码库理解完成]
  ├─ 首次初始化（AGENTS.md不存在）: explore → deepinit → [AGENTS.md生成]
  ├─ 需要深度研究: explore → sciomc → [并行scientist分析]
  ├─ 需要外部参考: explore → external-context → [外部文档收集]
  └─ 常规: explore → [直接进入brainstorming]
  ⚠️ 强制规则：brainstorming 触发后，必须先完成 explore agent 代码库理解，再进入设计阶段
  ⚠️ using-superpowers 和 brainstorming 共享同一次 explore，不重复调用

阶段1: 探索与设计
  [explore完成] → brainstorming → [architect review]
  ↕ UI/UX分支: brainstorming → frontend-ui-ux skill → [UI设计确认] → writing-plans
  ↕ 外部参考辅助: brainstorming ↔ external-context（设计过程中随时可调用）
  ↕ 复杂架构: brainstorming → ralplan（planner+architect+critic迭代）→ writing-plans

阶段2: 规划与隔离
  writing-plans → using-git-worktrees

阶段3: 实现（选择执行模式）
  ┌─ autopilot  → 全自主端到端执行
  ├─ team       → 分阶段pipeline（plan→prd→exec→verify→fix）[默认]
  ├─ ralph      → 持久循环直到验证完成
  └─ ultrawork  → 最大并行度，手动监督
  ↕ 子skill: subagent-driven-development / executing-plans
  ↕ 调试支路: systematic-debugging → test-driven-development

阶段4: 审查（多分支并行）
  requesting-code-review → receiving-code-review
  ↕ 安全分支: security-reviewer
  ↕ 性能分支: performance-reviewer

阶段5: 验证
  verification-before-completion → [验证通过]

阶段5b: 构建验证（新增）
  build-fixer → lsp_diagnostics_directory → [零错误]

阶段6: 部署测试
  qa-tester → ultraqa循环 → [全部通过]

阶段6b: 回归测试（新增）
  test-engineer → [所有测试通过] → [无回归]

阶段7: 产品验收
  product-manager → ux-researcher → [验收通过]

阶段8: 收尾与发布（新增发布节点）
  finishing-a-development-branch → git-master → release skill
```

### 执行模式选择逻辑

`next-step-router` 在阶段2→3的关键节点，根据任务特征智能推荐执行模式：

| 任务特征 | 推荐模式 | 原因 |
|---|---|---|
| 单一连贯交付物 | `autopilot` | 全自主端到端，无需干预 |
| 多组件系统（前端+后端+DB） | `team` | 分阶段pipeline（plan→prd→exec→verify→fix），默认编排器 |
| "不要停直到完成" | `ralph` | 持久循环+强制验证，包含ultrawork并行能力 |
| 许多独立子任务（>5个） | `ultrawork` | 最大并行度，手动监督 |
| 需要修复大量类似问题 | `swarm` | N个agent从共享任务池认领，适合批量修复 |
| 顺序依赖的多阶段任务 | `pipeline` | 顺序agent链，前一阶段输出作为下一阶段输入 |
| 需要迭代规划+共识 | `ralplan` | Planner+Architect+Critic三方迭代直到共识 |

### 执行模式详细说明

**swarm 模式路由：**
```
触发条件：任务数 > 10 且任务间相互独立（如"修复所有TypeScript错误"）
流程：writing-plans → swarm（N个agent认领任务池）→ verification-before-completion
退出条件：任务池清空 + 所有agent完成
```

**pipeline 模式路由：**
```
触发条件：任务有明确的顺序依赖（A完成才能开始B）
流程：writing-plans → pipeline（agent1输出→agent2输入→...）→ verifier
适用场景：数据处理流水线、多阶段转换任务
```

**ralplan 模式路由：**
```
触发条件：用户说"ralplan"或"需要共识规划"或"迭代规划"
流程：brainstorming → ralplan（planner+architect+critic迭代）→ writing-plans → 执行模式选择
退出条件：三方达成共识（无重大分歧）
```

**ultraqa 循环详细流程：**
```
触发条件：qa-tester 发现测试失败
循环流程：
  1. qa-tester 执行测试 → 收集失败用例
  2. executor/build-fixer 修复失败用例
  3. verifier 验证修复
  4. 回到步骤1，直到所有测试通过
退出条件：所有测试通过 + 零回归
最大循环次数：5次（超出则上报给用户）
```

---

## 完整路由映射表

### 阶段0：探索（强制前置）

⚠️ **强制规则**：`brainstorming` 触发后，必须先完成 `explore` agent 代码库理解，再进入设计阶段。
⚠️ **防重复规则**：`using-superpowers` 触发 explore 后，`brainstorming` 不再重复调用 explore，直接使用已有的 `codebase_summary`。

| Agent/Skill | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `explore` agent | 代码库理解完成后（AGENTS.md 已存在） | `brainstorming` | `systematic-debugging` | 探索后进入设计或调试 |
| `explore` agent | 代码库理解完成后（AGENTS.md 不存在） | `deepinit` skill | `brainstorming` | 首次初始化，先生成层级化 AGENTS.md |
| `deepinit` skill | AGENTS.md 生成完成后 | `brainstorming` | `sciomc` skill | 代码库初始化完成，进入设计阶段 |
| `explore` agent | 代码库理解完成后（任务需深度研究） | `sciomc` skill | `brainstorming` | explore 完成后判断是否需要并行 scientist 深度分析 |
| `sciomc` skill | 综合分析报告完成后 | `brainstorming` | `external-context` skill | 深度研究完成后进入设计 |
| `external-context` skill | 外部资料收集完成后 | `brainstorming` | `sciomc` skill | 外部参考资料就绪，进入设计阶段 |

### 阶段1：探索与设计

| Skill | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `using-superpowers` | 新功能请求到达 | `explore` agent（强制，model: haiku） | `systematic-debugging` | 新功能必须先探索代码库再设计 |
| `using-superpowers` | explore 完成后 | `brainstorming` | `systematic-debugging` | 代码库已理解，进入设计对话 |
| `brainstorming` | **触发时**（codebase_summary 已存在） | 直接进入设计对话 | — | explore 已完成，不重复调用 |
| `brainstorming` | **触发时**（codebase_summary 不存在） | `explore` agent（强制前置） | — | 缺少代码库理解，必须先 explore |
| `brainstorming` | 设计过程中需要外部参考时 | `external-context` skill（辅助） | — | 并行获取外部文档/最佳实践，不阻塞设计流程 |
| `brainstorming` | 设计文档批准后 | `writing-plans` skill | `architect` agent | 设计完成自然进入计划阶段 |
| `ralplan` | 触发时（需要迭代规划） | `planner`+`architect`+`critic` 三方迭代 | `brainstorming` | 复杂架构决策需要多方共识 |
| `ralplan` | 共识达成后 | `writing-plans` skill | `architect` agent | 共识规划完成进入计划阶段 |

**UX/UI 设计分支**（涉及前端/界面变更时触发）：

| Skill | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `brainstorming` | 设计含 UI/UX 组件时 | `frontend-ui-ux` skill | `designer` agent | 前端工作路由到专用 UI/UX skill |
| `frontend-ui-ux` skill | UI 设计方案确认后 | `writing-plans` skill | `brainstorming` | UI 设计完成进入实现计划 |

### 阶段2：规划与隔离

| Skill | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `writing-plans` | 计划文档提交后 | `using-git-worktrees` | `subagent-driven-development` | 先建隔离环境再执行 |
| `using-git-worktrees` | worktree创建验证后 | `subagent-driven-development` | `executing-plans` | 环境就绪，开始并行实现 |

### 阶段3：实现（执行模式选择）

**执行模式路由（writing-plans 完成后触发）：**

| Skill | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `writing-plans` 完成后 | 计划文档提交后 | `team` skill | `ralph` skill | team 是默认多agent编排器 |

**执行模式内部路由：**

| 执行模式 | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `autopilot` | 全自主完成后 | `verification-before-completion` | `requesting-code-review` | 自主执行后需验证 |
| `team` | team-verify 阶段通过后 | `qa-tester` agent | `verification-before-completion` | team 内置验证，通过后进部署测试 |
| `ralph` | 验证循环完成后 | `qa-tester` agent | `finishing-a-development-branch` | ralph 强制验证，通过后进部署 |
| `ultrawork` | 所有并行任务完成后 | `verification-before-completion` | `requesting-code-review` | 并行完成需统一验证 |
| `swarm` | 任务池清空后 | `verification-before-completion` | `requesting-code-review` | 批量修复完成需统一验证 |
| `pipeline` | 最后一个agent完成后 | `verifier` agent | `requesting-code-review` | 流水线末端需验证输出 |

**子 Skill 路由：**

| Skill | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `subagent-driven-development` | 每个subagent完成后 | `requesting-code-review` | `quality-reviewer` | 每个任务完成即触发审查 |
| `executing-plans` | 每批次执行完毕后 | `requesting-code-review` | `verification-before-completion` | 批次完成需要审查确认 |
| `dispatching-parallel-agents` | 所有并行结果返回后 | `verifier` agent | `quality-reviewer` agent | 并行结果汇聚需统一验证（属于阶段3执行层，非阶段5） |
| `frontend-ui-ux` skill | 实现阶段（组件开发时） | `designer` agent 或 Gemini MCP | `executor` agent | 前端实现优先使用 designer/Gemini（1M上下文） |

### 阶段3b：调试支路

| Skill | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `systematic-debugging` | 根因确认后 | `test-driven-development` | `executor` agent | 先写失败测试再修复 |
| `test-driven-development` | GREEN+重构完成后 | `requesting-code-review` | `verification-before-completion` | TDD完成需代码审查 |

### 阶段4：审查（多分支）

| Skill | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `requesting-code-review` | 审查报告返回后 | `receiving-code-review` | `executor` agent | 请求与接收是配对skill |
| `receiving-code-review` | 所有意见处理完后 | `verification-before-completion` | `finishing-a-development-branch` | 处理完审查需重新验证 |

**安全审查分支**（有安全相关变更时触发）：
- `requesting-code-review` → `security-reviewer` agent → `receiving-code-review`

**性能验证分支**（有性能敏感路径时触发）：
- `verification-before-completion` → `performance-reviewer` agent → `finishing-a-development-branch`

### 阶段5：验证

| Skill | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `verification-before-completion` | 验证通过后 | `build-fixer` agent | `finishing-a-development-branch` | 验证通过先做构建验证 |

### 阶段5b：构建验证（新增）

| Agent | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `build-fixer` agent | lsp_diagnostics 零错误后 | `qa-tester` agent | `requesting-code-review` | 构建通过进入部署测试 |

### 阶段6：部署测试

| Agent/Skill | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `qa-tester` agent | 测试用例执行后（有失败） | `ultraqa` skill循环 | `executor` agent | 发现问题进入ultraqa修复循环 |
| `qa-tester` agent | 测试用例执行后（全通过） | `test-engineer` agent | `product-manager` agent | 直接进入回归测试 |
| `ultraqa` skill | 循环中（修复后重测） | `qa-tester` agent → `executor/build-fixer` → `verifier` | — | 循环：测试→修复→验证→重测 |
| `ultraqa` skill | 所有测试通过（退出循环） | `test-engineer` agent | `product-manager` agent | 部署测试通过后做回归测试 |
| `ultraqa` skill | 超过5次循环未通过 | 上报用户 | — | 超出最大循环次数，需人工介入 |

### 阶段6b：回归测试（新增）

| Agent | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `test-engineer` agent | 所有回归测试通过后 | `product-manager` agent | `finishing-a-development-branch` | 无回归后进入产品验收 |

### 阶段7：产品验收

| Agent | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `product-manager` agent | PRD验收完成后 | `ux-researcher` agent | `finishing-a-development-branch` | 功能验收后做UX审计 |
| `ux-researcher` agent | UX审计完成后 | `finishing-a-development-branch` | `executor` agent | 验收通过进入收尾 |

### 阶段8：收尾与发布（新增发布节点）

| Skill/Agent | 关键节点 | 主推 | 备选 | 推荐理由 |
|---|---|---|---|---|
| `finishing-a-development-branch` | 用户选择整合方式后 | `git-master` agent | `verifier` agent | 分支整合需git专家 |
| `git-master` agent | PR合并后 | `release` skill | — | 合并后触发发布流程 |

### 工具类（随时可用）

| Skill | 关键节点 | 主推 | 备选 |
|---|---|---|---|
| `writing-skills` | skill压力测试通过后 | `verifier` agent | `quality-reviewer` agent |

---

## 实现方案

### 新增文件

**`skills/next-step-router/SKILL.md`** — 路由逻辑主体（完整内容）

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

```
分析 output_summary：
  文件数 > 10          → 推荐 deep-executor 而非 executor
  含 "security"/"auth" → 触发 security-reviewer 分支
  含 "architecture"    → 推荐 architect 而非 planner
  含 "performance"     → 触发 performance-reviewer 分支
  含 "API change"      → 推荐 api-reviewer
  文件数 1-3           → 推荐 executor（轻量）
  含 "UI"/"component"/"frontend" → 推荐 frontend-ui-ux skill
  含 "research"/"analysis"       → 推荐 sciomc skill
  含 "external"/"reference"      → 推荐 external-context skill
  首次初始化代码库                → 推荐 deepinit skill
```

### 第二步：结合用户上下文

```
full_context.user_direction:
  "frontend"  → 优先 frontend-ui-ux skill → designer agent
  "backend"   → 优先 executor agent
  "debug"     → 优先 debugger agent
  "architect" → 优先 architect agent
  "research"  → 优先 sciomc skill → external-context skill
```

### 第三步：查路由映射表

根据 `current_skill` + `stage` 组合查完整路由映射表，得到：
- 主推 agent/skill（置信度 60-95%）
- 备选 agent/skill（置信度 30-60%）
- 推荐理由

## 输出格式

用 AskUserQuestion 呈现（最多4个选项）：

```
选项1: [主推] agent/skill 名称
  理由: 基于[信号]，置信度[X]%
选项2: [备选] agent/skill 名称
  理由: [简短说明]
选项3: 跳过，我自己决定
选项4: 查看完整路由映射表
```

用户确认后：
1. 调用 `notepad_write_working` 记录本次路由决策（current_skill、stage、选定目标、置信度）
2. 调用 `notepad_read` 获取完整 `full_context`，传递给选定 agent/skill
3. 在传递时附加本次路由决策记录（用于后续追溯）

用户选择"跳过，我自己决定"时：
1. 调用 `notepad_write_working` 保留当前 `full_context`（不丢失上下文）
2. 不触发任何 agent/skill，等待用户下一条消息
```

### 修改现有 Skill（具体修改指令）

#### 1. `skills/brainstorming/SKILL.md`

**修改位置：** 检查清单第1项之前，添加强制前置步骤

**新增内容（插入到"## 检查清单"之前）：**

```markdown
## 强制前置：代码库探索

<HARD-GATE>
在开始任何设计对话之前，必须先完成代码库探索。不允许跳过此步骤。
</HARD-GATE>

### 触发时立即执行

1. 调用 `explore` agent（model: haiku）扫描代码库：
   - 项目结构（目录树、主要模块）
   - 相关文件（与本次任务相关的文件）
   - 近期提交（最近5个 commit 的变更摘要）
   - 现有约定（命名规范、架构模式）

2. 将探索结果作为 `codebase_summary` 存入上下文

3. 探索完成后，才进入"理解想法"阶段

### 探索完成标准
- [ ] 已识别与任务相关的主要文件（≥3个）
- [ ] 已了解现有架构模式
- [ ] 已检查近期相关提交
```

**修改位置：** "## 设计完成后" → "**实现：**" 部分末尾，添加路由触发

**新增内容（追加到 skill 末尾）：**

```markdown
## 路由触发（设计批准后）

设计文档提交到 git 后，调用 `next-step-router`：
- current_skill: "brainstorming"
- stage: "design_approved"
- output_summary: 设计涉及的文件数、模块数、是否有架构/安全/性能变更
- full_context: { doc_paths: [设计文档路径], key_decisions: [...], codebase_summary: [...] }
```

---

#### 2. `skills/using-superpowers/SKILL.md`

**修改位置：** "## 规则" 部分，在流程图之后添加新功能路由规则

**新增内容（插入到"## 红旗"之前）：**

```markdown
## 新功能路由规则

当用户请求涉及**新功能开发**时（非 bug 修复），强制执行以下流程：

```
用户请求新功能
  ↓
1. 调用 explore agent（haiku）→ 理解代码库
  ↓
2. 调用 brainstorming skill → 设计对话
  ↓
3. 设计批准后 → next-step-router 推荐下一步
```

**判断是否为新功能：**
- 包含"添加"、"新增"、"实现"、"构建"、"创建" → 新功能流程
- 包含"修复"、"bug"、"错误"、"不工作" → 调试流程（systematic-debugging）
- 包含"重构"、"优化"、"改进" → 先 explore，再判断

**路由触发（每次消息到达后）：**
- 新功能 → explore agent → brainstorming
- 已知 bug → systematic-debugging
- 不确定 → AskUserQuestion 询问用户意图
```

---

#### 3-18. 其余16个 Skill 的路由触发追加

在每个 skill 的末尾追加以下路由触发块（根据 skill 名称替换参数）：

**`writing-plans`（计划提交后）：**
```markdown
## 路由触发
计划文档提交后调用 next-step-router：
- current_skill: "writing-plans"
- stage: "plan_committed"
- output_summary: 计划中的任务数、涉及文件数、是否有架构变更
```

**`using-git-worktrees`（worktree创建验证后）：**
```markdown
## 路由触发
worktree 创建并验证后调用 next-step-router：
- current_skill: "using-git-worktrees"
- stage: "worktree_ready"
- output_summary: worktree 路径、基于哪个分支
```

**`subagent-driven-development`（每个subagent完成后）：**
```markdown
## 路由触发
每个 subagent 任务完成后调用 next-step-router：
- current_skill: "subagent-driven-development"
- stage: "subagent_task_complete"
- output_summary: 完成的任务描述、修改的文件列表
```

**`executing-plans`（每批次完成后）：**
```markdown
## 路由触发
每批次执行完毕后调用 next-step-router：
- current_skill: "executing-plans"
- stage: "batch_complete"
- output_summary: 本批次完成的任务数、剩余任务数
```

**`dispatching-parallel-agents`（所有结果返回后）：**
```markdown
## 路由触发
所有并行 agent 结果汇聚后调用 next-step-router：
- current_skill: "dispatching-parallel-agents"
- stage: "all_results_returned"
- output_summary: agent 数量、成功/失败数、汇总结果
```

**`systematic-debugging`（根因确认后）：**
```markdown
## 路由触发
根因确认后调用 next-step-router：
- current_skill: "systematic-debugging"
- stage: "root_cause_confirmed"
- output_summary: 根因描述、涉及文件、是否需要测试先行
```

**`test-driven-development`（GREEN+重构完成后）：**
```markdown
## 路由触发
GREEN 阶段完成后调用 next-step-router：
- current_skill: "test-driven-development"
- stage: "green_complete"
- output_summary: 通过的测试数、修改的文件列表
```

**`requesting-code-review`（审查报告返回后）：**
```markdown
## 路由触发
审查报告返回后调用 next-step-router：
- current_skill: "requesting-code-review"
- stage: "review_returned"
- output_summary: 审查意见数量、严重程度分布
```

**`receiving-code-review`（所有意见处理完后）：**
```markdown
## 路由触发
所有审查意见处理完毕后调用 next-step-router：
- current_skill: "receiving-code-review"
- stage: "review_addressed"
- output_summary: 处理的意见数、修改的文件列表
```

**`verification-before-completion`（验证通过后）：**
```markdown
## 路由触发
验证通过后调用 next-step-router：
- current_skill: "verification-before-completion"
- stage: "verification_passed"
- output_summary: 验证项目数、通过率、是否有构建错误
```

**`finishing-a-development-branch`（整合方式确认后）：**
```markdown
## 路由触发
用户选择整合方式后调用 next-step-router：
- current_skill: "finishing-a-development-branch"
- stage: "merge_strategy_confirmed"
- output_summary: 选择的整合方式（merge/squash/rebase）
```

**`writing-skills`（压力测试通过后）：**
```markdown
## 路由触发
skill 压力测试通过后调用 next-step-router：
- current_skill: "writing-skills"
- stage: "stress_test_passed"
- output_summary: 测试的 skill 名称、通过的测试场景数
```

**`deepinit`（AGENTS.md 生成完成后）：**
```markdown
## 路由触发
层级化 AGENTS.md 文档生成完成后调用 next-step-router：
- current_skill: "deepinit"
- stage: "agents_md_generated"
- output_summary: 生成的 AGENTS.md 文件数、覆盖的目录层级数
```

**`sciomc`（综合分析报告完成后）：**
```markdown
## 路由触发
并行 scientist 分析完成、综合报告生成后调用 next-step-router：
- current_skill: "sciomc"
- stage: "analysis_report_complete"
- output_summary: 参与的 scientist agent 数、分析维度数、关键发现摘要
```

**`external-context`（外部资料收集完成后）：**
```markdown
## 路由触发
并行外部搜索完成、资料汇总后调用 next-step-router：
- current_skill: "external-context"
- stage: "external_context_gathered"
- output_summary: 搜索切面数、收集的文档数、关键参考资料摘要
```

**`frontend-ui-ux`（UI 设计方案确认后）：**
```markdown
## 路由触发
UI/UX 设计方案经用户确认后调用 next-step-router：
- current_skill: "frontend-ui-ux"
- stage: "ui_design_approved"
- output_summary: 设计的组件数、是否有设计系统变更、是否有无障碍要求
```

**`release`（发布流程完成后）：**
```markdown
## 路由触发
发布流程完成后调用 next-step-router：
- current_skill: "release"
- stage: "release_complete"
- output_summary: 发布版本号、发布渠道、是否有回滚计划
```

---

## 补充说明

### 用户选择"跳过路由"后的处理

当用户在 AskUserQuestion 中选择"跳过，我自己决定"时：
1. 将当前 `full_context` 写入 notepad（保留上下文）
2. 不触发任何 agent/skill
3. 等待用户下一条消息，按正常流程处理
4. 用户的下一条消息仍会触发 `using-superpowers` 的路由判断

### 错误处理路由

当某个 agent 执行失败（非测试失败，而是超时/崩溃）时：

| 失败类型 | 路由到 | 说明 |
|---|---|---|
| executor 超时/崩溃 | `debugger` agent | 分析失败原因，再决定是否重试 |
| build-fixer 无法修复 | 上报用户 + notepad 记录 | 超出自动修复能力，需人工介入 |
| verifier 无法验证 | `quality-reviewer` agent | 换角度验证 |
| 任意 agent 连续失败2次 | 上报用户 | 避免无限循环，保留上下文供用户决策 |

## 影响范围

- **新增文件：** 1个（`skills/next-step-router/SKILL.md`）
- **修改文件：** 18个（各 skill 末尾添加触发点）
  - 原有14个 skill：brainstorming、using-superpowers、writing-plans、using-git-worktrees、subagent-driven-development、executing-plans、dispatching-parallel-agents、systematic-debugging、test-driven-development、requesting-code-review、receiving-code-review、verification-before-completion、finishing-a-development-branch、writing-skills
  - 新增4个 skill：deepinit、sciomc、external-context、frontend-ui-ux
- **不修改：** agents/、src/、bridge/ 等核心代码

---

## 下一步

调用 `writing-plans` skill 创建详细实现计划。
