---
name: trace
description: 显示 agent 流程追踪时间线和摘要
---

# Agent 流程追踪

[TRACE MODE ACTIVATED]

## 目标

显示流程追踪，展示本 session 中 hook、关键词、skill、agent 和工具的交互情况。

## 说明

1. **使用 `trace_timeline` MCP 工具**显示按时间顺序排列的事件时间线
   - 不带参数调用以显示最新 session
   - 使用 `filter` 参数聚焦特定事件类型（hooks、skills、agents、keywords、tools、modes）
   - 使用 `last` 参数限制输出数量

2. **使用 `trace_summary` MCP 工具**显示聚合统计
   - Hook 触发次数
   - 检测到的关键词
   - 激活的 skill
   - 模式转换
   - 工具性能和瓶颈

## 输出格式

先展示时间线，再展示摘要。重点标注：
- **模式转换**（执行模式如何变化）
- **瓶颈**（慢速工具或 agent）
- **流程模式**（关键词 -> skill -> agent 链）

---

## `--observe` 子命令

当用户运行 `/trace --observe` 或提到"观测"、"observability"时，切换到可观测性模式：

### 说明

使用 `queryEngine` 从 `~/.claude/.omc/observability.db` 查询数据并展示：

```typescript
import { queryEngine } from 'src/hooks/observability/query-engine.js';

const agentRuns  = queryEngine.getAgentRuns({ last: 10 });
const toolCalls  = queryEngine.getToolCalls({ last: 10 });
const costSummary = queryEngine.getCostSummary();
```

### 输出格式

```markdown
# Agent 可观测性报告

## Agent 运行摘要（最近10条）
| agent_type | count | avg_ms | total_ms |
|------------|-------|--------|----------|
| executor   | 5     | 1200   | 6000     |

## 工具调用分析（最近10条）
| tool_name | count | avg_ms | p95_ms | failure_rate |
|-----------|-------|--------|--------|--------------|
| Bash      | 20    | 350    | 800    | 0.05         |

## 成本摘要
| model  | total_cost_usd | input_tokens | output_tokens |
|--------|----------------|--------------|---------------|
| sonnet | 0.0123         | 4100         | 1200          |
```

若数据库不存在或无数据，输出：`（暂无可观测性数据，请确认 observability hooks 已启用）`
