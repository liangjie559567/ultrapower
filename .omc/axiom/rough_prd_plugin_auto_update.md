---
feature: 用户插件部署 自动更新版本流程
status: ROUGH_PRD
created: 2026-02-27
revised: 2026-02-27
author: axiom-review-aggregator
review_sources: [axiom-product-director, axiom-domain-expert, axiom-tech-lead, axiom-critic, axiom-ux-director]
diff_count: 29
critical_diffs: 7
---

# Rough PRD — 用户插件部署 自动更新版本流程

> 本文档由 ax-review 5专家并行评审后聚合生成，已解决所有 HIGH 级差异点。

---

## 1. 背景与问题陈述

### 1.1 现状

ultrapower 支持两种安装模式：

| 模式 | 安装命令 | 更新命令 |
| ------ | --------- | --------- |
| npm 全局安装 | `npm install -g @liangjie559567/ultrapower` | `/update` → `performUpdate()` |
| Claude Code 插件 | `/plugin install ultrapower` | `/plugin install ultrapower`（手动） |

### 1.2 核心痛点

**P1 — 插件模式更新被拒绝**
`performUpdate()` 检测到 `isRunningAsPlugin() === true` 时直接返回错误，提示用户手动操作。用户无法通过 `/update` 命令获得任何帮助。

**P2 — 注册表与版本元数据双轨漂移**（根因：两套写入路径互不感知）

* `saveVersionMetadata()` 写入 `~/.claude/plugins/cache/.../version.json`（npm 更新路径）

* `installed_plugins.json` 的 `version` 字段由 Claude Code 在 `/plugin install` 时写入

* 两者更新时机不同，导致版本号不一致（k-046 根因）

**P3 — syncMarketplaceClone 不更新注册表**（根因：职责分离但缺少协调）
`syncMarketplaceClone()` 只做 `git fetch/pull`，不更新 `installed_plugins.json`，导致 hook 加载路径漂移。

**P4 — 用户感知差**
更新通知不区分"可自动更新"和"需手动操作"，用户不知道该执行哪个命令。

### 1.3 目标用户

* 通过 `/plugin install ultrapower` 安装的 Claude Code 用户

* 希望保持 ultrapower 最新版本的用户

### 1.4 功能边界（评审后明确）

> **重要**：Claude Code 没有 programmatic plugin 更新 API，`/plugin install` 是用户交互命令，无法通过代码触发。

因此，plugin 模式下 `/update` 的职责边界是：

* **能做**：同步 marketplace clone、更新注册表版本记录、引导用户完成最后一步

* **不能做**：替代用户执行 `/plugin install`

`/update` 在 plugin 模式下是"准备 + 引导"命令，而非"自动完成"命令。这是技术约束，不是设计缺陷。

---

## 2. 需求规格

### 2.1 功能需求

#### FR-01: 插件模式更新引导（修订自 Draft）

**当前行为**：`performUpdate()` 在 plugin 模式下直接返回错误。

**目标行为**：

```
[1/2] Syncing marketplace... ✓
[2/2] Action required: run /plugin install ultrapower to complete update
      (current: v5.2.1 → available: v5.2.2)
```

具体步骤：
1. 调用 `syncMarketplaceClone()` 同步 marketplace clone
2. 调用 `syncPluginRegistry()` 更新注册表版本记录
3. 以"步骤 X/Y"格式输出进度，使用 `→` 符号标识"需要手动操作"中间态
4. 提示用户运行 `/plugin install ultrapower` 完成实际安装

**降级路径**：用户传入 `--standalone` 时走 npm 全局更新（现有行为保留）。

**验收标准**：

* [ ] plugin 模式下 `/update` 不再返回错误，改为引导流程

* [ ] 输出明确区分"已完成步骤"和"需要用户操作步骤"

* [ ] 更新后 `installed_plugins.json.version` 与 `package.json` 一致

* [ ] `installed_plugins.json.installPath` 不被修改（保留用户自定义路径）

