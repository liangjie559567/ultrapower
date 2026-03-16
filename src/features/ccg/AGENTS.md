<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-14 | Updated: 2026-03-14 -->

# src/features/ccg/ - 代码生成和编排

**用途：** 智能代码生成流水线。分析项目结构、检测技术栈、拆分模块、分配任务、生成代码。

**核心职责：** 从高层需求到可执行代码的端到端编排。

## 关键文件

| 文件 | 描述 |
| ------ | ------ |
| `ccg-skill.ts` | CCG Skill 入口 |
| `project-detector.ts` | 项目类型检测 |
| `tech-stack-detector.ts` | 技术栈识别 |
| `structure-analyzer.ts` | 代码结构分析 |
| `module-splitter.ts` | 模块拆分逻辑 |
| `task-assigner.ts` | 任务分配 |
| `loop-controller.ts` | 生成循环控制 |
| `stream-processor.ts` | 流处理 |
| `doc-manager.ts` | 文档管理 |
| `workflow-router.ts` | 工作流路由 |

## 子目录

- `templates/` - 代码模板
- `workflows/` - 工作流定义

## 面向 AI 智能体

### 在此目录中工作

1. **理解 CCG 流程**
   - 项目检测 → 技术栈识别 → 结构分析 → 模块拆分 → 任务分配 → 代码生成

2. **修改生成逻辑**
   - 编辑对应模块的 `.ts` 文件
   - 运行 `npm test` 验证
   - 更新文档

3. **添加新模板**
   - 在 `templates/` 中创建
   - 在 `task-assigner.ts` 中注册
   - 更新本文档

### 常见任务

```typescript
// 检测项目
import { detectProject } from './project-detector';
const project = await detectProject(cwd);

// 分配任务
import { assignTasks } from './task-assigner';
const tasks = await assignTasks(project);
```
