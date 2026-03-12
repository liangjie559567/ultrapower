---
name: speckit-specify
description: "Spec Kit Specify - 定义功能需求和规范"
---

# Spec Kit Specify Skill

定义项目的功能需求和详细规范。

## 触发方式

- "speckit specify"
- "定义需求规范"

## 实现

使用 ultrapower 原生实现：

```typescript
import { generateSpecification, formatSpecification } from '@/features/speckit-core';

const spec = await generateSpecification('feature-name', constitution);
const markdown = formatSpecification(spec);
```

生成 `.specify/memory/specs/` 目录下的规范文件。
