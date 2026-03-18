# 异常安全的资源清理 (K010)

## 核心原则

**确保资源在异常情况下也能正确清理**，防止资源泄漏、进程僵尸和状态不一致。

## 关键模式

### 1. Promise.allSettled 并行清理

```typescript
// ❌ 错误：一个失败导致其他清理跳过
async cleanup() {
  await this.closeConnection();  // 如果失败，下面不执行
  await this.killProcess();
  await this.clearCache();
}

// ✅ 正确：所有清理都会尝试
async cleanup() {
  const results = await Promise.allSettled([
    this.closeConnection(),
    this.killProcess(),
    this.clearCache()
  ]);

  const errors = results
    .filter(r => r.status === 'rejected')
    .map(r => (r as PromiseRejectedResult).reason);

  if (errors.length > 0) {
    console.error('Cleanup errors:', errors);
  }
}
```

### 2. try-finally 保证执行

```typescript
// ❌ 错误：异常时 connected 状态不更新
async disconnect() {
  if (!this.connected) return;

  await this.client.close();
  await this.killProcess();
  this.connected = false;  // 如果上面抛异常，这行不执行
}

// ✅ 正确：finally 保证状态更新
async disconnect() {
  if (!this.connected) return;

  try {
    await this.client.close();
    await this.killProcess();
  } finally {
    this.connected = false;  // 总是执行
    this.transport = null;
  }
}
```

### 3. 超时保护

```typescript
// ✅ 进程清理带超时
async killProcess(proc: ChildProcess) {
  proc.kill('SIGTERM');

  await Promise.race([
    new Promise<void>(resolve => proc.once('exit', () => resolve())),
    new Promise(resolve => setTimeout(() => {
      if (!proc.killed) proc.kill('SIGKILL');
      resolve(undefined);
    }, 5000))
  ]);
}
```

## 实际案例

### MCPClient.disconnect() 改进

**当前问题**：
- 行 87-118：使用 try-finally，但内部清理未使用 Promise.allSettled
- 如果 `client.close()` 失败，进程清理仍会执行（好）
- 但多个清理步骤未并行化

**改进建议**：
```typescript
async disconnect(): Promise<void> {
  if (!this.connected) return;

  try {
    const cleanupTasks = [];

    if (this.transport) {
      cleanupTasks.push(
        this.client.close().catch(err =>
          console.error('Client close error:', err)
        )
      );

      const proc = (this.transport as any)._process;
      if (proc && !proc.killed) {
        cleanupTasks.push(this.killProcess(proc));
      }
    }

    await Promise.allSettled(cleanupTasks);
  } finally {
    this.connected = false;
    this.transport = null;
    this.toolsCache = null;
  }
}

private async killProcess(proc: any): Promise<void> {
  proc.kill('SIGTERM');

  if (proc.exitCode !== null || proc.killed) return;

  await Promise.race([
    new Promise<void>(resolve => proc.once('exit', () => resolve())),
    new Promise(resolve => setTimeout(() => {
      if (!proc.killed) proc.kill('SIGKILL');
      resolve(undefined);
    }, 5000))
  ]);
}
```

### LSPClient.disconnect() 改进

**当前问题**：
- 行 244-266：清理步骤顺序执行
- 如果 `request('shutdown')` 超时，后续清理延迟

**改进建议**：
```typescript
async disconnect(): Promise<void> {
  if (!this.process) return;

  try {
    // 并行清理：LSP shutdown + 定时器清理
    await Promise.allSettled([
      Promise.race([
        this.request('shutdown', null).then(() => this.notify('exit', null)),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]),
      this.clearPendingRequests()
    ]);
  } finally {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.initialized = false;
    this.openDocuments.clear();
    this.diagnostics.clear();
  }
}

private async clearPendingRequests(): Promise<void> {
  for (const [, pending] of this.pendingRequests) {
    clearTimeout(pending.timeout);
    pending.reject(new Error('LSP client disconnected'));
  }
  this.pendingRequests.clear();
}
```

## 检查清单

清理方法必须满足：

- [ ] 使用 `try-finally` 保证状态重置
- [ ] 多个独立清理用 `Promise.allSettled`
- [ ] 进程终止有超时保护（SIGTERM → SIGKILL）
- [ ] 定时器/监听器在 finally 中清理
- [ ] 清理失败记录日志但不抛异常
- [ ] 幂等性：多次调用安全

## 适用场景

| 场景 | 优先级 | 说明 |
|------|--------|------|
| 进程管理 | P0 | 子进程、LSP server、MCP client |
| 网络连接 | P0 | Socket、HTTP client、WebSocket |
| 文件句柄 | P1 | 文件流、数据库连接 |
| 定时器/监听器 | P1 | setTimeout、EventEmitter |

## 参考

- 知识库: K010 (异常安全的资源清理)
- 相关文件: `src/mcp/client/MCPClient.ts:87-118`, `src/tools/lsp/client.ts:244-266`
