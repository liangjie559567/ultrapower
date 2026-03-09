---
task: T-02
title: 异步写入队列
depends: []
---

# T-02: 异步写入队列

## 目标

创建 `src/hooks/observability/write-queue.ts`，内存队列 + setImmediate 异步 flush，防止主线程阻塞。

## 接口

```typescript
export type WriteOp = { table: string; row: Record<string, unknown> };

export class WriteQueue {
  enqueue(op: WriteOp): void;
  flush(): void;        // 立即同步 flush（测试/关闭用）
  get pending(): number;
}
```

## 实现要点

* `enqueue` 将 op 推入内部数组，调度 `setImmediate(this._flush)`（幂等，已调度则跳过）

* `_flush` 用 `db.transaction` 批量 INSERT OR IGNORE

* `flush()` 公开方法供测试同步调用

## 验收

* enqueue 后 pending 增加

* flush 后 pending 归零，数据写入 DB
