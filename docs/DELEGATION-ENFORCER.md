# Delegation Enforcer

**为 Task/Agent 调用自动注入 model 参数**

## 问题

Claude Code **不会**自动应用 agent 定义中的 model 参数。当您调用 `Task` 工具（或 `Agent` 工具）时，即使每个 agent 在其配置中已定义了默认模型，您仍需每次手动指定 `model` 参数。

这导致：
- 委托代码冗长
- 遗忘 model 参数时默认使用父模型
- 整个代码库中模型使用不一致

## 解决方案

**Delegation Enforcer** 是一个中间件，当未明确指定时，它会根据 agent 定义自动注入 model 参数。

## 工作原理

### 1. Pre-Tool-Use Hook

enforcer 作为 pre-tool-use hook 运行，拦截 `Task` 和 `Agent` 工具调用：

```typescript
// 执行前
Task(
  subagent_type="ultrapower:executor",
  prompt="Implement feature X"
)

// 执行后（自动）
Task(
  subagent_type="ultrapower:executor",
  model="sonnet",  // ← 自动注入
  prompt="Implement feature X"
)
```

### 2. Agent 定义查找

每个 agent 在其定义中有一个默认模型：

```typescript
export const executorAgent: AgentConfig = {
  name: 'executor',
  description: '...',
  prompt: '...',
  tools: [...],
  model: 'sonnet'  // ← 默认模型
};
```

enforcer 读取此定义并在未指定时注入模型。

### 3. 显式模型始终保留

如果您明确指定了模型，它始终会被保留：

```typescript
// 显式模型永远不会被覆盖
Task(
  subagent_type="ultrapower:executor",
  model="haiku",  // ← 明确使用 haiku 而非默认的 sonnet
  prompt="Quick lookup"
)
```

## API

### 核心函数

#### `enforceModel(agentInput: AgentInput): EnforcementResult`

为单个 agent 委托调用执行 model 参数强制注入。

```typescript
import { enforceModel } from '@liangjie559567/ultrapower';

const input = {
  description: 'Implement feature',
  prompt: 'Add validation',
  subagent_type: 'executor'
};

const result = enforceModel(input);
console.log(result.modifiedInput.model); // 'sonnet'
console.log(result.injected); // true
```

#### `getModelForAgent(agentType: string): ModelType`

获取 agent 类型的默认模型。

```typescript
import { getModelForAgent } from '@liangjie559567/ultrapower';

getModelForAgent('executor'); // 'sonnet'
getModelForAgent('executor-low'); // 'haiku'
getModelForAgent('executor-high'); // 'opus'
```

#### `isAgentCall(toolName: string, toolInput: unknown): boolean`

检查工具调用是否为 agent 委托调用。

```typescript
import { isAgentCall } from '@liangjie559567/ultrapower';

isAgentCall('Task', { subagent_type: 'executor', ... }); // true
isAgentCall('Bash', { command: 'ls' }); // false
```

### Hook 集成

enforcer 自动与 pre-tool-use hook 集成：

```typescript
import { processHook } from '@liangjie559567/ultrapower';

const hookInput = {
  toolName: 'Task',
  toolInput: {
    description: 'Test',
    prompt: 'Test',
    subagent_type: 'executor'
  }
};

const result = await processHook('pre-tool-use', hookInput);
console.log(result.modifiedInput.model); // 'sonnet'
```

## Agent 模型映射

| Agent 类型 | 默认模型 | 使用场景 |
|------------|---------------|----------|
| `architect` | opus | 复杂分析、调试 |
| `architect-medium` | sonnet | 标准分析 |
| `architect-low` | haiku | 快速问答 |
| `executor` | sonnet | 标准实现 |
| `executor-high` | opus | 复杂重构 |
| `executor-low` | haiku | 简单修改 |
| `explore` | haiku | 快速代码搜索 |
| `designer` | sonnet | UI 实现 |
| `designer-high` | opus | 复杂 UI 架构 |
| `designer-low` | haiku | 简单样式 |
| `document-specialist` | sonnet | 文档查找 |
| `writer` | haiku | 文档编写 |
| `vision` | sonnet | 图像分析 |
| `planner` | opus | 战略规划 |
| `critic` | opus | 计划审查 |
| `analyst` | opus | 预规划分析 |
| `qa-tester` | sonnet | CLI 测试 |
| `scientist` | sonnet | 数据分析 |
| `scientist-high` | opus | 复杂研究 |

## 调试模式

启用调试日志以查看模型何时被自动注入：

```bash
export OMC_DEBUG=true
```

启用后，您将看到如下警告：

```
[OMC] Auto-injecting model: sonnet for executor
```

**重要：** 警告**仅**在 `OMC_DEBUG=true` 时显示。没有此标志时，强制注入会静默进行。

## 使用示例

### 之前（手动）

```typescript
// 每次委托都需要明确指定模型
Task(
  subagent_type="ultrapower:executor",
  model="sonnet",
  prompt="Implement X"
)

Task(
  subagent_type="ultrapower:executor-low",
  model="haiku",
  prompt="Quick lookup"
)
```

### 之后（自动）

```typescript
// 模型从定义中自动注入
Task(
  subagent_type="ultrapower:executor",
  prompt="Implement X"
)

Task(
  subagent_type="ultrapower:executor-low",
  prompt="Quick lookup"
)
```

### 需要时覆盖

```typescript
// 对简单的 executor 任务使用 haiku
Task(
  subagent_type="ultrapower:executor",
  model="haiku",  // 覆盖默认的 sonnet
  prompt="Find definition of X"
)
```

## 实现细节

### Hook 集成

enforcer 在 `pre-tool-use` hook 中运行：

1. Hook 接收工具调用
2. 检查工具是否为 `Task` 或 `Agent`
3. 检查 `model` 参数是否缺失
4. 查找 agent 定义
5. 注入默认模型
6. 返回修改后的输入

### 错误处理

- 未知 agent 类型会抛出错误
- 没有默认模型的 agent 会抛出错误
- 无效的输入结构会原样传递
- 非 agent 工具会被忽略

### 性能

- O(1) 查找：直接哈希映射查找 agent 定义
- 无异步操作：同步强制注入
- 最小开销：仅适用于 Task/Agent 调用

## 测试

运行测试：

```bash
npm test -- delegation-enforcer
```

运行演示：

```bash
npx tsx examples/delegation-enforcer-demo.ts
```

## 优势

1. **代码更简洁**：无需每次手动指定模型
2. **一致性**：始终为每个 agent 使用正确的模型层级
3. **安全性**：显式模型始终被保留
4. **透明度**：调试模式显示模型何时被注入
5. **零配置**：与现有 agent 定义自动协作

## 迁移

无需迁移！enforcer 向后兼容：

- 带有显式模型的现有代码继续正常工作
- 新代码可以省略 model 参数
- 无破坏性变更

## 相关

- [Agent Definitions](./AGENTS.md) - 完整 agent 参考
- [Features Reference](./FEATURES.md) - 模型路由和委托类别
