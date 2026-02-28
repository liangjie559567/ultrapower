# Sub-PRD T-02: syncMarketplaceClone 4 分支测试

**文件**: `src/__tests__/auto-update.test.ts`
**操作**: MODIFY（追加测试）
**新增测试数**: 4

## 背景

`syncMarketplaceClone` 是 `auto-update.ts` 中的私有函数，通过 `performUpdate` 间接调用。需要通过 mock `existsSync` 和 `execSync` 覆盖 4 个分支：
1. marketplace 目录不存在 → 跳过，返回 `{ ok: true }`
2. git fetch 失败 → 返回 `{ ok: false }`
3. git pull 失败 → 返回 `{ ok: false }`
4. 成功 → 调用 `syncPluginRegistry`

## 实现要点

`syncMarketplaceClone` 是私有函数，无法直接测试。通过 `performUpdate` 的插件模式路径间接触发（`isRunningAsPlugin() = true`），观察其行为。

在现有 `describe('auto-update reconciliation')` 块后追加新的 `describe('syncMarketplaceClone')` 块：

```typescript
describe('syncMarketplaceClone via performUpdate plugin mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 设置为插件模式
    mockedIsProjectScopedPlugin.mockReturnValue(false);
    // mock fetch 返回版本信息
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tag_name: 'v4.1.5', name: '4.1.5',
        published_at: '2026-02-09T00:00:00.000Z',
        html_url: 'https://example.com', body: 'notes',
        prerelease: false, draft: false }),
    }));
  });

  it('skips marketplace sync when directory does not exist', async () => {
    // existsSync 对 marketplaces/omc 返回 false
    mockedExistsSync.mockReturnValue(false);
    // isRunningAsPlugin = true 触发插件模式路径
    // 通过 process.stdout.write 验证输出
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    // 需要 mock isRunningAsPlugin
    // ...
    writeSpy.mockRestore();
  });

  it('marketplace sync: fetch failure returns ok:false', async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedExecSync.mockImplementationOnce(() => { throw new Error('fetch failed'); });
    // 验证 syncMarketplaceClone 返回 ok:false
  });

  it('marketplace sync: pull failure returns ok:false', async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedExecSync
      .mockReturnValueOnce('') // fetch 成功
      .mockReturnValueOnce('') // checkout 成功
      .mockImplementationOnce(() => { throw new Error('pull failed'); }); // pull 失败
  });

  it('marketplace sync: success calls syncPluginRegistry', async () => {
    mockedExistsSync.mockReturnValue(true);
    mockedExecSync.mockReturnValue('');
    mockedReadFileSync.mockReturnValue(JSON.stringify({ version: '4.1.5' }));
    // 验证 syncPluginRegistry 被调用
  });
});
```

## 注意事项

- `syncMarketplaceClone` 是模块内私有函数，需通过 `performUpdate` 间接测试
- 需要额外 mock `isRunningAsPlugin`（来自 `installer/index.js`）
- `execSync` 在 `syncMarketplaceClone` 中被调用 3 次（fetch、checkout、pull），需用 `mockReturnValueOnce` 精确控制

## 验收标准

- 4 个新测试全部通过
- `tsc --noEmit` 零错误
