---
task: T-04
title: 工具调用追踪器
depends: [T-01, T-02]
---

# T-04: 工具调用追踪器

## 目标

创建 `src/hooks/observability/tool-tracker.ts`，记录工具调用。

## 接口

```typescript
export class ToolTracker {
  startCall(opts: { session_id: string; tool_name: string; parent_run_id?: string }): string; // id
  endCall(id: string, success: boolean, error_msg?: string): void;
}
export const toolTracker: ToolTracker;
```

## 实现要点

* `startCall` 生成 UUID，enqueue INSERT 到 WriteQueue

* `endCall` 同步 UPDATE duration_ms、success、error_msg

## 验收

* startCall 返回 id，endCall 后 DB 有完整记录
