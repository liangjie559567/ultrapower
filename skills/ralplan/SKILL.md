---
name: ralplan
description: /plan --consensus 的别名
---

# Ralplan（共识规划别名）

Ralplan 是 `/ultrapower:plan --consensus` 的简写别名。它触发 Planner、Architect 和 Critic agent 的迭代规划，直到达成共识。

## 用法

```
/ultrapower:ralplan "task description"
```

## 行为

此 skill 以共识模式调用 Plan skill：

```
/ultrapower:plan --consensus <arguments>
```

共识工作流：
1. **Planner** creates initial plan
2. **User feedback**：**MUST** use `AskUserQuestion` to present draft plan before review（Proceed to review / Request changes / Skip review）
3. **Architect** reviews architectural soundness
4. **Critic** evaluates against quality standards
5. 如果 Critic 拒绝：结合反馈迭代（最多 5 次）
6. Critic 批准后：**必须**使用 `AskUserQuestion` 展示计划并提供批准选项
7. 用户选择：批准、请求修改或拒绝
8. 批准后：**必须**调用 `Skill("ultrapower:ralph")` 执行——绝不直接实施

共识模式详情请参阅 Plan skill 的完整文档。