#### FR-02: 注册表同步函数（修订自 Draft）

新增 `syncPluginRegistry(options: SyncOptions): SyncResult`：

```typescript
interface SyncOptions {
  newVersion: string;
  // installPath 不传入，不修改现有值（避免覆盖用户自定义路径）
}

interface SyncResult {
  success: boolean;
  skipped?: boolean;       // project-scoped 时为 true
  previousVersion?: string;
  newVersion: string;
  registryPath: string;
  errors?: string[];
}
```

**职责**：

* 读取 `~/.claude/plugins/installed_plugins.json`

* 匹配逻辑：精确匹配 `key === "ultrapower@ultrapower"`（不使用子字符串匹配，防止误匹配 fork）

* 仅更新 `version` 和 `lastUpdated` 字段（**不修改** `installPath`）

* 使用 `atomicWriteJsonSync`（同步版本，与调用链保持一致）

* `isProjectScopedPlugin() === true` 时直接返回 `{ success: true, skipped: true }`

* `installed_plugins.json` 不存在时静默返回 `{ success: true, skipped: true }`

**调用位置**（统一在 re-exec 子进程侧）：

* `reconcileUpdateRuntime()` 完成后（re-exec 侧，`OMC_UPDATE_RECONCILE === '1'` 分支）

* `syncMarketplaceClone()` 完成后（plugin 默认模式）

**禁止**：`plugin-registry.ts` 不得 import `auto-update.ts` 或 `installer/index.ts`（防止循环依赖）。

#### FR-03: 更新通知增强（修订自 Draft）

`formatUpdateNotification()` 根据安装模式显示不同指令（替换现有双命令并列展示）：

```
插件模式（仅显示）：  To update, run: /plugin install ultrapower
npm 模式（仅显示）：  To update, run: /update
```

不再并列展示两个命令，消除用户选择困难。

#### FR-04: 版本一致性检查（修订自 Draft）

新增 `checkVersionConsistency(): ConsistencyReport`：

```typescript
interface ConsistencyReport {
  consistent: boolean;
  packageJsonVersion: string;          // 从 package.json 文件读取（非内存缓存）
  versionMetadataVersion: string | null; // 从 ~/.claude/plugins/cache/.../version.json 读取
  registryVersion: string | null;      // 从 installed_plugins.json 读取
  discrepancies: string[];
  fixCommand?: string;                 // 检测到漂移时提供修复命令
  isUpdating?: boolean;                // 更新进行中时为 true，跳过漂移检测
}
```

**版本来源说明**（评审后明确）：

* `packageJsonVersion`：每次调用时从文件读取，不使用内存缓存

* `versionMetadataVersion`：从 `~/.claude/plugins/cache/ultrapower/ultrapower/{version}/version.json` 读取

* `registryVersion`：从 `installed_plugins.json` 中 `"ultrapower@ultrapower"` 条目读取

**omc-doctor 输出格式**：
```
[WARN] Version drift detected:
  installed_plugins.json: v5.1.0
  package.json:           v5.2.1
  Fix: run /update (npm mode) or /plugin install ultrapower (plugin mode)
```

### 2.2 非功能需求

* **原子性**：注册表更新使用 `atomicWriteJsonSync`（同步原子写入）

* **幂等性**：`syncPluginRegistry` 多次调用结果相同

* **向后兼容**：`installed_plugins.json` 不存在时静默跳过

* **Windows 兼容**：路径处理使用 `path.join`，不硬编码分隔符

* **无循环依赖**：`plugin-registry.ts` 对 `auto-update.ts` 和 `installer/index.ts` 零依赖

---

## 3. 技术方案

### 3.1 文件影响范围

