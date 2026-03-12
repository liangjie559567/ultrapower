# T-001: 测试套件优化

**任务ID**: T-001
**里程碑**: M1
**优先级**: P0
**工期**: 3 天
**依赖**: None

## 目标

优化测试套件性能，实现快速测试 <5s，完整测试 <15s。

## 验收标准

1. 快速测试（`npm run test:quick`）< 5 秒
2. 完整测试（`npm test`）< 15 秒
3. 测试并行化配置完成
4. 覆盖率保持 >85%

## 实施方案

### 1. 配置测试分层

**vitest.config.ts**:
```typescript
export default defineConfig({
  test: {
    threads: true,
    maxThreads: 4,
    minThreads: 2,
    isolate: false, // 快速模式禁用隔离
  }
});
```

### 2. 添加快速测试脚本

**package.json**:
```json
{
  "scripts": {
    "test:quick": "vitest run --reporter=dot --changed",
    "test": "vitest run"
  }
}
```

### 3. 优化慢速测试

- 使用 `vi.mock()` 替代真实文件系统操作
- 缓存重复的测试数据
- 减少不必要的 setup/teardown

## 影响范围

- `vitest.config.ts`
- `package.json`
- `tests/**/*.test.ts`（优化慢速测试）

## 验证命令

```bash
time npm run test:quick  # 应 < 5s
time npm test            # 应 < 15s
npm run test:coverage    # 覆盖率 >85%
```
