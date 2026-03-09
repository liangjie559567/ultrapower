---
task_id: T-04
feature: 用户插件部署 自动更新版本流程
status: pending
estimated: S (<2h)
depends_on: [T-01]
blocks: [T-08]
---

# T-04 — 修改 reconcileUpdateRuntime()

## 目标

在 `src/installer/index.ts` 的 `reconcileUpdateRuntime()` 成功后调用 `syncPluginRegistry()`。

## 调用位置

`reconcileUpdateRuntime()` 在 re-exec 子进程侧执行（`OMC_UPDATE_RECONCILE === '1'` 时）。

当前代码结构（第 427-471 行）：
```typescript
export function reconcileUpdateRuntime(options?: { verbose?: boolean }): UpdateReconcileResult {
  // ... 安装逻辑 ...
  return { success: true, message: 'Runtime state reconciled successfully' };
}
```

## 修改方案

在 `return { success: true, ... }` 之前插入：

```typescript
// Sync plugin registry version after successful reconciliation
try {
  const { syncPluginRegistry } = require('../lib/plugin-registry') as typeof import('../lib/plugin-registry');
  const newVersion = getRuntimePackageVersion(); // 已在文件中 import
  syncPluginRegistry({
    newVersion,
    skipIfProjectScoped: projectScopedPlugin, // 已有此变量
  });
} catch {
  // Non-fatal: registry sync failure should not block reconciliation
}
```

## 注意事项

1. 使用 `require()` 而非 `import` 避免循环依赖（或确认 import 无循环后改用 import）
2. `getRuntimePackageVersion()` 已在 `installer/index.ts` 中使用，确认 import 路径
3. 失败时静默（catch 不 rethrow），不影响 reconcile 主流程
4. `projectScopedPlugin` 变量在函数内已定义（第 430 行）

## 验收标准

* [ ] npm 模式更新后，`installed_plugins.json.version` 与 `package.json.version` 一致

* [ ] reconcile 失败时不影响 syncPluginRegistry 调用（try/catch 隔离）

* [ ] TypeScript 编译无错误
