---
name: speckit-plan
description: "Spec Kit Plan - 生成技术实现计划"
---

# Spec Kit Plan Skill

基于规范生成技术实现计划。

## 触发方式

- "speckit plan"
- "生成实现计划"

## 实现

使用 ultrapower 原生实现：

```typescript
import { generatePlan, formatPlan } from '@/features/speckit-core';

const plan = await generatePlan(specification);
const markdown = formatPlan(plan);
```

生成 `.specify/plan.md` 技术方案文件。
