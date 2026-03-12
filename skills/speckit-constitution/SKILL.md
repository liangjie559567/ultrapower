---
name: speckit-constitution
description: "Spec Kit Constitution - 建立项目原则和核心价值观"
---

# Spec Kit Constitution Skill

建立项目的核心原则、价值观和约束条件。

## 触发方式

用户输入包含以下关键词时自动触发：
- "speckit constitution"
- "建立项目原则"
- "定义核心价值观"

## 功能

调用 Spec Kit 的 constitution 命令，帮助用户：
1. 定义项目核心原则
2. 建立技术约束
3. 设定质量标准

## 实现

使用 ultrapower 原生实现（无需外部依赖）：

```typescript
import { generateConstitution, formatConstitution } from '@/features/speckit-core';

const constitution = await generateConstitution(process.cwd());
const markdown = formatConstitution(constitution);
```

自动分析项目：
- TypeScript 配置
- 测试框架
- 包管理器
- 代码语言

## 输出

生成 `.specify/memory/constitution.md` 文件，包含项目原则定义。
