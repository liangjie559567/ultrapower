---
task_id: T-05
feature: 用户插件部署 自动更新版本流程
status: pending
estimated: S (<2h)
depends_on: [T-01]
blocks: [T-08]
---

# T-05 — 修改 syncMarketplaceClone()

## 目标

在 `src/features/auto-update.ts` 的 `syncMarketplaceClone()` 成功后，调用 `syncPluginRegistry()`（仅当版本有变化时）。

## 当前代码（第 33-59 行）

```typescript
function syncMarketplaceClone(verbose: boolean = false): { ok: boolean; message: string } {
  // ... git fetch/pull ...
  return { ok: true, message: 'Marketplace clone updated' };
}
```

## 修改方案

在 `return { ok: true, ... }` 之前插入：

```typescript
// After successful sync, update registry version if available
try {
  const { syncPluginRegistry } = require('./lib/plugin-registry') as typeof import('../lib/plugin-registry');
  // 从 marketplace clone 的 package.json 读取最新版本
  const marketplacePackageJson = join(marketplacePath, 'package.json');
  if (existsSync(marketplacePackageJson)) {
    const pkg = JSON.parse(readFileSync(marketplacePackageJson, 'utf-8')) as { version?: string };
    if (pkg.version) {
      syncPluginRegistry({ newVersion: pkg.version });
    }
  }
} catch {
  // Non-fatal: registry sync failure should not block marketplace sync
}
```

## 注意事项

1. `marketplacePath` 变量在函数内已定义（第 34 行）
2. 从 marketplace clone 的 `package.json` 读取版本，而非当前运行版本
3. 失败时静默，不影响主流程
4. 需要 import `readFileSync` from `fs`（检查文件顶部是否已有）

## 验收标准

* [ ] marketplace sync 成功后，`installed_plugins.json.version` 更新

* [ ] marketplace clone 不存在时（`ok: true, message: 'skipping'`），不调用 syncPluginRegistry

* [ ] sync 失败时（`ok: false`），不调用 syncPluginRegistry

* [ ] TypeScript 编译无错误
