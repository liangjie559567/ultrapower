---
task: T-03
title: Agent 追踪器
depends: [T-01, T-02]
---

# T-03: Agent 追踪器

## 目标
创建 `src/hooks/observability/agent-tracker.ts`，记录 agent run 生命周期。

## 接口

```typescript
export interface AgentRunRecord {
  id: string;
  session_id: string;
  parent_run_id?: string;
  agent_type: string;
  model: string;
  start_time: number;
  end_time?: number;
  duration_ms?: number;
  status: 'running' | 'completed' | 'failed';
}

export class AgentTracker {
  startRun(opts: Omit<AgentRunRecord, 'id' | 'start_time' | 'status'>): string; // returns id
  endRun(id: string, status?: 'completed' | 'failed'): void;
}
```

## 实现要点
- `startRun` 生成 `crypto.randomUUID()` 作为 id，enqueue 到 WriteQueue
- `endRun` 用 `db.prepare('UPDATE agent_runs SET ...')` 直接同步更新（end 时数据已存在）
- 导出单例 `agentTracker`

## 验收
- startRun 返回 id，DB 中有对应 running 记录
- endRun 后 status=completed，duration_ms 已计算
