# client-timer-buffer.test.ts 修复报告

**日期**: 2026-03-16
**文件**: `src/tools/lsp/__tests__/client-timer-buffer.test.ts`
**状态**: ✅ 完全修复（8/8 测试通过）

## 问题描述

所有 8 个测试在运行时超时（30秒），无法完成。

## 根本原因

1. **Fake Timers 冲突**: `vi.useFakeTimers()` 阻止了 EventEmitter 的正常异步操作
2. **Mock 设计问题**: 自定义 `_emit` 方法无法与 LspClient 的事件监听器正确交互
3. **时序问题**: 响应在监听器注册前发送

## 修复方案

### 1. 移除 Fake Timers
```typescript
// 移除
vi.useFakeTimers();
vi.useRealTimers();

// 使用真实 timers
beforeEach(() => {
  // 不再调用 vi.useFakeTimers()
});
```

### 2. 使用标准 EventEmitter
```typescript
import { EventEmitter } from 'events';

let stdoutEmitter: EventEmitter;
let stderrEmitter: EventEmitter;
let processEmitter: EventEmitter;

beforeEach(() => {
  stdoutEmitter = new EventEmitter();
  stderrEmitter = new EventEmitter();
  processEmitter = new EventEmitter();

  mockProcess = Object.assign(processEmitter, {
    stdin: { write: vi.fn() },
    stdout: stdoutEmitter,
    stderr: stderrEmitter,
    kill: vi.fn(),
    pid: 99999,
  });
});
```

### 3. 修复 makeConnectedClient()
```typescript
async function makeConnectedClient(): Promise<LspClient> {
  const client = new LspClient('/workspace', FAKE_SERVER_CONFIG);
  const connectPromise = client.connect();

  // 使用 process.nextTick 确保监听器注册后再发送响应
  process.nextTick(() => {
    const initResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: { capabilities: {} },
    };
    const initMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(initResponse))}\r\n\r\n${JSON.stringify(initResponse)}`;
    stdoutEmitter.emit('data', Buffer.from(initMessage));
  });

  await connectPromise;
  return client;
}
```

### 4. 更新所有 mock 调用
```bash
# 批量替换
sed -i 's/mockProc\._emit('\''data'\'', \(.*\));/stdoutEmitter.emit('\''data'\'', \1);/g' client-timer-buffer.test.ts
```

### 5. 移除依赖 Fake Timers 的代码
```typescript
// 移除
vi.advanceTimersByTime(60_000);
```

## 测试结果

```
✅ Test Files  1 passed (1)
✅ Tests       8 passed (8)
   Duration    284ms
```

### 通过的测试
1. ✅ disconnect() clears pending timeouts - calls clearTimeout for each pending request
2. ✅ disconnect() rejects pending promises - pending promise is rejected with "LSP client disconnected"
3. ✅ disconnect() rejects pending promises - pending promise rejects before timeout fires
4. ✅ handleData() buffer cap - calls console.error and disconnect when buffer exceeds 64MB
5. ✅ handleData() buffer cap - does not append to buffer when limit is exceeded
6. ✅ handleData() normal data - does not call disconnect for small valid data
7. ✅ handleData() normal data - data well below 64MB is appended normally
8. ✅ disconnect() idempotency - second disconnect call does not throw

## 关键经验

1. **避免 Fake Timers 与 EventEmitter 混用**: Fake timers 会干扰异步事件流
2. **使用标准 Node.js API**: EventEmitter 比自定义 mock 更可靠
3. **正确处理异步时序**: 使用 `process.nextTick()` 确保监听器先注册
4. **参考成功案例**: `client-p1-scenarios.test.ts` 使用了正确的模式

## 影响

- **修复测试数**: 8 个
- **测试文件状态**: 从失败变为通过
- **总体进展**: 失败测试从 50 → 39（-11）
