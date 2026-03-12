# Spec Kit Native Implementation

ultrapower 内置完整 Spec Kit 功能，无需外部依赖。

## 快速开始

```bash
npm install -g @liangjie559567/ultrapower
```

✅ **零外部依赖** - 无需安装 Python、uv 或 specify-cli
✅ **纯 TypeScript 实现** - 完全原生集成
✅ **智能分析** - 自动检测项目结构、依赖和代码模式

## 使用方法

### 1. Constitution - 生成项目原则

```typescript
import { generateConstitution, formatConstitution } from '@liangjie559567/ultrapower/features/speckit-core';

const constitution = await generateConstitution(process.cwd());
const markdown = formatConstitution(constitution);
```

**自动检测：**
- TypeScript 配置
- 测试框架
- 前端框架（Next.js/Vite）
- 包管理器（npm/yarn/pnpm）

### 2. Specify - 生成功能规范

```typescript
import { generateSpecification, formatSpecification } from '@liangjie559567/ultrapower/features/speckit-core';

const spec = await generateSpecification('user-authentication', constitution);
const markdown = formatSpecification(spec);
```

**输出包含：**
- 功能概述
- 需求列表（带优先级）
- 约束条件
- 验收标准

### 3. Plan - 生成技术方案

```typescript
import { generatePlan, formatPlan } from '@liangjie559567/ultrapower/features/speckit-core';

const plan = await generatePlan(specification);
const markdown = formatPlan(plan);
```

**输出包含：**
- 实现方法
- 组件列表
- 依赖关系
- 风险评估

### 4. Tasks - 分解任务

```typescript
import { generateTasks, formatTasks } from '@liangjie559567/ultrapower/features/speckit-core';

const tasks = await generateTasks(plan);
const markdown = formatTasks(tasks);
```

**输出包含：**
- 任务 ID
- 任务描述
- 依赖关系
- 工作量估算

## Skills 使用

通过 slash 命令使用：

```
/speckit.constitution  # 生成项目原则
/speckit.specify       # 生成功能规范
/speckit.plan          # 生成技术方案
/speckit.tasks         # 分解任务
/speckit.implement     # 执行实现
```

## 完整工作流示例

```typescript
// 1. 生成 constitution
const constitution = await generateConstitution('./my-project');
await fs.writeFile('.specify/memory/constitution.md', formatConstitution(constitution));

// 2. 生成 specification
const spec = await generateSpecification('payment-system', constitution);
await fs.writeFile('.specify/memory/specs/payment.md', formatSpecification(spec));

// 3. 生成 plan
const plan = await generatePlan(spec);
await fs.writeFile('.specify/plan.md', formatPlan(plan));

// 4. 生成 tasks
const tasks = await generateTasks(plan);
await fs.writeFile('.specify/tasks.md', formatTasks(tasks));

// 5. 实现（委托给 executor agent）
for (const task of tasks) {
  await executeTask(task);
}
```

## 类型定义

```typescript
interface Constitution {
  principles: Principle[];
  projectName: string;
  generatedAt: string;
}

interface Specification {
  feature: string;
  overview: string;
  requirements: Requirement[];
  constraints: string[];
  acceptanceCriteria: string[];
}

interface TechnicalPlan {
  approach: string;
  components: Component[];
  dependencies: string[];
  risks: Risk[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  estimatedEffort: string;
}
```

## 与 ultrapower 集成

Spec Kit 深度集成到 ultrapower 核心：

- **workflow-recommender** - 自动推荐 Spec Kit 工作流
- **task-decomposer** - 增强任务分解能力
- **delegation-routing** - 智能路由到 Spec Kit
- **Axiom 系统** - 映射到 Axiom 工作流

## 优势

✅ **零外部依赖** - 纯 TypeScript 实现
✅ **完全集成** - 与 ultrapower agents 无缝协作
✅ **类型安全** - 完整 TypeScript 类型定义
✅ **高性能** - 无需启动外部进程
✅ **易于扩展** - 模块化架构

## 测试

```bash
npm test src/features/speckit-core
```

所有核心功能均有测试覆盖。
