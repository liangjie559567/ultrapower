# Axiom Gatekeepers（门禁规则）

<!-- Source: C:\Users\ljyih\Desktop\Axiom\.agent\rules\gatekeepers.rule -->
<!-- Migrated: 2026-02-24 -->

强制性检查点，未通过则绝对禁止进入下一环节。

## 1. 专家评审门禁（Expert Gate）

- **触发**: 所有新功能需求 / Phase 1 结束
- **动作**: 必须经过 `ai-review` 流程（含 Gatekeeper, Parallel Review, Arbitration）
- **通过条件**: Aggregator 生成 `review_summary.md` 并结论为 "Pass"

## 2. PRD 确认门禁（User Gate）

- **触发**: PRD 终稿生成完成
- **动作**: 显示 "PRD 已生成，是否确认执行？(Yes/No)"
- **恢复**: 用户明确确认后才允许进入分解阶段

## 3. 复杂度门禁（Complexity Gate）

- **触发**: 开发前评估工时 > 1 人日
- **动作**: 必须触发任务拆解（DAG 分解）

## 4. 编译提交门禁（CI Gate）

- **触发**: 代码修改完成
- **动作**: 必须执行 `tsc --noEmit && npm run build && npm test`
- **通过条件**: 无错误时自动执行 `git commit`

## 5. 范围门禁（Scope Gate）

- **触发**: 修改文件时
- **检查**: 是否在任务定义的 Impact Scope 内
- **动作**: 越界修改触发警告，需用户确认

## ultrapower 适配说明

- CI Gate 命令已从 `flutter analyze` 替换为 `tsc --noEmit && npm run build && npm test`
- 专家评审门禁对应 ultrapower 的 `code-reviewer` + `security-reviewer` + `quality-reviewer` 并行审查
