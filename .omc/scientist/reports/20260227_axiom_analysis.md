# Axiom 系统深度分析报告

**生成时间**: 2026-02-27
**分析阶段**: RESEARCH_STAGE:7
**工作目录**: C:\Users\ljyih\Desktop\ultrapower

---

## [OBJECTIVE]

对 ultrapower v5.2.3 的 Axiom 工作流系统进行深度分析，评估其架构完整性、工作流设计、进化引擎机制、门禁规则实现及模板设计。

---

## [DATA]

| 数据源 | 规模 |
| -------- | ------ |
| ax-* skills | 14 个 SKILL.md 文件 |
| .omc/axiom/ 状态文件 | 9 个核心文件 |
| evolution/ 子目录 | 5 个文件 |
| templates/axiom/ | 2 个模板 + scripts/ |
| 知识库条目 | 55 条 (k-001~k-055) |
| 学习队列条目 | 23 条 (LQ-001~LQ-023) |
| 模式库条目 | 9 个 (P-001~P-009) |
| 工作流执行记录 | 7 个工作流，19 次执行 |

---

## [FINDING:AXIOM-1] Axiom 系统架构

Axiom 是一个嵌入在 ultrapower OMC 框架内的**结构化需求到交付全链路工作流系统**，采用四阶段流水线设计，具备自进化能力。

### 架构层次

```
Layer 0: 状态机 (state_machine.md)
  ↓ 驱动
Layer 1: 工作流 Skills (ax-draft → ax-review → ax-decompose → ax-implement)
  ↓ 产出
Layer 2: 进化引擎 (ax-reflect → ax-evolve)
  ↓ 约束
Layer 3: 宪法边界 (constitution.md)
```

### 四阶段流水线

| 阶段 | Skill | 输入 | 输出 | 门禁 |
| ------ | ------- | ------ | ------ | ------ |
| Phase 1 | ax-draft | 用户需求 | docs/prd/[name]-draft.md | User Gate |
| Phase 1.5 | ax-review | draft.md | docs/prd/[name]-rough.md | User Gate |
| Phase 2 | ax-decompose | rough.md | docs/tasks/[id]/manifest.md | User Gate |
| Phase 3 | ax-implement | manifest.md | 代码 + CI 通过 | CI Gate |

[STAT:n] 14 个 ax-* skills 覆盖完整生命周期
[STAT:n] 7 个核心状态：IDLE/DRAFTING/REVIEWING/CONFIRMING/DECOMPOSING/IMPLEMENTING/BLOCKED
[STAT:n] 4 类门禁：Expert Gate / User Gate / CI Gate / Scope Gate

[CONFIDENCE:HIGH]

---

## [FINDING:AXIOM-2] 工作流完整性评估

### 执行指标（来自 workflow_metrics.md）

| 工作流 | 执行次数 | 成功次数 | 成功率 |
| -------- | --------- | --------- | -------- |
| ax-draft | 1 | 1 | 100% |
| ax-review | 1 | 1 | 100% |
| ax-decompose | 1 | 1 | 100% |
| ax-implement | 3 | 3 | 100% |
| autopilot | 2 | 2 | 100% |
| release | 3 | 3 | 100% |
| ax-evolve | 8 | 8 | 100% |
| **合计** | **19** | **19** | **100%** |

[STAT:n] n=19 次工作流执行
[STAT:effect_size] 整体成功率 = 100%（19/19）
[STAT:ci] 注意：样本量小（n=19），置信区间宽，不具备统计显著性

### 知识积累指标

| 类别 | 条目数 | 占比 |
| ------ | -------- | ------ |
| architecture | 19 | 34.5% |
| workflow | 14 | 25.5% |
| pattern | 6 | 10.9% |
| debugging | 5 | 9.1% |
| tooling | 5 | 9.1% |
| security | 4 | 7.3% |
| **合计** | **53** | 100% |

[STAT:n] 知识库 53 条活跃条目（k-001~k-055，含 2 条已删除）
[STAT:n] 学习队列 23 条全部处理完成（100% 清空率）
[STAT:n] 模式库 9 个模式，2 个 active（22.2%），7 个 pending（77.8%）

[CONFIDENCE:HIGH]

---

