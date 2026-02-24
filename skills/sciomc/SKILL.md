---
name: sciomc
description: 编排并行 scientist agent 进行综合分析，支持 AUTO 模式
argument-hint: <research goal>
---

# Research Skill

编排并行 scientist agent 进行综合研究工作流，支持可选的 AUTO 模式实现完全自主执行。

## 概述

Research 是一个多阶段工作流，将复杂研究目标分解为并行调查：

1. **分解** - 将研究目标拆分为独立阶段/假设
2. **执行** - 对每个阶段运行并行 scientist agent
3. **验证** - 交叉验证发现，检查一致性
4. **综合** - 将结果汇总为综合报告

## 用法示例

```
/ultrapower:sciomc <goal>                    # 带用户检查点的标准研究
/ultrapower:sciomc AUTO: <goal>              # 完全自主直到完成
/ultrapower:sciomc status                    # 检查当前研究 session 状态
/ultrapower:sciomc resume                    # 恢复中断的研究 session
/ultrapower:sciomc list                      # 列出所有研究 session
/ultrapower:sciomc report <session-id>       # 为 session 生成报告
```

### 快速示例

```
/ultrapower:sciomc What are the performance characteristics of different sorting algorithms?
/ultrapower:sciomc AUTO: Analyze authentication patterns in this codebase
/ultrapower:sciomc How does the error handling work across the API layer?
```

## 研究协议

### 阶段分解模式

给定研究目标时，分解为 3-7 个独立阶段：

```markdown
## Research Decomposition

**Goal:** <original research goal>

### Stage 1: <stage-name>
- **Focus:** What this stage investigates
- **Hypothesis:** Expected finding (if applicable)
- **Scope:** Files/areas to examine
- **Tier:** LOW | MEDIUM | HIGH

### Stage 2: <stage-name>
...
```

### 并行 Scientist 调用

通过 Task 工具并行触发独立阶段：

```
// Stage 1 - Simple data gathering
Task(subagent_type="ultrapower:scientist", model="haiku", prompt="[RESEARCH_STAGE:1] Investigate...")

// Stage 2 - Standard analysis
Task(subagent_type="ultrapower:scientist", model="sonnet", prompt="[RESEARCH_STAGE:2] Analyze...")

// Stage 3 - Complex reasoning
Task(subagent_type="ultrapower:scientist-high", model="opus", prompt="[RESEARCH_STAGE:3] Deep analysis of...")
```

### 智能模型路由

**关键：始终明确传递 `model` 参数！**

| 任务复杂度 | Agent | Model | 用途 |
|-----------------|-------|-------|---------|
| 数据收集 | `scientist`（model=haiku） | haiku | 文件枚举、模式计数、简单查找 |
| 标准分析 | `scientist` | sonnet | 代码分析、模式检测、文档审查 |
| 复杂推理 | `scientist-high` | opus | 架构分析、横切关注点、假设验证 |

### 路由决策指南

| 研究任务 | 层级 | 示例提示 |
|---------------|------|----------------|
| "统计 X 的出现次数" | LOW | "Count all usages of useState hook" |
| "查找所有匹配 Y 的文件" | LOW | "List all test files in the project" |
| "分析模式 Z" | MEDIUM | "Analyze error handling patterns in API routes" |
| "记录 W 的工作方式" | MEDIUM | "Document the authentication flow" |
| "解释为什么 X 发生" | HIGH | "Explain why race conditions occur in the cache layer" |
| "比较方法 A 与 B" | HIGH | "Compare Redux vs Context for state management here" |

### 验证循环

并行执行完成后，验证发现：

```
// Cross-validation stage
Task(subagent_type="ultrapower:scientist", model="sonnet", prompt="
[RESEARCH_VERIFICATION]
Cross-validate these findings for consistency:

Stage 1 findings: <summary>
Stage 2 findings: <summary>
Stage 3 findings: <summary>

Check for:
1. Contradictions between stages
2. Missing connections
3. Gaps in coverage
4. Evidence quality

Output: [VERIFIED] or [CONFLICTS:<list>]
")
```

## AUTO 模式

AUTO 模式通过循环控制自主运行完整研究工作流。

### 循环控制协议

```
[RESEARCH + AUTO - ITERATION {{ITERATION}}/{{MAX}}]

Your previous attempt did not output the completion promise. Continue working.

Current state: {{STATE}}
Completed stages: {{COMPLETED_STAGES}}
Pending stages: {{PENDING_STAGES}}
```

### Promise 标签

| 标签 | 含义 | 使用时机 |
|-----|---------|-------------|
| `[PROMISE:RESEARCH_COMPLETE]` | 研究成功完成 | 所有阶段完成、已验证、报告已生成 |
| `[PROMISE:RESEARCH_BLOCKED]` | 无法继续 | 数据缺失、访问问题、循环依赖 |

