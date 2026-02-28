# Manifest: 自动发布 & 自动更新插件工作流测试补全

**生成时间**: 2026-02-27
**基于**: Draft PRD（ax-draft 生成）
**目标**: 补全 v5.2.5 中实现的发布流水线和插件自动更新功能的测试覆盖缺口

## Impact Scope

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/__tests__/release-steps.test.ts` | MODIFY | 新增失败路径测试 |
| `src/__tests__/auto-update.test.ts` | MODIFY | 新增 syncMarketplaceClone + 插件模式 + silentAutoUpdate 测试 |

## 任务 DAG

```
T-01 (release-steps 失败路径)
T-02 (syncMarketplaceClone)  ─┐
T-03 (performUpdate 插件模式) ─┤─→ CI Gate
T-04 (silentAutoUpdate 速率限制) ─┘
```

T-01~T-04 互相独立，可并行执行。CI Gate 依赖全部完成。

## 任务清单

| ID | 文件 | 描述 | 新增测试数 |
|----|------|------|-----------|
| T-01 | `src/__tests__/release-steps.test.ts` | release-steps.mjs 失败路径测试 | 3 |
| T-02 | `src/__tests__/auto-update.test.ts` | syncMarketplaceClone 4 分支测试 | 4 |
| T-03 | `src/__tests__/auto-update.test.ts` | performUpdate 插件模式路径测试 | 3 |
| T-04 | `src/__tests__/auto-update.test.ts` | silentAutoUpdate 速率限制测试 | 3 |
| CI Gate | — | tsc + build + npm test | — |

**总计**: ≥13 新测试，0 失败

## 验收标准

- [ ] `npm test` 全部通过，新增 ≥13 个测试
- [ ] `tsc --noEmit` 零错误
- [ ] `npm run build` 成功
- [ ] 无回归（现有测试不受影响）
