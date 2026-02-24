---
name: ax-decompose
description: "/ax-decompose — Axiom 任务拆解工作流：Rough PRD → 系统架构 → 原子任务 DAG → Manifest 清单"
---

# Axiom 任务拆解工作流 (Phase 2)

本工作流将 Rough PRD 分解为可执行的原子任务清单。

**开始时宣告：** "I'm using the ax-decompose skill to start the task decomposition workflow."

## 前置条件

- Rough PRD 存在于 `docs/prd/[name]-rough.md`

## 执行步骤

### Step 1: 系统架构分析

调用 `axiom-system-architect` agent：

```
Task(subagent_type="ultrapower:axiom-system-architect", model="opus", prompt="分析以下 Rough PRD 并生成任务 Manifest：[rough PRD 内容]")
```

输出：
- 全局架构图（Mermaid DAG）
- `docs/tasks/[feature-id]/manifest.md`

### Step 2: 复杂度评估（Complexity Gate）

检查任务总工时估算：
- 若总工时 > 1 天：建议进一步拆解子任务
- 若单任务 > 4 小时：标记为需要拆解

### Step 3: 用户确认

展示 Manifest 路径，询问：
"任务拆解完成：`docs/tasks/[feature-id]/manifest.md`。共 [N] 个原子任务。是否开始实施？"

- **是**：调用 `/ax-implement` skill
- **调整**：用户可要求修改任务粒度
- **否**：在此停止

## 任务粒度规则

- 每个任务：> 1 个文件变更，< 1 天工作量
- 命名格式：`T-{ID}`（如 `T-001`）
- 依赖关系必须明确标注