| 文件 | 变更类型 | 说明 |
| ------ | --------- | ------ |
| `src/lib/plugin-registry.ts` | CREATE | 独立模块：`syncPluginRegistry()`、`checkVersionConsistency()`、`getInstalledPluginEntry()` |
| `src/features/auto-update.ts` | MODIFY | 修改 `performUpdate()` plugin 分支（引导流程）；增强 `formatUpdateNotification()`；`syncMarketplaceClone()` 后调用 `syncPluginRegistry()` |
| `src/installer/index.ts` | MODIFY | `reconcileUpdateRuntime()` 完成后调用 `syncPluginRegistry()`（re-exec 侧） |
| `src/features/__tests__/plugin-registry.test.ts` | CREATE | 单元测试 |

### 3.2 关键数据结构

```typescript
// installed_plugins.json 真实结构（Q-02 调查确认）
// 顶层：{ version: 2, plugins: Record<string, PluginRegistryEntry[]> }
// key 格式："pluginName@marketplaceName"，ultrapower 的 key 是 "ultrapower@ultrapower"
interface PluginRegistryEntry {
  scope: 'user' | 'project';
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha?: string;
}
```

### 3.3 执行流程（更新后）

```
/update 命令
  └─ performUpdate()
       ├─ isRunningAsPlugin() === false
       │    └─ npm install -g ... → re-exec（OMC_UPDATE_RECONCILE=1）
       │         └─ reconcileUpdateRuntime() → syncPluginRegistry({ newVersion }) ✓
       └─ isRunningAsPlugin() === true
            ├─ isProjectScopedPlugin() === true
            │    └─ 输出提示：cd 到项目目录运行 /plugin install ultrapower ✓
            ├─ --standalone 标志
            │    └─ npm install -g ... → re-exec → reconcileUpdateRuntime() → syncPluginRegistry() ✓
            └─ [默认] 无 programmatic API
                 ├─ [1/2] syncMarketplaceClone() → syncPluginRegistry({ newVersion }) ✓
                 └─ [2/2] → 提示用户运行 /plugin install ultrapower ✓
```

### 3.4 循环依赖防护

```
auto-update.ts  →  installer/index.ts  （已存在，第17行）
installer/index.ts  →  plugin-registry.ts  （新增）
plugin-registry.ts  →  [仅 src/lib/ 内部依赖]  （禁止反向 import）
```

`plugin-registry.ts` 文件顶部必须添加注释：
```typescript
// IMPORTANT: This module must NOT import from auto-update.ts or installer/index.ts
// to prevent circular dependencies. See installer/index.ts lines 97-98 for context.
```

---

## 4. 任务分解（修订后）

| ID | 任务 | 估时 | 依赖 | 说明 |
| ---- | ------ | ------ | ------ | ------ |
| T-01 | 创建 `src/lib/plugin-registry.ts`，实现 `syncPluginRegistry()` + `checkVersionConsistency()` + `getInstalledPluginEntry()` | M | - | 接口锁定后再启动 T-02~T-05 |
| T-02 | 为 `plugin-registry.ts` 编写单元测试（mock `installed_plugins.json`） | M | T-01（接口稳定后） | 覆盖：精确匹配、不存在文件、project-scoped、幂等性 |
| T-03 | 修改 `performUpdate()` plugin 分支，实现引导流程（步骤进度 + → 符号） | M | T-01 | |
| T-04 | 修改 `reconcileUpdateRuntime()` 完成后调用 `syncPluginRegistry()`（re-exec 侧） | S | T-01 | 使用 atomicWriteJsonSync |
| T-05 | 修改 `syncMarketplaceClone()` 完成后调用 `syncPluginRegistry()`（版本变化时） | S | T-01 | |
| T-06 | 增强 `formatUpdateNotification()` 区分 plugin/npm 模式，替换双命令并列 | S | - | 可与 T-01 并行 |
| T-07 | 在 `omc-doctor` 中集成 `checkVersionConsistency()`，输出修复命令 | S | T-01 | |
| T-08 | CI Gate：`tsc --noEmit && npm run build && npm test` | - | T-01~T-07 | |

