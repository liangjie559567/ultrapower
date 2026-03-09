---
task_id: T-02
feature: 用户插件部署 自动更新版本流程
status: pending
estimated: M (2-4h)
depends_on: [T-01]
blocks: [T-08]
---

# T-02 — 单元测试 plugin-registry.test.ts

## 目标

为 `src/lib/plugin-registry.ts` 编写完整单元测试，覆盖所有关键路径。

## 测试文件位置

`src/features/__tests__/plugin-registry.test.ts`

## 测试用例清单

### syncPluginRegistry

```
1. 正常更新：文件存在，key 精确匹配 "ultrapower@ultrapower"
   - 验证 version 更新为 newVersion
   - 验证 lastUpdated 更新
   - 验证 installPath 未被修改
   - 验证 atomicWriteJsonSync 被调用一次

1. 文件不存在：返回 { success: true, skipped: true }
   - 不调用 atomicWriteJsonSync

1. key 不存在：返回 { success: false, errors: ['Entry not found'] }
   - 不调用 atomicWriteJsonSync

1. 幂等性：连续调用两次，第二次 previousVersion === newVersion
   - 文件内容不变（version 相同时仍写入，lastUpdated 更新）

1. skipIfProjectScoped=true：返回 { success: true, skipped: true }
   - 不读取文件，不调用 atomicWriteJsonSync

1. 不匹配 fork key：registry 中有 "ultrapower-fork@someuser"
   - 不更新该条目，返回 { success: false, errors: ['Entry not found'] }

1. atomicWriteJsonSync 抛出异常：返回 { success: false, errors: [...] }
```

### checkVersionConsistency

```
1. 三源一致：返回 { consistent: true, discrepancies: [] }

1. registryVersion 落后：
   - discrepancies 包含描述
   - fixCommand 非空

1. versionMetadataVersion 为 null（文件不存在）：
    - consistent: false
    - versionMetadataVersion: null

1. isUpdating: true 时：
    - 跳过漂移检测，返回 { isUpdating: true }
```

### getInstalledPluginEntry（内部函数，通过 syncPluginRegistry 间接测试）

```
1. 多条目数组：返回第 0 项
2. 空数组：返回 null
```

## Mock 策略

```typescript
// mock atomicWriteJsonSync
vi.mock('../../lib/atomic-write', () => ({
  atomicWriteJsonSync: vi.fn(),
  safeReadJson: vi.fn(),
}));

// mock fs.readFileSync for installed_plugins.json
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return { ...actual, readFileSync: vi.fn() };
});
```

## 验收标准

* [ ] 所有 13 个测试用例通过

* [ ] 覆盖率：`plugin-registry.ts` 行覆盖率 ≥ 90%

* [ ] `npm test` 无新增失败
