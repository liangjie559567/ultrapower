<!-- Generated: 2026-01-28 | Updated: 2026-03-05 -->

# src/features/ - 功能层

**用途：** 核心功能模块。包括模型路由、验证、状态管理、任务分解等。

**版本：** 5.5.14

## 关键文件

| 文件 | 描述 |
| ------ | ------ |
| `model-routing/` | 模型层级路由（Haiku/Sonnet/Opus） |
| `verification/` | 验证和完成证据收集 |
| `state-manager/` | 状态管理和持久化 |
| `task-decomposer/` | 任务分解和规划 |
| `delegation-categories/` | 委托分类和路由 |
| `boulder-state/` | Boulder 状态管理 |

## 子目录结构

```
src/features/
├── model-routing/          # 模型路由
│   ├── index.ts
│   ├── tier-selector.ts
│   └── ...
├── verification/           # 验证系统
│   ├── index.ts
│   ├── evidence-collector.ts
│   └── ...
├── state-manager/          # 状态管理
│   ├── index.ts
│   ├── persistence.ts
│   └── ...
├── task-decomposer/        # 任务分解
│   ├── index.ts
│   ├── dependency-graph.ts
│   └── ...
├── delegation-categories/  # 委托分类
│   ├── index.ts
│   └── ...
├── boulder-state/          # Boulder 状态
│   ├── index.ts
│   └── ...
└── __tests__/              # 测试
```

## 面向 AI 智能体

### 在此目录中工作

1. **模型路由**
   - 根据任务复杂度选择模型
   - Haiku - 快速查找、轻量扫描
   - Sonnet - 标准实现、调试
   - Opus - 架构、深度分析

1. **验证系统**
   - 收集完成证据
   - 验证声明
   - 生成验证报告

1. **状态管理**
   - 持久化执行状态
   - 恢复中断的任务
   - 管理会话生命周期

### 修改检查清单

| 修改位置 | 验证步骤 |
| --------- | --------- |
| 模型路由 | 运行 `npm test` |
| 验证逻辑 | 检查证据收集 |
| 状态管理 | 测试持久化 |