**依赖链**：T-01 → {T-02, T-03, T-04, T-05, T-07} → T-08；T-06 可与 T-01 并行

---

## 5. 已解答问题

| ID | 结论 |
| ---- | ------ |
| Q-01 | Claude Code **无** programmatic plugin 更新 API。plugin 模式下只能 syncMarketplaceClone + 提示用户手动运行 `/plugin install ultrapower` |
| Q-02 | 真实 schema 已确认：key 为 `"ultrapower@ultrapower"`，无 `packageName` 字段，匹配逻辑改为精确匹配 `key === "ultrapower@ultrapower"` |
| Q-03 | project-scoped plugin 跳过注册表同步，`syncPluginRegistry()` 直接返回 `{ success: true, skipped: true }` |

---

## 6. 成功指标（修订后）

| 指标 | 可量化标准 |
| ------ | ----------- |
| plugin 模式 `/update` 不再报错 | 执行后退出码为 0，输出包含引导步骤 |
| 注册表版本同步 | `installed_plugins.json.version` === `package.json.version`（更新后） |
| 用户引导清晰 | 输出包含 `[1/2]`、`[2/2]`、`→` 格式的步骤提示 |
| omc-doctor 漂移检测 | 版本不一致时输出 `[WARN]` + `Fix:` 修复命令 |

---

## 7. 评审差异点汇总（ax-review 产出）

### HIGH 级（已全部解决）

| ID | 来源 | 问题 | 解决方案 |
| ---- | ------ | ------ | --------- |
| D-PD-02 / D-CR-01 / D-UX-01 | Product+Critic+UX | 成功指标"无需手动操作"与实际矛盾 | 重新定义功能边界（§1.4），修正成功指标（§6） |
| D-DM-04 / D-CR-02 | Domain+Critic | key 包含匹配太宽松 | 改为精确匹配 `key === "ultrapower@ultrapower"`（FR-02） |
| D-TC-05 | Tech | async/sync 不匹配 | 统一使用 `atomicWriteJsonSync`（FR-02） |
| D-TC-03 | Tech | 循环依赖风险 | 明确禁止反向 import，添加防护注释（§3.4） |
| D-TC-02 | Tech | re-exec 调用时序盲区 | 明确在 re-exec 子进程侧调用（§3.3） |

### MEDIUM 级（已纳入需求）

| ID | 来源 | 问题 | 处理方式 |
| ---- | ------ | ------ | --------- |
| D-DM-02 | Domain | syncMarketplaceClone 网络失败状态不一致 | T-05 实现时需处理失败回滚 |
| D-TC-01 | Tech | installPath 字段冗余 | SyncOptions 不含 installPath（FR-02 修订） |
| D-TC-04 | Tech | 任务依赖关系不完整 | 任务分解已补充依赖链（§4） |
| D-CR-04 | Critic | 三源可靠性未评估 | ConsistencyReport 明确每源读取方式（FR-04） |
| D-UX-03 | UX | 中间态无视觉区分 | 使用 `→` 符号标识中间态（FR-01） |
| D-UX-05 | UX | project-scoped 提示语缺失 | 执行流程中明确提示文案（§3.3） |

### LOW 级（已知风险，后续迭代）

| ID | 来源 | 问题 | 处理方式 |
| ---- | ------ | ------ | --------- |
| D-DM-03 | Domain | 多进程并发写入风险 | 当前场景单进程，记录为已知限制 |
| D-CR-03 | Critic | 写入失败无回滚策略 | atomicWriteJsonSync 保证原子性，失败时文件不变 |
| D-CR-05 | Critic | 漂移检测误报/漏报 | isUpdating 字段处理更新中间态（FR-04） |
| D-CR-06 | Critic | 多 worktree 全局注册表共享 | project-scoped 跳过逻辑已覆盖主要场景 |
| D-UX-06 | UX | omc-doctor 修复指引 | fixCommand 字段已加入 ConsistencyReport（FR-04） |