### AUTO 模式规则

1. **最大迭代次数：** 10（可配置）
2. **继续直到：** 发出 Promise 标签或达到最大迭代次数
3. **状态追踪：** 每个阶段完成后持久化
4. **取消：** `/ultrapower:cancel` 或"stop"、"cancel"

### AUTO 模式示例

```
/ultrapower:sciomc AUTO: Comprehensive security analysis of the authentication system

[Decomposition]
- Stage 1 (LOW): Enumerate auth-related files
- Stage 2 (MEDIUM): Analyze token handling
- Stage 3 (MEDIUM): Review session management
- Stage 4 (HIGH): Identify vulnerability patterns
- Stage 5 (MEDIUM): Document security controls

[Execution - Parallel]
Firing stages 1-3 in parallel...
Firing stages 4-5 after dependencies complete...

[Verification]
Cross-validating findings...

[Synthesis]
Generating report...

[PROMISE:RESEARCH_COMPLETE]
```

## 并行执行模式

### 独立数据集分析（并行）

当阶段分析不同数据源时：

```
// All fire simultaneously
Task(subagent_type="ultrapower:scientist", model="haiku", prompt="[STAGE:1] Analyze src/api/...")
Task(subagent_type="ultrapower:scientist", model="haiku", prompt="[STAGE:2] Analyze src/utils/...")
Task(subagent_type="ultrapower:scientist", model="haiku", prompt="[STAGE:3] Analyze src/components/...")
```

### 假设组合（并行）

测试多个假设时：

```
// Test hypotheses simultaneously
Task(subagent_type="ultrapower:scientist", model="sonnet", prompt="[HYPOTHESIS:A] Test if caching improves...")
Task(subagent_type="ultrapower:scientist", model="sonnet", prompt="[HYPOTHESIS:B] Test if batching reduces...")
Task(subagent_type="ultrapower:scientist", model="sonnet", prompt="[HYPOTHESIS:C] Test if lazy loading helps...")
```

### 交叉验证（顺序）

当验证依赖所有发现时：

```
// Wait for all parallel stages
[stages complete]

// Then sequential verification
Task(subagent_type="ultrapower:scientist-high", model="opus", prompt="
[CROSS_VALIDATION]
Validate consistency across all findings:
- Finding 1: ...
- Finding 2: ...
- Finding 3: ...
")
```

### 并发限制

**最多 20 个并发 scientist agent** 以防止资源耗尽。

超过 20 个阶段时，分批处理：
```
Batch 1: Stages 1-5 (parallel)
[wait for completion]
Batch 2: Stages 6-7 (parallel)
```

## Session 管理

### 目录结构

```
.omc/research/{session-id}/
  state.json              # Session 状态和进度
  stages/
    stage-1.md            # 阶段 1 发现
    stage-2.md            # 阶段 2 发现
    ...
  findings/
    raw/                  # scientist 的原始发现
    verified/             # 验证后的发现
  figures/
    figure-1.png          # 生成的可视化
    ...
  report.md               # 最终综合报告
```

### 状态文件格式

```json
{
  "id": "research-20240115-abc123",
  "goal": "Original research goal",
  "status": "in_progress | complete | blocked | cancelled",
  "mode": "standard | auto",
  "iteration": 3,
  "maxIterations": 10,
  "stages": [
    {
      "id": 1,
      "name": "Stage name",
      "tier": "LOW | MEDIUM | HIGH",
      "status": "pending | running | complete | failed",
      "startedAt": "ISO timestamp",
      "completedAt": "ISO timestamp",
      "findingsFile": "stages/stage-1.md"
    }
  ],
  "verification": {
    "status": "pending | passed | failed",
    "conflicts": [],
    "completedAt": "ISO timestamp"
  },
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

### Session 命令

| 命令 | 操作 |
|---------|--------|
| `/ultrapower:sciomc status` | 显示当前 session 进度 |
| `/ultrapower:sciomc resume` | 恢复最近中断的 session |
| `/ultrapower:sciomc resume <session-id>` | 恢复指定 session |
| `/ultrapower:sciomc list` | 列出所有 session 及状态 |
| `/ultrapower:sciomc report <session-id>` | 生成/重新生成报告 |
| `/ultrapower:sciomc cancel` | 取消当前 session（保留状态） |

## 标签提取

Scientist 使用结构化标签记录发现。使用以下模式提取：

### 发现标签

```
[FINDING:<id>] <title>
<evidence and analysis>
[/FINDING]

[EVIDENCE:<finding-id>]
- File: <path>
- Lines: <range>
- Content: <relevant code/text>
[/EVIDENCE]

