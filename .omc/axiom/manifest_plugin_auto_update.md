---
feature: 用户插件部署 自动更新版本流程
status: MANIFEST
created: 2026-02-27
source_prd: rough_prd_plugin_auto_update.md
total_tasks: 8
critical_path: T-01 → T-03 → T-08
---

# Manifest — 用户插件部署 自动更新版本流程

## Impact Scope

| 文件 | 变更类型 | 任务 |
|------|---------|------|
| `src/lib/plugin-registry.ts` | CREATE | T-01 |
| `src/features/__tests__/plugin-registry.test.ts` | CREATE | T-02 |
| `src/features/auto-update.ts` | MODIFY | T-03, T-05, T-06 |
| `src/installer/index.ts` | MODIFY | T-04 |
| `src/features/doctor.ts` 或 omc-doctor 相关文件 | MODIFY | T-07 |

> Scope Gate：修改上述范围外的文件需用户确认。

## 任务 DAG

```
T-06 (formatUpdateNotification) ─────────────────────────────┐
                                                              ↓
T-01 (plugin-registry.ts) → T-02 (tests)                    T-08 (CI Gate)
                          → T-03 (performUpdate plugin 分支) → ↑
                          → T-04 (reconcileUpdateRuntime)    ↑
                          → T-05 (syncMarketplaceClone)      ↑
                          → T-07 (omc-doctor 集成)           ↑
```

**关键路径**：T-01 → T-03 → T-08

## 任务清单

| ID | 任务 | 估时 | 依赖 | 状态 |
|----|------|------|------|------|
| T-01 | 创建 `src/lib/plugin-registry.ts` | M | - | done |
| T-02 | 单元测试 `plugin-registry.test.ts` | M | T-01 | done |
| T-03 | 修改 `performUpdate()` plugin 分支 | M | T-01 | done |
| T-04 | 修改 `reconcileUpdateRuntime()` | S | T-01 | done |
| T-05 | 修改 `syncMarketplaceClone()` | S | T-01 | done |
| T-06 | 增强 `formatUpdateNotification()` | S | - | done |
| T-07 | omc-doctor 集成 `checkVersionConsistency()` | S | T-01 | done |
| T-08 | CI Gate | - | T-01~T-07 | done |

估时：S=小(<2h)，M=中(2-4h)
