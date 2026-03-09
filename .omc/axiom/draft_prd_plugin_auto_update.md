---
feature: 用户插件部署 自动更新版本流程
status: DRAFT_REVISED
created: 2026-02-27
revised: 2026-02-27
author: axiom-product-designer
---

# Draft PRD — 用户插件部署 自动更新版本流程

## 1. 背景与问题陈述

### 1.1 现状

ultrapower 支持两种安装模式：

| 模式 | 安装命令 | 更新命令 |
| ------ | --------- | --------- |
| npm 全局安装 | `npm install -g @liangjie559567/ultrapower` | `/update` → `performUpdate()` |
| Claude Code 插件 | `/plugin install ultrapower` | `/plugin install ultrapower`（手动） |

### 1.2 核心痛点

**P1 — 插件模式更新被拒绝**
`performUpdate()` 检测到 `isRunningAsPlugin() === true` 时直接返回错误，提示用户手动操作。用户无法通过 `/update` 命令完成插件更新。

**P2 — 注册表与版本元数据双轨漂移**

* `saveVersionMetadata()` 写入 `~/.claude/plugins/cache/.../version.json`

* `installed_plugins.json` 的 `installPath` 和 `version` 字段独立维护

* 更新后两者可能不同步（k-046 根因）

**P3 — syncMarketplaceClone 不更新注册表**
`syncMarketplaceClone()` 只做 `git fetch/pull`，不更新 `installed_plugins.json`，导致 hook 加载路径漂移。

**P4 — 用户感知差**
更新通知（`formatUpdateNotification`）只显示版本号，不区分"可自动更新"和"需手动操作"，用户不知道该执行哪个命令。

### 1.3 目标用户

* 通过 `/plugin install ultrapower` 安装的 Claude Code 用户

* 希望保持 ultrapower 最新版本但不想手动操作的用户

---

## 2. 需求规格

### 2.1 功能需求

#### FR-01: 插件模式自动更新支持

**当前行为**：`performUpdate()` 在 plugin 模式下返回错误。

**目标行为**（基于 Q-01 调查结论）：

* Claude Code **没有** programmatic plugin 更新 API，无法通过代码触发 `/plugin install`

* plugin 模式下 `/update` 的正确行为：
  1. 调用 `syncMarketplaceClone()` 确保 marketplace clone 是最新的
  2. 调用 `syncPluginRegistry()` 更新注册表版本号
  3. 提示用户运行 `/plugin install ultrapower` 完成实际安装

* 可选降级路径：用户传入 `--standalone` 时走 npm 全局更新（现有行为保留）

**验收标准**：

* [ ] plugin 模式下 `/update` 不再返回错误

* [ ] 更新后 `installed_plugins.json.version` 与 `package.json` 一致

* [ ] 更新后 `installed_plugins.json.installPath` 指向正确路径

#### FR-02: 注册表同步函数

新增 `syncPluginRegistry(newVersion: string, installPath: string): SyncResult`：

```typescript
interface SyncResult {
  success: boolean;
  previousVersion?: string;
  newVersion: string;
  registryPath: string;
  errors?: string[];
}
```

**职责**（基于 Q-02 真实 schema 调查）：

* 读取 `~/.claude/plugins/installed_plugins.json`

* 真实 schema：key 格式为 `"pluginName@marketplaceName"`，ultrapower 的 key 是 `"ultrapower@ultrapower"`

* 匹配逻辑：遍历 `plugins` 对象，找到 key 包含 `"ultrapower"` 的条目

* 更新该条目的 `version` 和 `lastUpdated` 字段（**不修改** `installPath`，避免覆盖用户自定义路径）

* 原子写入（使用现有 `atomicWriteJson`）

* `isProjectScopedPlugin() === true` 时直接返回 `{ success: true, skipped: true }`（Q-03 结论）

**调用时机**：

* `performUpdate()` 成功后

* `reconcileUpdateRuntime()` 成功后

* `syncMarketplaceClone()` 成功后（可选，仅当版本变化时）

#### FR-03: 更新通知增强

`formatUpdateNotification()` 根据安装模式显示不同的更新指令：

```
插件模式：  To update, run: /update  (or: /plugin install ultrapower)
npm 模式：  To update, run: /update
```

#### FR-04: 版本一致性检查

新增 `checkVersionConsistency(): ConsistencyReport`：

```typescript
interface ConsistencyReport {
  consistent: boolean;
  packageJsonVersion: string;
  versionMetadataVersion: string | null;
  registryVersion: string | null;
  discrepancies: string[];
}
```

**用途**：`/omc-doctor` 调用，帮助用户诊断版本漂移问题。

