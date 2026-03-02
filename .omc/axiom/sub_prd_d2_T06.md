---
task: T-06
title: 查询引擎
depends: [T-03, T-04, T-05]
---

# T-06: 查询引擎

## 目标
创建 `src/hooks/observability/query-engine.ts`，提供聚合查询接口。

## 接口

```typescript
export interface AgentRunSummary {
  agent_type: string; count: number; avg_ms: number; total_ms: number;
}
export interface ToolCallSummary {
  tool_name: string; count: number; avg_ms: number; p95_ms: number; failure_rate: number;
}
export interface CostSummary {
  model: string; total_cost_usd: number; total_input_tokens: number; total_output_tokens: number;
}

export class QueryEngine {
  getAgentRuns(opts: { session_id?: string; agent_type?: string; last?: number }): AgentRunSummary[];
  getToolCalls(opts: { session_id?: string; tool_name?: string; last?: number }): ToolCallSummary[];
  getCostSummary(opts: { session_id?: string }): CostSummary[];
}
export const queryEngine: QueryEngine;
```

## 实现要点
- P95 应用层计算：取最近 1000 条 `duration_ms`，排序后取第 950 条
- `last` 参数限制返回行数（`LIMIT ?`）
- 所有查询用 `db.prepare().all()`

## 验收
- getToolCalls 返回正确 p95_ms（可用测试数据验证）
- getCostSummary 按 model 分组汇总
