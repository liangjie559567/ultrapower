---
task: T-05
title: 成本估算器
depends: [T-01, T-02]
---

# T-05: 成本估算器

## 目标
创建 `src/hooks/observability/cost-estimator.ts`，记录 token 消耗并估算成本。

## 接口

```typescript
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_write_tokens?: number;
  cache_read_tokens?: number;
}

export class CostEstimator {
  record(opts: { session_id: string; agent_run_id?: string; model: string; usage: TokenUsage }): void;
  estimateCost(model: string, usage: TokenUsage): number; // USD
}
export const costEstimator: CostEstimator;
```

## 定价（硬编码 fallback，优先走 tokscale-adapter.ts）

| 模型 | input $/1M | output $/1M | cache_write $/1M | cache_read $/1M |
|------|-----------|------------|-----------------|----------------|
| claude-haiku-4-5 | 0.80 | 4.00 | 1.00 | 0.08 |
| claude-sonnet-4-6 | 3.00 | 15.00 | 3.75 | 0.30 |
| claude-opus-4-6 | 15.00 | 75.00 | 18.75 | 1.50 |

## 实现要点
- `record` 调用 `estimateCost` 计算 cost_usd，enqueue INSERT 到 WriteQueue
- 模型名称做前缀匹配（含 "haiku"/"sonnet"/"opus"）

## 验收
- estimateCost 对 haiku/sonnet/opus 返回正确值
- record 后 DB 有四维 token 记录
