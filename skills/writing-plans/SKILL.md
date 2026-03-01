---
name: writing-plans
description: 在有规格或需求的多步骤任务时使用，在接触代码之前必须先编写实现计划
---

# 编写计划

## 概述

编写全面的实现计划，假设工程师对我们的代码库零上下文且品味存疑。记录他们需要知道的一切：每个任务需要修改哪些文件、代码、可能需要查阅的测试和文档、如何测试。将整个计划以小步骤的形式呈现。DRY。YAGNI。TDD。频繁提交。

假设他们是熟练的开发者，但对我们的工具集或问题域几乎一无所知。假设他们不太擅长良好的测试设计。

**开始时宣布：** "I'm using the writing-plans skill to create the implementation plan."

**上下文：** 应在专用 worktree 中运行（由 brainstorming skill 创建）。

**保存计划到：** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## 小步骤粒度

**每个步骤是一个动作（2-5 分钟）：**
- "Write the failing test" - 步骤
- "Run it to make sure it fails" - 步骤
- "Implement the minimal code to make the test pass" - 步骤
- "Run the tests and make sure they pass" - 步骤
- "Commit" - 步骤

## 计划文档头部

**每个计划必须以此头部开始：**

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use ultrapower:executing-plans to implement this plan task-by-task.

**Goal:** [一句话描述构建内容]

**Architecture:** [2-3 句关于方法的描述]

**Tech Stack:** [关键技术/库]

---
```

## 任务结构

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

**Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## 注意事项
- 始终使用精确的文件路径
- 计划中包含完整代码（而非"添加验证"）
- 精确的命令及预期输出
- 使用 @ 语法引用相关 skill
- DRY、YAGNI、TDD、频繁提交

## 执行交接

保存计划后，提供执行选择：

**"计划已完成并保存到 `docs/plans/<filename>.md`。两种执行选项：**

**1. Subagent 驱动（本 session）** - 每个任务派发新 subagent，任务间审查，快速迭代

**2. 并行 Session（独立）** - 使用 executing-plans 打开新 session，带检查点的批量执行

**选择哪种方式？"**

**如果选择 Subagent 驱动：**
- **必需子 skill：** 使用 ultrapower:subagent-driven-development
- 保持在本 session
- 每个任务新 subagent + 代码审查

**如果选择并行 Session：**
- 引导他们在 worktree 中打开新 session
- **必需子 skill：** 新 session 使用 ultrapower:executing-plans

## 路由触发

计划文档提交后调用 `next-step-router`：
- current_skill: "writing-plans"
- stage: "plan_committed"
- output_summary: 计划中的任务数、涉及文件数、是否有架构变更
- full_context: { doc_paths: [计划文档路径], key_decisions: [...] }

## Axiom DAG 任务拆解流程（增强）

当需要将 PRD 拆解为可执行任务时，执行以下步骤：

### 工作量门控

- **< 1 天工作量**：直接生成单一任务，跳过完整拆解流程
- **> 1 天工作量**：执行完整 DAG 拆解

### DAG 分析步骤

1. **读取 PRD**：从 `docs/prd/[name].md` 加载需求
2. **识别依赖关系**：分析任务间的前置条件，构建有向无环图
3. **生成 Sub-PRD**：为每个任务调用 `writer` agent 生成 `docs/tasks/[id]/sub_prds/[name].md`
4. **PM 审计**：调用 `analyst` agent 验证任务覆盖度（无遗漏、无重复）
5. **输出任务队列**：按 DAG 拓扑排序，标注并行可执行的任务组

### 任务队列格式

```markdown
## Task Queue

| ID | Name | Dependencies | Parallel Group | Estimated |
|----|------|-------------|----------------|-----------|
| T1 | ... | none | G1 | 2h |
| T2 | ... | T1 | G2 | 3h |
| T3 | ... | T1 | G2 | 2h |
```

### 系统架构师技能调用

当任务涉及架构决策时，调用 `ultrapower:architect` agent 进行：
- 接口定义（函数签名、数据结构）
- 模块边界划分
- 技术选型建议
