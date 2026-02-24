---
name: review
description: /plan --review 的别名
---

# Review（计划审查别名）

Review 是 `/ultrapower:plan --review` 的简写别名。它触发 Critic 对现有计划的评估。

## 用法

```
/ultrapower:review
/ultrapower:review "path/to/plan.md"
```

## 行为

此 skill 以审查模式调用 Plan skill：

```
/ultrapower:plan --review <arguments>
```

审查工作流：
1. 从 `.omc/plans/` 读取计划文件（或指定路径）
2. 通过 Critic agent 评估
3. 返回裁决：APPROVED、REVISE（附具体反馈）或 REJECT（需要重新规划）

审查模式详情请参阅 Plan skill 的完整文档。
