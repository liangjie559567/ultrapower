<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-14 | Updated: 2026-03-14 -->

# src/features/ccg/workflows/ - 代码生成工作流

**用途：** 分阶段工作流定义。新项目流程、既有项目流程、各阶段处理器。

## 关键文件

| 文件 | 描述 |
| ------ | ------ |
| `new-project-workflow.ts` | 新项目完整流程 |
| `old-project-workflow.ts` | 既有项目修改流程 |
| `phase-requirement.ts` | 需求分析阶段 |
| `phase-module-split.ts` | 模块拆分阶段 |
| `phase-development.ts` | 开发实现阶段 |
| `phase-testing.ts` | 测试验证阶段 |
| `phase-optimization.ts` | 优化阶段 |
| `phase-modification-plan.ts` | 修改计划阶段 |
| `phase-read-status.ts` | 状态读取阶段 |

## 面向 AI 智能体

### 在此目录中工作

1. **理解工作流**
   - 新项目：requirement → module-split → development → testing → optimization
   - 既有项目：read-status → modification-plan → development → testing

2. **修改阶段**
   - 编辑对应 `phase-*.ts` 文件
   - 运行 `npm test` 验证
   - 更新文档

3. **添加新阶段**
   - 创建 `phase-name.ts`
   - 在工作流中注册
   - 更新本文档

### 常见任务

```typescript
// 执行工作流
import { newProjectWorkflow } from './new-project-workflow';
const result = await newProjectWorkflow(input);

// 执行单个阶段
import { phaseRequirement } from './phase-requirement';
const req = await phaseRequirement(context);
```