## [FINDING:AXIOM-3] 门禁规则实现分析

### 四类门禁的实现状态

**Expert Gate（专家评审门禁）**

* 实现位置：ax-review/SKILL.md Step 1

* 机制：5 个专家角色并行 Task（ux-director / product-director / domain-expert / tech-lead / critic）

* 仲裁优先级：安全 > 技术 > 战略 > 逻辑 > 体验

* 状态：已实现，有明确的冲突仲裁规则

**User Gate（PRD 确认门禁）**

* 实现位置：ax-draft Step 3 / ax-review Step 3 / ax-decompose Step 3

* 机制：每个阶段结束后显式询问用户 Yes/No/修改

* 状态：已实现，三个阶段均有独立确认点

**CI Gate（编译提交门禁）**

* 实现位置：ax-implement Step 3 / ax-analyze-error Step 2 / ax-rollback Step 4

* 命令：`tsc --noEmit && npm run build && npm test`

* 自动修复：前 2 次调用 build-fixer，第 3 次输出 [BLOCKED]

* 状态：已实现，有重试上限和降级策略

**Scope Gate（范围门禁）**

* 实现位置：task-execution.md 模板 Constraints 第 1 条

* 机制：executor 被约束"仅修改 Sub-PRD 要求的代码"

* 状态：**部分实现** — 依赖 executor 自律，无自动文件变更检测

[STAT:n] 4 类门禁中 3 类有明确代码/流程实现，1 类（Scope Gate）依赖提示词约束
[STAT:effect_size] 门禁覆盖率 = 75%（3/4 有自动化执行路径）

[CONFIDENCE:HIGH]

---

## [FINDING:AXIOM-4] 进化引擎机制分析

### 进化引擎数据流

```
会话事件
  ↓ session-end hook
learning_queue.md (LQ-xxx)
  ↓ ax-evolve 处理
knowledge_base.md (k-xxx) + pattern_library.md (P-xxx)
  ↓ confidence >= 0.8
project_memory.json (持久化指令)
  ↓ constitution.md 约束
Layer 1 修改（需用户确认）
```

### 宪法安全边界（constitution.md）

| 层级 | 路径 | 修改方式 |
| ------ | ------ | --------- |
| Layer 2（自由） | .omc/axiom/evolution/* | 自动，无需确认 |
| Layer 2（自由） | .omc/project-memory.json | 自动，无需确认 |
| Layer 1（受审） | agents/*.md | 需用户确认 + multi-model review |
| Layer 1（受审） | skills/*/SKILL.md | 需用户确认 + multi-model review |
| 不可修改 | constitution.md 等 7 个文件 | 禁止自动修改 |

### 频率限制

* 每个 agent 提示词：最多每 7 天优化 1 次

* 每次会话：最多触发 1 次自动优化建议

* 每日全局上限：最多 3 个文件被自动修改

* 冷启动保护：至少 10 个会话后才启用自动优化建议

[STAT:n] 当前处于 Phase 1（被动学习），无自动修改已发生
[STAT:n] 进化引擎执行 8 次，成功率 100%，学习队列清空率 100%

[CONFIDENCE:HIGH]

---

## [FINDING:AXIOM-5] 模板设计分析

### templates/axiom/ 结构

| 模板 | 用途 | 完整性 |
| ------ | ------ | -------- |
| dag-analysis.md | DAG 任务依赖分析，输出 ready_tasks JSON | 完整 |
| task-execution.md | 原子任务执行框架，三态输出协议 | 完整 |
| scripts/ | 初始化脚本模板 | 待验证 |

### 模板设计亮点

1. **三态输出协议**（task-execution.md）：QUESTION / BLOCKED / COMPLETE，强制 executor 明确表达状态
2. **DAG 并行约束**（dag-analysis.md）：文件冲突检测防止并行任务互相覆盖，max_parallel=3 限制
3. **模板变量化**：`{{manifest_file}}`、`{{task_id}}` 等占位符支持动态注入

[STAT:n] 2 个核心模板，覆盖 Phase 2（DAG 分析）和 Phase 3（任务执行）
[STAT:n] 模板来源注释保留了原始路径（C:\Users\ljyih\Desktop\Axiom\.agent\prompts\templates\）

[CONFIDENCE:HIGH]

