---
name: speckit-tasks
description: "Spec Kit Tasks - 任务分解和优先级排序"
---

# Spec Kit Tasks Skill

将计划分解为可执行任务。

## 触发方式

- "speckit tasks"
- "任务分解"

## 实现

使用 ultrapower 原生实现：

```typescript
import { generateTasks, formatTasks } from '@/features/speckit-core';

const tasks = await generateTasks(plan);
const markdown = formatTasks(tasks);
```

生成 `.specify/tasks.md` 任务清单。
