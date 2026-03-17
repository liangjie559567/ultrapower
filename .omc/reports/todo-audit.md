# TODO 标记审计报告

**审计日期：** 2026-03-17
**总标记数：** 51 个
**真实待办项：** 1 个
**文档/功能性：** 50 个

---

## 分类结果

### 真实待办项（需处理）

1. **src/mcp/job-management.ts:865**
   ```typescript
   // TODO: _provider parameter reserved for future per-provider schema customization
   ```
   - 状态：低优先级
   - 建议：转为 GitHub issue
   - 工作量：2-4 小时

### 文档/功能性关键词（保留）

**功能性关键词（47 个）：**
- TODO LIST 系统（continuation-enforcement.ts）
- TODO CONTINUATION 提示（hooks.ts, installer.ts）
- TODO 检查器（quality-gate, verification）
- TODO 过滤器（comment-checker）

**文档性说明（3 个）：**
- HUD 集成计划（hud/progress-indicator.ts）
- Pre-compact TODO 摘要（hooks/pre-compact）

---

## 处理建议

### 立即处理（1 个）
1. src/mcp/job-management.ts:865 - 转为 issue #TBD

### 保留（50 个）
所有其他 TODO 均为系统功能或文档，不应删除。

---

## 修订后的目标

**原计划：** 清理 25 个过时 TODO
**实际情况：** 只有 1 个真实待办项

**新目标：**
- 将 1 个待办项转为 GitHub issue
- 验证所有 TODO 均有明确用途
- 更新计划：TODO 基线从 51 → 50（删除 1 个）

---

## 验收标准

- ✅ 1 个待办项已转为 issue
- ✅ 所有保留的 TODO 有明确用途
- ✅ TODO 数量：51 → 50
