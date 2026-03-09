---
task_id: T-01
feature: 用户插件部署 自动更新版本流程
status: pending
estimated: M (2-4h)
depends_on: []
blocks: [T-02, T-03, T-04, T-05, T-07]
---

# T-01 — 创建 src/lib/plugin-registry.ts

## 目标

创建独立模块 `src/lib/plugin-registry.ts`，实现三个函数：

* `syncPluginRegistry(options)` — 同步注册表版本

* `checkVersionConsistency()` — 检查三源版本一致性

* `getInstalledPluginEntry()` — 读取注册表条目（内部辅助函数）

## 约束

**禁止 import**：
```typescript
// IMPORTANT: This module must NOT import from auto-update.ts or installer/index.ts
// to prevent circular dependencies. See installer/index.ts lines 97-98 for context.
```

允许 import：

* `src/lib/atomic-write.ts`（`atomicWriteJsonSync`、`safeReadJson`）

* `src/lib/version.ts`（`getRuntimePackageVersion`）

* `src/lib/worktree-paths.ts`（路径工具）

* Node.js 内置模块（`path`、`fs`、`os`）

## 接口定义

```typescript
// ---- 数据结构 ----

interface PluginRegistryEntry {
  scope: 'user' | 'project';
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha?: string;
}

interface InstalledPluginsJson {
  version: 2;
  plugins: Record<string, PluginRegistryEntry[]>;
}

interface SyncOptions {
  newVersion: string;
  // installPath 不传入，不修改现有值
}

interface SyncResult {
  success: boolean;
  skipped?: boolean;       // project-scoped 或文件不存在时为 true
  previousVersion?: string;
  newVersion: string;
  registryPath: string;
  errors?: string[];
}

interface ConsistencyReport {
  consistent: boolean;
  packageJsonVersion: string;
  versionMetadataVersion: string | null;
  registryVersion: string | null;
  discrepancies: string[];
  fixCommand?: string;
  isUpdating?: boolean;
}
```

## 实现要点

### getInstalledPluginEntry()

```
1. 构建路径：path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json')
2. 使用 fs.readFileSync 同步读取（与调用链保持同步）
3. 文件不存在（ENOENT）→ 返回 null
4. 精确匹配：registry.plugins["ultrapower@ultrapower"]
5. 返回第一个条目（数组第 0 项）或 null
```

### syncPluginRegistry(options)

```
1. 检查 isProjectScopedPlugin() → 返回 { success: true, skipped: true }
   注意：isProjectScopedPlugin 来自 installer/index.ts，不能直接 import
   → 改为：检查环境变量 CLAUDE_PLUGIN_SCOPE === 'project' 或读取 .claude-plugin/plugin.json 的 scope 字段
   → 或：接受 options.isProjectScoped?: boolean 参数，由调用方传入
1. 调用 getInstalledPluginEntry()
2. 文件不存在 → 返回 { success: true, skipped: true }
3. 找不到 "ultrapower@ultrapower" 条目 → 返回 { success: false, errors: ['Entry not found'] }
4. 记录 previousVersion = entry.version
5. 更新 entry.version = options.newVersion
6. 更新 entry.lastUpdated = new Date().toISOString()
7. 使用 atomicWriteJsonSync 写回
8. 返回 SyncResult
```

**关于 isProjectScopedPlugin 的处理**：
由于不能 import installer/index.ts，`syncPluginRegistry` 接受可选参数 `skipIfProjectScoped?: boolean`，由调用方（auto-update.ts / installer/index.ts）在调用前判断并传入。

### checkVersionConsistency()

```
1. 读取 packageJsonVersion：
   - 从 __dirname 向上找到 package.json，fs.readFileSync 读取
   - 或使用 getRuntimePackageVersion()（来自 src/lib/version.ts）
1. 读取 versionMetadataVersion：
   - 路径：~/.claude/plugins/cache/ultrapower/ultrapower/{version}/version.json
   - 先读 registryVersion 确定 version 目录名，再读 version.json
   - 文件不存在 → null
1. 读取 registryVersion：
   - 调用 getInstalledPluginEntry()
   - 返回 entry?.version ?? null
1. 比较三源，生成 discrepancies 数组
2. 如有漂移，生成 fixCommand（根据 isRunningAsPlugin 判断）
   - 同样不能 import，fixCommand 固定为两个选项的提示
```

## 验收标准

* [ ] `syncPluginRegistry` 精确匹配 `"ultrapower@ultrapower"`，不匹配其他 key

* [ ] `syncPluginRegistry` 不修改 `installPath` 字段

* [ ] `syncPluginRegistry` 使用 `atomicWriteJsonSync`（同步）

* [ ] `syncPluginRegistry` 文件不存在时返回 `{ success: true, skipped: true }`

* [ ] `checkVersionConsistency` 每次从文件读取，不使用内存缓存

* [ ] 文件顶部有循环依赖防护注释

* [ ] TypeScript 编译无错误（`tsc --noEmit`）
