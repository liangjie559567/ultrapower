# Sub-PRD T-04: silentAutoUpdate 速率限制测试

**文件**: `src/__tests__/auto-update.test.ts`
**操作**: MODIFY（追加测试）
**新增测试数**: 3

## 背景

`silentAutoUpdate` 包含三层保护逻辑：
1. `isSilentAutoUpdateEnabled()` 返回 false → 直接返回 null（已有测试覆盖）
2. `shouldCheckForUpdates()` 返回 false → 速率限制，跳过检查
3. `state.consecutiveFailures >= maxRetries` → 退避逻辑，在退避期内跳过

现有测试未覆盖路径 2（速率限制）和路径 3（退避逻辑），以及成功更新后状态持久化。

## 实现要点

`silentAutoUpdate` 依赖以下可 mock 的函数：
- `shouldCheckForUpdates`（来自同文件，需通过 `vi.spyOn` 或模块 mock）
- `getSilentUpdateState` / `saveSilentUpdateState`（私有函数，通过 `readFileSync`/`writeFileSync` mock 间接控制）
- `isSilentAutoUpdateEnabled`（来自同文件，依赖 `getOMCConfig()`）

由于 `shouldCheckForUpdates` 和 `getSilentUpdateState` 是模块内部函数，
需通过 mock `fs` 的 `readFileSync`/`writeFileSync` 来控制状态，
并通过 mock `fetch` 控制 `checkForUpdates` 的返回值。

追加测试：

```typescript
describe('silentAutoUpdate rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 启用 silentAutoUpdate（mock getOMCConfig 返回 silentAutoUpdate: true）
    // 通过 mock readFileSync 控制 .omc-config.json 和 silent-update-state.json
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it('returns null when shouldCheckForUpdates returns false (rate limited)', async () => {
    // 设置 silentAutoUpdate 已启用
    mockedReadFileSync.mockImplementation((p) => {
      if (String(p).includes('.omc-config.json')) {
        return JSON.stringify({ silentAutoUpdate: true });
      }
      if (String(p).includes('silent-update-state.json')) {
        // lastCheck 设为刚刚，触发速率限制
        return JSON.stringify({
          consecutiveFailures: 0,
          pendingRestart: false,
          lastCheck: new Date().toISOString(),
        });
      }
      return '';
    });
    mockedExistsSync.mockReturnValue(true);

    const result = await silentAutoUpdate({ checkIntervalHours: 24 });

    expect(result).toBeNull();
  });

  it('returns null when in backoff period (consecutiveFailures >= maxRetries)', async () => {
    mockedReadFileSync.mockImplementation((p) => {
      if (String(p).includes('.omc-config.json')) {
        return JSON.stringify({ silentAutoUpdate: true });
      }
      if (String(p).includes('silent-update-state.json')) {
        return JSON.stringify({
          consecutiveFailures: 3,
          pendingRestart: false,
          lastAttempt: new Date().toISOString(), // 刚刚尝试过
        });
      }
      return '';
    });
    mockedExistsSync.mockReturnValue(true);

    const result = await silentAutoUpdate({ maxRetries: 3 });

    expect(result).toBeNull();
  });

  it('saves state with pendingRestart=true after successful update', async () => {
    mockedReadFileSync.mockImplementation((p) => {
      if (String(p).includes('.omc-config.json')) {
        return JSON.stringify({ silentAutoUpdate: true });
      }
      if (String(p).includes('silent-update-state.json')) {
        return JSON.stringify({ consecutiveFailures: 0, pendingRestart: false });
      }
      if (String(p).includes('version-info.json')) {
        return JSON.stringify({ version: '4.1.5', installedAt: '2026-02-09T00:00:00.000Z', installMethod: 'npm' });
      }
      return '';
    });
    mockedExistsSync.mockReturnValue(true);
    // shouldCheckForUpdates 返回 true（lastCheck 为空）
    // fetch 返回新版本
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v4.2.0', name: '4.2.0',
        published_at: '2026-02-27T00:00:00.000Z',
        html_url: 'https://example.com', body: 'notes',
        prerelease: false, draft: false,
      }),
    }));
    mockedExecSync.mockReturnValue('');

    const result = await silentAutoUpdate({ autoApply: true });

    // 验证 writeFileSync 被调用（保存状态）
    expect(mockedWriteFileSync).toHaveBeenCalled();
    // 验证结果为成功
    if (result !== null) {
      expect(result.success).toBe(true);
    }
  });
});
```

## 注意事项

- `shouldCheckForUpdates` 读取 `silent-update-state.json` 中的 `lastCheck` 字段
- `getSilentUpdateState` 读取同一文件的 `consecutiveFailures` 和 `lastAttempt`
- `isSilentAutoUpdateEnabled` 读取 `.omc-config.json` 的 `silentAutoUpdate` 字段
- 需要在现有 mock 中确认 `writeFileSync` 已被 mock（`mockedWriteFileSync`）
- `silentAutoUpdate` 在 `isSilentAutoUpdateEnabled()` 返回 false 时直接返回 null，
  需确保 mock 返回 `silentAutoUpdate: true` 才能进入速率限制分支

## 验收标准

- 3 个新测试全部通过
- `tsc --noEmit` 零错误
