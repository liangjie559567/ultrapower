# Sub-PRD T-01: release-steps.mjs 失败路径测试

**文件**: `src/__tests__/release-steps.test.ts`
**操作**: MODIFY（追加测试）
**新增测试数**: 3

## 背景

现有 6 个测试只覆盖 dry-run happy path。当 `execSync` 抛出异常时，各步骤应返回 `{ success: false, output: err.message }`，但此路径无测试覆盖。

## 实现要点

在现有 `describe` 块末尾追加新的 `describe('failure paths')` 块：

```typescript
describe('failure paths', () => {
  beforeEach(() => {
    // mock child_process.execSync 抛出
    vi.mock('child_process', () => ({
      execSync: vi.fn().mockImplementation(() => {
        throw new Error('command failed');
      }),
    }));
  });

  it('validateBuild: returns success:false when execSync throws', async () => {
    // @ts-ignore
    const { validateBuild } = await import('../../../scripts/release-steps.mjs');
    const result = await validateBuild({ dryRun: false });
    expect(result.success).toBe(false);
    expect(result.output).toContain('command failed');
  });

  it('publishNpm: returns success:false when execSync throws', async () => {
    // @ts-ignore
    const { publishNpm } = await import('../../../scripts/release-steps.mjs');
    const result = await publishNpm({ dryRun: false, version: '1.0.0' });
    expect(result.success).toBe(false);
  });

  it('runReleasePipeline: returns failed steps when validate fails', async () => {
    // @ts-ignore
    const { runReleasePipeline } = await import('../../../scripts/release-steps.mjs');
    const result = await runReleasePipeline({ dryRun: false });
    expect(result.success).toBe(false);
  });
});
```

## 注意事项

- `release-steps.mjs` 是 ESM `.mjs` 文件，每个 `import()` 前需加 `// @ts-ignore`（k-060）
- Vitest 中动态 import 的模块缓存问题：需要在 `beforeEach` 中用 `vi.resetModules()` 清除缓存，确保 mock 生效
- `runReleasePipeline` 内部调用 `process.exit(1)` 处理无效 `startFrom`，测试中不触发此路径

## 验收标准

- 3 个新测试全部通过
- `tsc --noEmit` 零错误
