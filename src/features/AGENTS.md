<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-28 | Updated: 2026-01-31 -->

# features

ultrapower 的核心功能模块 - 模型路由、状态管理、验证等。

## 用途

此目录包含增强编排能力的独立功能模块：
- **model-routing/** - 根据任务复杂度智能路由到 Haiku/Sonnet/Opus
- **boulder-state/** - 计划状态持久化与追踪
- **verification/** - 可复用的验证协议
- **notepad-wisdom/** - 计划范围内的学习、决策、问题记录
- **delegation-categories/** - 语义任务分类
- **task-decomposer/** - 并行执行的任务分解
- **state-manager/** - 标准化状态文件管理
- **context-injector/** - 上下文增强注入
- **background-agent/** - 后台任务并发
- **rate-limit-wait/** - API 速率限制处理

## 关键文件

| 文件 | 描述 |
|------|------|
| `index.ts` | 重新导出所有功能模块 |
| `magic-keywords.ts` | 魔法关键词检测（ultrawork、analyze 等） |
| `continuation-enforcement.ts` | 确保任务在停止前完成 |
| `auto-update.ts` | 静默版本检查与更新 |
| `background-tasks.ts` | 后台任务执行模式 |
| `delegation-enforcer.ts` | 强制执行委派优先协议 |

## 子目录

| 目录 | 用途 |
|------|------|
| `model-routing/` | 基于复杂度的智能模型选择 |
| `boulder-state/` | 计划状态与进度持久化 |
| `verification/` | 带证据追踪的验证协议 |
| `notepad-wisdom/` | 计划范围内的知识捕获 |
| `delegation-categories/` | 模型/温度选择的任务分类 |
| `task-decomposer/` | 并行化的任务分解 |
| `state-manager/` | 标准化状态文件位置 |
| `context-injector/` | 提示词的上下文增强 |
| `background-agent/` | 后台任务管理 |
| `rate-limit-wait/` | 速率限制检测与等待 |
| `builtin-skills/` | 内置 skill 定义 |

## 面向 AI Agent

### 在此目录中工作

#### 模型路由

根据复杂度信号将任务路由到最优模型：

```typescript
import { routeToModel, extractComplexitySignals } from './model-routing';

const signals = extractComplexitySignals(prompt);
const model = routeToModel(signals); // 'haiku' | 'sonnet' | 'opus'
```

**信号类型：**
- 代码复杂度（LOC、圈复杂度）
- 任务关键词（debug、refactor、implement）
- 文件数量和范围
- 错误/风险指标

#### Boulder State

跨会话持久化计划状态：

```typescript
import { readBoulderState, writeBoulderState, hasBoulder } from './boulder-state';

if (hasBoulder()) {
  const state = readBoulderState();
  state.progress.completedTasks++;
  writeBoulderState(state);
}
```

**状态位置：** `.omc/state/boulder.json`

#### 验证协议

带证据的标准化验证：

```typescript
import { createVerificationContext, addEvidence, isVerified } from './verification';

const ctx = createVerificationContext(['BUILD', 'TEST', 'FUNCTIONALITY']);
addEvidence(ctx, 'BUILD', { passed: true, output: '...' });
addEvidence(ctx, 'TEST', { passed: true, output: '...' });

if (isVerified(ctx)) {
  // 所有检查通过
}
```

**检查类型：** BUILD、TEST、LINT、FUNCTIONALITY、ARCHITECT、TODO、ERROR_FREE

#### Notepad Wisdom

在执行过程中捕获学习内容：

```typescript
import { initPlanNotepad, addLearning, addDecision } from './notepad-wisdom';

initPlanNotepad('my-plan');
addLearning('my-plan', 'The API requires auth headers');
addDecision('my-plan', 'Using JWT for authentication');
```

**位置：** `.omc/notepads/{plan-name}/`

#### 委派分类

用于模型选择的语义分类：

```typescript
import { categorizeTask, getCategoryConfig } from './delegation-categories';

const category = categorizeTask(prompt); // 'ultrabrain' | 'visual-engineering' | etc.
const config = getCategoryConfig(category);
// { tier: 'HIGH', temperature: 0.3, thinking: 'max' }
```

### 修改检查清单

#### 添加新功能时

1. 创建包含 `index.ts`、`types.ts`、`constants.ts` 的功能目录
2. 从 `features/index.ts` 导出
3. 用 API 文档更新 `docs/FEATURES.md`
4. 如架构有变化，更新 `docs/AGENTS.md`

#### 修改状态文件路径时

1. 更新 `state-manager/` 以标准化路径
2. 考虑现有状态文件的迁移逻辑
3. 在功能的 README 或 AGENTS.md 中记录新路径

### 常见模式

#### 功能模块结构

```
feature-name/
├── index.ts     # 主导出
├── types.ts     # TypeScript 接口
├── constants.ts # 配置常量
└── *.ts         # 实现文件
```

### 测试要求

```bash
npm test -- --grep "features"
```

## 依赖

### 内部
- 功能模块独立，但可从 `shared/types.ts` 导入

### 外部
| 包 | 用途 |
|----|------|
| `fs`, `path` | 状态持久化的文件操作 |

## 功能摘要

| 功能 | 用途 | 状态位置 |
|------|------|---------|
| model-routing | 智能模型选择 | 无（无状态） |
| boulder-state | 计划进度追踪 | `.omc/state/boulder.json` |
| verification | 基于证据的验证 | 内存中 |
| notepad-wisdom | 知识捕获 | `.omc/notepads/` |
| delegation-categories | 任务分类 | 无（无状态） |
| task-decomposer | 并行化 | 内存中 |
| state-manager | 文件路径标准化 | `.omc/state/`、`~/.omc/state/` |
| context-injector | 提示词增强 | 内存中 |
| background-agent | 并发控制 | 内存中 |
| rate-limit-wait | 速率限制处理 | `.omc/state/rate-limits.json` |

<!-- MANUAL: -->