### 2.2 非功能需求

* **原子性**：注册表更新必须使用 `atomicWriteJson`，防止写入中断导致文件损坏

* **幂等性**：`syncPluginRegistry` 多次调用结果相同

* **向后兼容**：`installed_plugins.json` 不存在时静默跳过（不报错）

* **Windows 兼容**：路径处理使用 `path.join`，不硬编码分隔符

---

## 3. 技术方案

### 3.1 文件影响范围

| 文件 | 变更类型 | 说明 |
| ------ | --------- | ------ |
| `src/features/auto-update.ts` | MODIFY | 添加 `syncPluginRegistry()`，修改 `performUpdate()` plugin 分支，增强 `formatUpdateNotification()` |
| `src/features/auto-update.ts` | MODIFY | `syncMarketplaceClone()` 完成后调用 `syncPluginRegistry()` |
| `src/installer/index.ts` | MODIFY | `reconcileUpdateRuntime()` 完成后调用 `syncPluginRegistry()` |
| `src/lib/plugin-registry.ts` | CREATE | 独立模块：`syncPluginRegistry()`、`checkVersionConsistency()`、`getInstalledPluginEntry()` |
| `src/features/__tests__/plugin-registry.test.ts` | CREATE | 单元测试 |

### 3.2 关键数据结构

```typescript
// installed_plugins.json 真实结构（Q-02 调查确认）
// 顶层：{ version: 2, plugins: Record<string, PluginRegistryEntry[]> }
// key 格式："pluginName@marketplaceName"，如 "ultrapower@ultrapower"
interface PluginRegistryEntry {
  scope: 'user' | 'project';
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha?: string;  // marketplace 插件有此字段，本地开发安装无
}
```

### 3.3 执行流程（更新后）

```
/update 命令
  └─ performUpdate()
       ├─ isRunningAsPlugin() === false
       │    └─ npm install -g ... → re-exec → reconcileUpdateRuntime() → syncPluginRegistry() ✓
       └─ isRunningAsPlugin() === true
            ├─ isProjectScopedPlugin() === true
            │    └─ 跳过注册表同步，提示用户在项目目录运行 /plugin install ✓
            ├─ --standalone 标志
            │    └─ npm install -g ... → reconcileUpdateRuntime() → syncPluginRegistry() ✓
            └─ [默认，Q-01 结论] 无 programmatic API
                 └─ syncMarketplaceClone() → syncPluginRegistry(version only) → 提示用户运行 /plugin install ultrapower ✓
```

---

## 4. 任务分解（初稿）

| ID | 任务 | 估时 | 依赖 |
| ---- | ------ | ------ | ------ |
| T-01 | 创建 `src/lib/plugin-registry.ts`，实现 `syncPluginRegistry()` + `checkVersionConsistency()` | M | - |
| T-02 | 为 `plugin-registry.ts` 编写单元测试（mock `installed_plugins.json`） | M | T-01 |
| T-03 | 修改 `performUpdate()` plugin 分支，支持自动更新 + 调用 `syncPluginRegistry()` | M | T-01 |
| T-04 | 修改 `reconcileUpdateRuntime()` 完成后调用 `syncPluginRegistry()` | S | T-01 |
| T-05 | 修改 `syncMarketplaceClone()` 完成后调用 `syncPluginRegistry()`（版本变化时） | S | T-01 |
| T-06 | 增强 `formatUpdateNotification()` 区分 plugin/npm 模式 | S | - |
| T-07 | 在 `omc-doctor` 中集成 `checkVersionConsistency()` | S | T-01 |
| T-08 | CI Gate：`tsc --noEmit && npm run build && npm test` | - | T-01~T-07 |

估时说明：S=小(<2h)，M=中(2-4h)

---

## 5. 已解答问题

| ID | 结论 |
| ---- | ------ |
| Q-01 | Claude Code **无** programmatic plugin 更新 API。plugin 模式下只能 syncMarketplaceClone + 提示用户手动运行 `/plugin install ultrapower` |
| Q-02 | 真实 schema 已确认：key 为 `"ultrapower@ultrapower"`，无 `packageName` 字段，匹配逻辑改为 key 包含 `"ultrapower"` |
| Q-03 | project-scoped plugin 跳过注册表同步，`syncPluginRegistry()` 直接返回 `{ success: true, skipped: true }` |

---

## 6. 成功指标

* 用户在 plugin 模式下执行 `/update` 后，版本自动更新，无需手动操作

* `omc-doctor` 能检测并报告版本漂移

* `installed_plugins.json` 在每次更新后保持与实际版本一致
