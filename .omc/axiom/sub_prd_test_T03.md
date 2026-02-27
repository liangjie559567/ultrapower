# Sub-PRD T-03: performUpdate 插件模式路径测试

**文件**: `src/__tests__/auto-update.test.ts`
**操作**: MODIFY（追加测试）
**新增测试数**: 3

## 背景

`performUpdate` 在 `isRunningAsPlugin() = true` 时走插件模式分支：
1. `isProjectScopedPlugin() = true` → 返回项目范围插件引导消息
2. `isRunningAsPlugin() = true, isProjectScopedPlugin() = false` → 同步 marketplace + 返回引导消息
3. marketplace sync 失败时 → 仍返回 success:true（非致命错误）

现有测试只覆盖非插件模式（`OMC_UPDATE_RECONCILE=1` 路径）。

## 实现要点

需要额外 mock `isRunningAsPlugin`（目前 `installer/index.js` mock 中未包含）。

在现有 mock 中添加 `isRunningAsPlugin`：
```typescript
vi.mock('../installer/index.js', async () => {
  const actual = await vi.importActual<...>('../installer/index.js');
  return {
    ...actual,
    install: vi.fn(),
    HOOKS_DIR: '/tmp/omc-test-hooks',
    isProjectScopedPlugin: vi.fn(),
    isRunningAsPlugin: vi.fn(),  // 新增
    checkNodeVersion: vi.fn(),
  };
});
```

追加测试：
```typescript
describe('performUpdate plugin mode', () => {
  const mockedIsRunningAsPlugin = vi.mocked(isRunningAsPlugin);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tag_name: 'v4.1.5', name: '4.1.5',
        published_at: '2026-02-09T00:00:00.000Z',
        html_url: 'https://example.com', body: 'notes',
        prerelease: false, draft: false }),
    }));
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue(JSON.stringify({
      version: '4.1.5', installedAt: '2026-02-09T00:00:00.000Z', installMethod: 'npm'
    }));
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it('returns guidance message for project-scoped plugin', async () => {
    mockedIsRunningAsPlugin.mockReturnValue(true);
    mockedIsProjectScopedPlugin.mockReturnValue(true);

    const result = await performUpdate({ verbose: false });

    expect(result.success).toBe(true);
    expect(result.message).toContain('/plugin install ultrapower');
    expect(result.newVersion).toBe('unknown');
  });

  it('returns guidance message for global plugin with marketplace sync', async () => {
    mockedIsRunningAsPlugin.mockReturnValue(true);
    mockedIsProjectScopedPlugin.mockReturnValue(false);
    mockedExecSync.mockReturnValue(''); // git commands succeed

    const result = await performUpdate({ verbose: false });

    expect(result.success).toBe(true);
    expect(result.message).toContain('/plugin install ultrapower');
  });

  it('returns success even when marketplace sync fails', async () => {
    mockedIsRunningAsPlugin.mockReturnValue(true);
    mockedIsProjectScopedPlugin.mockReturnValue(false);
    // marketplace 目录不存在，sync 跳过
    mockedExistsSync.mockImplementation((p) =>
      !String(p).includes('marketplaces')
    );

    const result = await performUpdate({ verbose: false });

    expect(result.success).toBe(true);
  });
});
```

## 注意事项

- `isRunningAsPlugin` 需加入 `installer/index.js` mock 并在 import 列表中引入
- `process.stdout.write` 在插件模式中被调用（`[1/2] Syncing...`），测试中可 spy 或忽略

## 验收标准

- 3 个新测试全部通过
- `tsc --noEmit` 零错误
