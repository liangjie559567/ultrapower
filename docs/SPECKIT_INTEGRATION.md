# Spec Kit Integration Guide

## 概述

Spec Kit 已深度集成到 ultrapower 的核心模块中，提供规范驱动的开发工作流。

## 集成模块

### 1. 核心集成 (`src/features/speckit-integration/`)
- **index.ts** - 基础功能和关键词检测
- **router.ts** - 工作流路由表
- **recommender.ts** - 推荐引擎集成
- **axiom-bridge.ts** - Axiom 系统桥接

### 2. Task Decomposer 集成
- 自动检测复杂任务
- 解析 Spec Kit tasks.md
- 增强任务分解能力

### 3. Delegation Routing 集成
- 智能路由到 Spec Kit 工作流
- 委托建议生成

## 使用方法

### Slash 命令
```
/speckit.constitution  # 定义项目原则
/speckit.specify       # 编写功能规范
/speckit.plan          # 生成技术方案
/speckit.tasks         # 分解任务
/speckit.implement     # 执行实现
```

### 编程接口
```typescript
import { shouldUseSpecKit, analyzeSpecKitFit } from './features/speckit-integration';

// 检测是否使用 Spec Kit
if (shouldUseSpecKit(userInput)) {
  const recommendation = analyzeSpecKitFit(userInput, context);
  // ...
}
```

## 工作流

1. **Constitution** → 定义项目原则
2. **Specify** → 编写详细规范
3. **Plan** → 生成技术方案
4. **Tasks** → 分解可执行任务
5. **Implement** → 执行实现

## 测试

```bash
npm test -- src/features/speckit-integration
npm test -- src/features/task-decomposer
npm test -- src/features/delegation-routing
```
