---
name: swarm
description: N 个协调 agent 共享任务列表（team 的兼容性外观）
---

# Swarm（兼容性外观）

Swarm 是 `/ultrapower:team` skill 的兼容性别名。所有 swarm 调用都路由到 Team skill 的分阶段 pipeline。

## 用法

```
/ultrapower:swarm N:agent-type "task description"
/ultrapower:swarm "task description"
```

## 行为

此 skill 与 `/ultrapower:team` 完全相同。使用相同参数调用 Team skill：

```
/ultrapower:team <arguments>
```

遵循 Team skill 的完整文档，了解分阶段 pipeline、agent 路由和协调语义。
