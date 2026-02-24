# 集成指南：委派分类

如何将委派分类集成到任务委派和编排中。

## 快速集成

### 1. 带分类的基本任务委派

```typescript
import { getCategoryForTask } from './features/delegation-categories';
import { TIER_MODELS } from './features/model-routing';

async function delegateTask(taskPrompt: string, category?: string) {
  // 解析分类（带自动检测回退）
  const resolved = getCategoryForTask({
    taskPrompt,
    explicitCategory: category as any,
  });

  console.log(`Delegating as ${resolved.category}:`);
  console.log(`  Model: ${TIER_MODELS[resolved.tier]}`);
  console.log(`  Temperature: ${resolved.temperature}`);
  console.log(`  Thinking: ${resolved.thinkingBudget}`);

  // 用分类指导增强提示词
  const finalPrompt = resolved.promptAppend
    ? `${taskPrompt}\n\n${resolved.promptAppend}`
    : taskPrompt;

  // 用分类配置委派给 agent
  return await delegateToAgent({
    prompt: finalPrompt,
    model: TIER_MODELS[resolved.tier],
    temperature: resolved.temperature,
    // 在 API 调用配置中添加 thinking budget
  });
}
```

### 2. 与现有模型路由集成

分类与现有基于 tier 的路由协同工作：

```typescript
import { routeTask } from './features/model-routing';
import { getCategoryForTask, getCategoryTier } from './features/delegation-categories';

async function smartDelegate(taskPrompt: string, options: {
  category?: string;
  agentType?: string;
}) {
  let tier;

  if (options.category) {
    // 使用分类系统
    const resolved = getCategoryForTask({
      taskPrompt,
      explicitCategory: options.category as any,
    });
    tier = resolved.tier;
    console.log(`Category ${resolved.category} -> Tier ${tier}`);
  } else {
    // 使用基于复杂度的路由
    const decision = routeTask({
      taskPrompt,
      agentType: options.agentType,
    });
    tier = decision.tier;
    console.log(`Auto-routed to tier ${tier}`);
  }

  // 两条路径都汇聚到基于 tier 的模型选择
  return await delegateWithTier(taskPrompt, tier);
}
```

### 3. 编排器集成

```typescript
import { getCategoryForTask, DelegationCategory } from './features/delegation-categories';

class Orchestrator {
  async analyzeAndDelegate(task: string): Promise<void> {
    // 检测分类
    const detected = getCategoryForTask({ taskPrompt: task });

    console.log(`Detected category: ${detected.category}`);

    // 根据分类路由
    switch (detected.category) {
      case 'visual-engineering':
        return this.delegateToDesigner(task, detected);

      case 'ultrabrain':
        return this.delegateToArchitect(task, detected);

      case 'quick':
        return this.delegateToExplorer(task, detected);

      case 'writing':
        return this.delegateToWriter(task, detected);

      default:
        return this.delegateToExecutor(task, detected);
    }
  }

  private async delegateToDesigner(task: string, config: ResolvedCategory) {
    return this.spawnAgent('designer', task, {
      tier: config.tier,
      temperature: config.temperature,
      guidance: config.promptAppend,
    });
  }

  // ... 其他委派方法
}
```

## 高级用法

### 分类感知的 Agent 选择

```typescript
import { DelegationCategory } from './features/delegation-categories';

const CATEGORY_TO_AGENT: Record<DelegationCategory, string> = {
  'visual-engineering': 'designer',
  'ultrabrain': 'architect',
  'artistry': 'designer', // 高创意
  'quick': 'explorer',
  'writing': 'writer',
  'unspecified-low': 'executor-low',
  'unspecified-high': 'executor',
};

function selectAgentForCategory(category: DelegationCategory): string {
  return CATEGORY_TO_AGENT[category];
}
```

### 温度覆盖

```typescript
import { resolveCategory } from './features/delegation-categories';

function delegateWithTemperatureOverride(
  taskPrompt: string,
  category: DelegationCategory,
  temperatureOverride?: number
) {
  const config = resolveCategory(category);

  const finalConfig = {
    ...config,
    temperature: temperatureOverride ?? config.temperature,
  };

  return delegateToAgent(taskPrompt, finalConfig);
}
```

