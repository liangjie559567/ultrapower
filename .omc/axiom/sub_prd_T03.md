---
task_id: T-03
feature: 用户插件部署 自动更新版本流程
status: pending
estimated: M (2-4h)
depends_on: [T-01]
blocks: [T-08]
---

# T-03 — 修改 performUpdate() plugin 分支

## 目标

修改 `src/features/auto-update.ts` 中 `performUpdate()` 的 plugin 模式分支（第 486-493 行），将"直接返回错误"改为"引导流程"。

## 当前代码（第 486-493 行）

```typescript
if (isRunningAsPlugin() && !options?.standalone) {
  return {
    success: false,
    previousVersion,
    newVersion: 'unknown',
    message: 'Running as a Claude Code plugin. Use "/plugin install ultrapower" to update, or pass --standalone to force npm update.',
  };
}
```

## 目标代码（伪代码）

```typescript
if (isRunningAsPlugin() && !options?.standalone) {
  // project-scoped: 提示切换目录
  if (isProjectScopedPlugin()) {
    return {
      success: true,
      previousVersion,
      newVersion: 'unknown',
      message: 'Project-scoped plugin detected.\nTo update, navigate to your project directory and run:\n  /plugin install ultrapower',
    };
  }

  // 获取最新版本（用于显示）
  let latestVersion = 'unknown';
  try {
    const release = await fetchLatestRelease();
    latestVersion = release.tag_name.replace(/^v/, '');
  } catch { /* ignore, best-effort */ }

  // [1/2] 同步 marketplace clone
  process.stdout.write('[1/2] Syncing marketplace... ');
  const syncResult = syncMarketplaceClone(options?.verbose ?? false);
  if (!syncResult.ok) {
    process.stdout.write('⚠\n');
    // 即使同步失败，仍继续引导（不阻断流程）
  } else {
    process.stdout.write('✓\n');
    // 同步成功后更新注册表
    const { syncPluginRegistry } = await import('../lib/plugin-registry');
    syncPluginRegistry({ newVersion: latestVersion, skipIfProjectScoped: false });
  }

  // [2/2] 引导用户
  const versionHint = latestVersion !== 'unknown'
    ? ` (current: v${previousVersion ?? 'unknown'} → available: v${latestVersion})`
    : '';
  const guidanceMessage = [
    `[2/2] → Action required: run /plugin install ultrapower to complete update${versionHint}`,
    '',
    '  Or pass --standalone to force npm global update.',
  ].join('\n');

  return {
    success: true,
    previousVersion,
    newVersion: latestVersion,
    message: guidanceMessage,
  };
}
```

## 注意事项

1. `syncMarketplaceClone` 是模块内私有函数（非 export），可直接调用
2. `syncPluginRegistry` 使用动态 import 避免循环依赖（或在文件顶部 import，需确认无循环）
3. `fetchLatestRelease` 已在文件内定义，可直接调用
4. 返回 `success: true`（不再是 false），退出码为 0

## 验收标准

* [ ] plugin 模式下 `/update` 退出码为 0

* [ ] 输出包含 `[1/2]`、`[2/2]`、`→` 格式

* [ ] project-scoped 时输出包含"navigate to your project directory"

* [ ] `--standalone` 标志仍走原有 npm 更新路径（不受影响）

* [ ] TypeScript 编译无错误
