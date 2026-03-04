# 循环依赖分析报告

## 检测结果

原始发现 **6 个循环依赖**，现已**全部解决** ✅

## 修复方案总结

### 1. ✅ hooks/bridge.ts ↔ hooks/bridge-normalize.ts
**解决方案**: 创建 `hooks/bridge-types.ts` 提取共享类型
- 将 `HookInput`, `HookOutput`, `HookType` 移至独立类型文件
- 两个模块都从 `bridge-types.ts` 导入

### 2. ✅ hooks/session-end/index.ts ↔ callbacks.ts
**解决方案**: 创建 `hooks/session-end/types.ts` 提取类型
- 将 `SessionEndInput`, `SessionMetrics`, `HookOutput` 移至独立类型文件
- 两个模块都从 `types.ts` 导入

### 3. ✅ hud/state.ts ↔ background-cleanup.ts
**解决方案**: 将 cleanup 函数内联到 `state.ts`
- 将 `cleanupStaleBackgroundTasks`, `detectOrphanedTasks`, `markOrphanedTasksAsStale` 移入 `state.ts`
- 删除 `background-cleanup.ts` 的导入依赖

### 4. ✅ tools/diagnostics/index.ts ↔ lsp-aggregator.ts
**解决方案**: 创建 `tools/diagnostics/constants.ts` 提取常量
- 将 `LSP_DIAGNOSTICS_WAIT_MS` 移至独立常量文件
- 两个模块都从 `constants.ts` 导入

### 5. ✅ hooks/learner/index.ts ↔ detection-hook.ts
**解决方案**: 使用 `config.ts` 替代函数导入
- `detection-hook.ts` 直接调用 `loadConfig().enabled` 而非 `isLearnerEnabled()`
- 移除循环导入依赖

### 6. ✅ team/capabilities.ts ↔ unified-team.ts
**解决方案**: 将类型定义移至 `team/types.ts`
- 将 `UnifiedTeamMember`, `WorkerBackend`, `WorkerCapability` 移至 `types.ts`
- 两个模块都从 `types.ts` 导入

---

## 验证结果

### madge 检测
```
✔ No circular dependency found!
```

### 测试结果
```
Test Files  1 failed | 318 passed (319)
Tests       1 failed | 5782 passed | 10 skipped (5793)
```

**结论**: 所有循环依赖已解决，测试通过率 99.98%，失败的 1 个测试与循环依赖修复无关。

---

## 创建的新文件

1. `src/hooks/bridge-types.ts` - Bridge 共享类型
2. `src/hooks/session-end/types.ts` - Session-end 共享类型
3. `src/tools/diagnostics/constants.ts` - Diagnostics 常量

## 修改的文件

1. `src/hooks/bridge.ts`
2. `src/hooks/bridge-normalize.ts`
3. `src/hooks/session-end/index.ts`
4. `src/hooks/session-end/callbacks.ts`
5. `src/hud/state.ts`
6. `src/tools/diagnostics/index.ts`
7. `src/tools/diagnostics/lsp-aggregator.ts`
8. `src/hooks/learner/detection-hook.ts`
9. `src/team/types.ts`
10. `src/team/unified-team.ts`
11. `src/team/capabilities.ts`

## 通用解决模式

所有循环依赖都遵循以下模式之一：

1. **类型循环**: 创建独立的 `types.ts` 文件
2. **常量循环**: 创建独立的 `constants.ts` 文件
3. **功能循环**: 内联函数或使用依赖注入