### Thinking Budget 集成

```typescript
import { getCategoryThinkingBudgetTokens } from './features/delegation-categories';

async function delegateWithThinking(
  taskPrompt: string,
  category: DelegationCategory
) {
  const thinkingTokens = getCategoryThinkingBudgetTokens(category);

  // 在 API 调用中使用 thinking budget
  const response = await claudeAPI.call({
    prompt: taskPrompt,
    thinking: {
      type: 'enabled',
      budget: thinkingTokens,
    },
  });

  return response;
}
```

## 测试集成

```typescript
import { getCategoryForTask } from './features/delegation-categories';

describe('Category Integration', () => {
  it('should detect UI tasks as visual-engineering', () => {
    const result = getCategoryForTask({
      taskPrompt: 'Design a responsive dashboard with charts'
    });

    expect(result.category).toBe('visual-engineering');
    expect(result.tier).toBe('HIGH');
  });

  it('should support explicit category override', () => {
    const result = getCategoryForTask({
      taskPrompt: 'Simple task',
      explicitCategory: 'ultrabrain'
    });

    expect(result.category).toBe('ultrabrain');
    expect(result.tier).toBe('HIGH');
    expect(result.temperature).toBe(0.3);
  });

  it('should support backward-compatible tier specification', () => {
    const result = getCategoryForTask({
      taskPrompt: 'Any task',
      explicitTier: 'LOW'
    });

    expect(result.tier).toBe('LOW');
    expect(result.category).toBe('unspecified-low');
  });
});
```

## 迁移路径

### 从直接 Tier 指定迁移

**之前：**
```typescript
const decision = routeTask({ taskPrompt, explicitModel: 'opus' });
```

**之后（向后兼容）：**
```typescript
// 旧方式仍然有效
const decision = routeTask({ taskPrompt, explicitModel: 'opus' });

// 带分类的新方式
const config = getCategoryForTask({
  taskPrompt,
  explicitCategory: 'ultrabrain'  // 更具语义
});
```

### 从 Agent 特定路由迁移

**之前：**
```typescript
if (taskPrompt.includes('design')) {
  delegateTo('designer', taskPrompt);
} else if (taskPrompt.includes('debug')) {
  delegateTo('architect', taskPrompt);
}
```

**之后：**
```typescript
const detected = getCategoryForTask({ taskPrompt });

const agentMap = {
  'visual-engineering': 'designer',
  'ultrabrain': 'architect',
  'quick': 'explorer',
};

const agent = agentMap[detected.category] || 'executor';
delegateTo(agent, taskPrompt, detected);
```

## 最佳实践

1. **用分类表达语义**：当你知道工作的*类型*时（设计、调试、创意）
2. **用 Tier 表达复杂度**：当你知道*难度*级别时
3. **信任自动检测**：关键词匹配对常见模式是可靠的
4. **需要时覆盖**：显式分类/tier 始终优先
5. **增强提示词**：使用 `promptAppend` 提供分类特定指导
6. **监控成本**：HIGH tier 分类（ultrabrain、visual-engineering）使用 Opus

## 故障排除

### 未检测到分类

如果自动检测失败，系统默认为 `unspecified-high`。修复方法：

1. 在任务提示词中添加更多关键词
2. 使用显式分类指定
3. 在 `index.ts` 中扩展 `CATEGORY_KEYWORDS`

### 错误的 Tier 选择

如果分类映射到错误的 tier：

1. 检查 `CATEGORY_CONFIGS` 定义
2. 验证与显式 tier 的向后兼容性
3. 考虑是否需要新分类

### 温度过高/过低

如果分类默认值不合适，覆盖温度：

```typescript
const config = resolveCategory('artistry');
const customConfig = { ...config, temperature: 0.5 }; // 降低创意度
```

## 示例

参见 `test-categories.ts` 获取以下内容的完整示例：
- 基本解析
- 自动检测
- 显式控制
- 提示词增强
- 向后兼容性
