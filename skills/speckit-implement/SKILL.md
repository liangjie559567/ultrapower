---
name: speckit-implement
description: "Spec Kit Implement - 执行任务并生成代码"
---

# Spec Kit Implement Skill

执行任务并生成实现代码。

## 触发方式

- "speckit implement"
- "开始实现"

## 实现

使用 ultrapower 原生实现，委托给 executor agent：

```typescript
// 读取任务列表
const tasks = await readTasks('.specify/tasks.md');

// 委托给 executor agent 逐个实现
for (const task of tasks) {
  await Agent({
    subagent_type: 'ultrapower:executor',
    prompt: `Implement: ${task.title}\n${task.description}`
  });
}
```

根据任务清单生成代码实现。
