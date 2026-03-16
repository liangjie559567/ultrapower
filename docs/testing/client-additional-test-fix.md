# client-additional.test.ts 修复报告

**日期**: 2026-03-16
**文件**: `src/tools/lsp/__tests__/client-additional.test.ts`
**状态**: ✅ 完全修复（12/12 测试通过）

## 问题描述

- 8个测试超时（15秒）
- 1个未处理的错误：`LSP request 'initialize' timed out after 15000ms`

## 根本原因

与 `client-timer-buffer.test.ts` 相同：
1. `vi.useFakeTimers()` 阻止 EventEmitter 异步操作
2. 响应在监听器注册前同步发送

## 修复方案

### 1. 移除 Fake Timers

```typescript
beforeEach(() => {
  // 移除: vi.useFakeTimers();
  stdoutEmitter = new EventEmitter();
  // ...
});

afterEach(() => {
  // 移除: vi.useRealTimers();
  vi.restoreAllMocks();
});
```

### 2. 添加辅助函数

```typescript
function sendInitResponse(id: number = 1) {
  process.nextTick(() => {
    const initResponse = { jsonrpc: '2.0', id, result: { capabilities: {} } };
    const initMessage = `Content-Length: ${Buffer.byteLength(JSON.stringify(initResponse))}\r\n\r\n${JSON.stringify(initResponse)}`;
    stdoutEmitter.emit('data', Buffer.from(initMessage));
  });
}
```

### 3. 批量替换测试

将所有同步响应发送改为使用 `sendInitResponse()` 或 `process.nextTick()`。

## 测试结果

```
✅ Test Files  1 passed (1)
✅ Tests       12 passed (12)
   Duration    298ms
```

## 影响

- **修复测试数**: 12 个
- **消除未处理错误**: 1 个
- **总体进展**: 失败测试从 50 → 24（-26）

