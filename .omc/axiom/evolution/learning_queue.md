# Learning Queue

## Pending

### [P1] MCP 超时配置模式
**来源：** Session 2026-03-09 CCG Bug 修复
**内容：** MCP 客户端超时需要小于 CLI 执行时间，建议配置 25s 超时
**应用场景：** 所有 MCP 工具配置
**置信度：** 已验证

### [P2] process.exit() 最佳实践
**来源：** Session 2026-03-09 omc-doctor 修复
**内容：** 正常退出必须使用 process.exit(0)，否则返回错误码 1
**应用场景：** 所有诊断脚本
**置信度：** 已验证

### [P0] Vitest 原生模块测试隔离
**来源：** Session 2026-03-10 测试修复（89→0 失败）
**内容：** 原生模块（better-sqlite3, @ast-grep/napi）在 threads 池中导致 Segmentation fault，必须使用 forks 池 + isolate: true
**应用场景：** 所有包含原生模块的测试套件
**置信度：** 已验证（100% 通过率）
**配置模式：**
```typescript
export default defineConfig({
  test: {
    pool: 'forks',
    isolate: true,
    maxConcurrency: 2,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

### [P0] 全局测试清理机制
**来源：** Session 2026-03-10 测试修复
**内容：** 使用全局 setup 文件统一清理 mock 和定时器，避免测试间污染
**应用场景：** 所有 Vitest 测试套件
**置信度：** 已验证
**实现模式：**
```typescript
// tests/setup.ts
beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
afterEach(() => {
  setImmediate(() => vi.clearAllTimers());
});
```

### [P1] Windows 文件锁清理策略
**来源：** Session 2026-03-10 测试修复
**内容：** Windows 平台文件句柄释放延迟，需要增加重试次数和延迟
**应用场景：** 临时文件清理测试
**置信度：** 已验证
**配置：** maxRetries: 10, retryDelay: 500ms
