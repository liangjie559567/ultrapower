---
name: ax-draft
description: "/ax-draft — Axiom 需求起草工作流：需求澄清循环 → PRD 初稿生成 → 用户评审门禁"
---

# Axiom 需求起草工作流 (Phase 1)

本工作流将用户原始需求转化为结构化的 PRD 初稿。

**开始时宣告：** "I'm using the ax-draft skill to start the requirement drafting workflow."

## 执行步骤

### Step 1: 需求澄清循环

调用 `axiom-requirement-analyst` agent：

```
Task(subagent_type="ultrapower:axiom-requirement-analyst", model="sonnet", prompt="分析以下需求：[用户需求]")
```

检查结果：
- 若 `REJECT`：停止并向用户解释原因
- 若 `CLARIFY`（< 90%）：向用户询问生成的问题，等待回复，使用新输入重复 Step 1
- 若 `PASS`（>= 90%）：进入 Step 2

### Step 2: 生成 PRD 初稿

调用 `axiom-product-designer` agent：

```
Task(subagent_type="ultrapower:axiom-product-designer", model="sonnet", prompt="基于以下通过验证的需求生成 Draft PRD：[PASS 结果]")
```

输出：新文件生成于 `docs/prd/[name]-draft.md`

### Step 3: 用户评审门禁

向用户展示 PRD 初稿路径，询问：
"PRD 初稿已就绪：`docs/prd/[name]-draft.md`。是否进入专家评审阶段？"

- **是**：调用 `/ax-review` skill
- **否**：在此停止

## 核心原则

- 清晰度 < 90% 时必须循环澄清，不可跳过
- 每次只问一个澄清问题
- YAGNI：MVP 范围最小化