[CONFIDENCE:<level>] # HIGH | MEDIUM | LOW
<reasoning for confidence level>
```

### 提取正则模式

```javascript
// Finding extraction
const findingPattern = /\[FINDING:(\w+)\]\s*(.*?)\n([\s\S]*?)\[\/FINDING\]/g;

// Evidence extraction
const evidencePattern = /\[EVIDENCE:(\w+)\]([\s\S]*?)\[\/EVIDENCE\]/g;

// Confidence extraction
const confidencePattern = /\[CONFIDENCE:(HIGH|MEDIUM|LOW)\]\s*(.*)/g;

// Stage completion
const stageCompletePattern = /\[STAGE_COMPLETE:(\d+)\]/;

// Verification result
const verificationPattern = /\[(VERIFIED|CONFLICTS):?(.*?)\]/;
```

### 证据窗口

提取证据时包含上下文窗口：

```
[EVIDENCE:F1]
- File: /src/auth/login.ts
- Lines: 45-52 (context: 40-57)
- Content:
  ```typescript
  // Lines 45-52 with 5 lines context above/below
  ```
[/EVIDENCE]
```

### 质量验证

发现必须满足质量阈值：

| 质量检查 | 要求 |
|---------------|-------------|
| 存在证据 | 每个 [FINDING] 至少 1 个 [EVIDENCE] |
| 已说明置信度 | 每个发现有 [CONFIDENCE] |
| 已引用来源 | 文件路径为绝对路径且有效 |
| 可重现 | 另一个 agent 可以验证 |

## 报告生成

### 报告模板

```markdown
# Research Report: {{GOAL}}

**Session ID:** {{SESSION_ID}}
**Date:** {{DATE}}
**Status:** {{STATUS}}

## Executive Summary

{{2-3 paragraph summary of key findings}}

## Methodology

### Research Stages

| Stage | Focus | Tier | Status |
|-------|-------|------|--------|
{{STAGES_TABLE}}

### Approach

{{Description of decomposition rationale and execution strategy}}

## Key Findings

### Finding 1: {{TITLE}}

**Confidence:** {{HIGH|MEDIUM|LOW}}

{{Detailed finding with evidence}}

#### Evidence

{{Embedded evidence blocks}}

### Finding 2: {{TITLE}}
...

## Visualizations

{{FIGURES}}

## Cross-Validation Results

{{Verification summary, any conflicts resolved}}

## Limitations

- {{Limitation 1}}
- {{Limitation 2}}
- {{Areas not covered and why}}

## Recommendations

1. {{Actionable recommendation}}
2. {{Actionable recommendation}}

## Appendix

### Raw Data

{{Links to raw findings files}}

### Session State

{{Link to state.json}}
```

### 图表嵌入协议

Scientist 使用此标记生成可视化：

```
[FIGURE:path/to/figure.png]
Caption: Description of what the figure shows
Alt: Accessibility description
[/FIGURE]
```

报告生成器嵌入图表：

```markdown
## Visualizations

![Figure 1: Description](figures/figure-1.png)
*Caption: Description of what the figure shows*

![Figure 2: Description](figures/figure-2.png)
*Caption: Description of what the figure shows*
```

### 图表类型

| 类型 | 用途 | 生成者 |
|------|---------|--------------|
| 架构图 | 系统结构 | scientist-high |
| 流程图 | 流程流向 | scientist |
| 依赖图 | 模块关系 | scientist |
| 时间线 | 事件序列 | scientist |
| 对比表 | A vs B 分析 | scientist |

## 配置

`.claude/settings.json` 中的可选设置：

```json
{
  "omc": {
    "research": {
      "maxIterations": 10,
      "maxConcurrentScientists": 5,
      "defaultTier": "MEDIUM",
      "autoVerify": true,
      "generateFigures": true,
      "evidenceContextLines": 5
    }
  }
}
```

## 取消

```
/ultrapower:cancel
```

或说："stop research"、"cancel research"、"abort"

进度保存在 `.omc/research/{session-id}/` 中以供恢复。

## 故障排除

**卡在验证循环中？**
- 检查阶段间是否有冲突发现
- 查看 state.json 中的具体冲突
- 可能需要用不同方法重新运行特定阶段

**Scientist 返回低质量发现？**
- 检查层级分配——复杂分析需要 HIGH 层
- 确保提示包含清晰的范围和预期输出格式
- 检查研究目标是否过于宽泛

**AUTO 模式耗尽迭代次数？**
- 查看状态以了解卡在哪里
- 检查目标是否可以用现有数据实现
- 考虑拆分为更小的研究 session

**报告中缺少图表？**
- 验证 figures/ 目录是否存在
- 检查发现中的 [FIGURE:] 标签
- 确保路径相对于 session 目录