---

## [FINDING:AXIOM-6] 一致性问题识别

### 路径不一致（ax-knowledge）

ax-knowledge/SKILL.md 中引用路径为 `.omc/knowledge/`，但实际知识库位于 `.omc/axiom/evolution/`。

```
SKILL.md 引用:  .omc/knowledge/knowledge_base.md
实际路径:       .omc/axiom/evolution/knowledge_base.md
```

[STAT:effect_size] 影响范围：ax-knowledge skill 的 Step 2/3 路径全部错误

### 模式库 pending 比例过高

9 个模式中 7 个（77.8%）处于 pending 状态，未达到 occurrences >= 3 的提升阈值。

[STAT:n] P-002~P-008 均为 occurrences=1，需要 2 次以上重复才能激活

### ax-context / ax-evolution / ax-export 缺少 SKILL.md 内容

这 3 个 skill 目录存在但未在本次分析中读取到完整 SKILL.md，可能是空文件或占位符。

[CONFIDENCE:MEDIUM] — 基于目录列表推断，未直接验证文件内容

---

## [FINDING:AXIOM-7] 改进建议

### 高优先级

1. **修复 ax-knowledge 路径引用**
   - 将 `.omc/knowledge/` 替换为 `.omc/axiom/evolution/`
   - 影响文件：`skills/ax-knowledge/SKILL.md`

1. **Scope Gate 自动化**
   - 当前依赖 executor 提示词约束，建议在 ax-implement 中增加文件变更范围检查
   - 可在 CI Gate 前增加：`git diff --name-only` 与 manifest Impact Scope 对比

1. **补全 ax-context / ax-evolution / ax-export SKILL.md**
   - 这 3 个 skill 在 CLAUDE.md 路由表中有条目，但缺少完整实现文档

### 中优先级

1. **模式库激活机制优化**
   - 当前 7/9 模式处于 pending，occurrences=1 的模式可考虑降低激活阈值至 2 次
   - 或增加"手动激活"路径，允许高置信度（>= 0.95）模式跳过次数限制

1. **ax-rollback 检查点依赖**
   - 当前依赖 `git tag -l "checkpoint-*"`，但 active_context.md 中无 checkpoint 标签记录
   - 建议在 ax-suspend 中强制创建 git tag

1. **工作流指标样本量**
   - 当前 n=19 次执行，100% 成功率缺乏统计显著性
   - 建议在 workflow_metrics.md 中增加置信区间字段

[CONFIDENCE:HIGH]

---

## [LIMITATION]

1. **样本量限制**：工作流执行记录 n=19，100% 成功率在统计上不具备显著性（Wilson 95% CI 约 [82%, 100%]），无法排除小样本偏差。

1. **被动学习阶段**：当前系统处于 Phase 1（被动学习），进化引擎尚未执行任何 Layer 1 自动修改，无法评估自动优化的实际效果。

1. **ax-context / ax-evolution / ax-export 未完整分析**：这 3 个 skill 的 SKILL.md 内容未读取，可能存在未识别的功能或问题。

1. **Scope Gate 无运行时数据**：Scope Gate 依赖提示词约束，无法从现有数据中验证其实际执行效果。

1. **跨项目隔离未验证**：constitution.md 声明了跨项目隔离规则，但本次分析仅覆盖单一项目，无法验证隔离机制的实际效果。

---

## 综合评估

| 维度 | 评分 | 说明 |
| ------ | ------ | ------ |
| 架构完整性 | 9/10 | 四阶段流水线清晰，状态机定义完整 |
| 门禁覆盖率 | 7.5/10 | 3/4 门禁有自动化路径，Scope Gate 依赖提示词 |
| 进化引擎安全性 | 9/10 | constitution.md 边界清晰，频率限制合理 |
| 知识积累质量 | 8/10 | 53 条知识，分类合理，但模式激活率低（22%） |
| 模板设计 | 8.5/10 | 三态协议和 DAG 约束设计优秀 |
| 一致性 | 7/10 | ax-knowledge 路径引用错误，3 个 skill 待完善 |
| **综合** | **8.2/10** | 系统设计成熟，有明确改进路径 |

---

报告保存到：`.omc/scientist/reports/20260227_axiom_analysis.md`
