# Axiom Router（核心路由规则）

<!-- Source: C:\Users\ljyih\Desktop\Axiom\.agent\rules\router.rule -->
<!-- Migrated: 2026-02-24 -->

负责将用户意图路由到正确的工作流或技能。

## 0. 记忆优先原则（Memory First）

**强制**: 每个新 Session 必须先读取活跃上下文。

- **触发**: 任何新 Session 的第一条请求，或用户说 "继续"/"开始"
- **动作**:
  1. 读取 `.omc/axiom/active_context.md`
  2. 检查 `task_status` 字段
  3. 注入 `Current Goal` 和 `Task Queues`
  4. 基于状态建议下一步

## 1. 核心流水线路由

遵循: Draft → Review → Decompose → Implement

| 用户意图 | 路由目标 | 说明 |
| :--- | :--- | :--- |
| 提出新需求 / 做个功能 | `brainstorming` skill | Phase 1: 需求澄清与初稿 |
| Draft 已生成 / 评审 | `code-reviewer` + `security-reviewer` | Phase 1.5: 专家评审 |
| PRD 已确认 / 拆解 | `writing-plans` skill | Phase 2: 任务拆解 |
| Manifest 已确认 / 开发 | `executing-plans` skill | Phase 3: 开发交付 |

## 2. 辅助功能路由

| 用户意图 | 路由目标 |
| :--- | :--- |
| 检测到报错 / "修个Bug" | `ultrapower:analyze` |
| "回滚" / "撤销" | `/ultrapower:ax-rollback` |
| "状态" / "进度" | `/ultrapower:ax-status` |
| "反思" / "总结" | `/ultrapower:ax-reflect` |
| "知识 [query]" | `/ultrapower:ax-knowledge` |
| "导出系统" | `/ultrapower:ax-export` |
| "初始化环境" | `/ultrapower:deepinit` |

## 3. 门禁规则

- **Ambiguity Guard**: 需求模糊时强制反问，禁止直接进入实现阶段
- **Approval Guard**: PRD 必须用户确认才能进入拆解；Manifest 必须用户确认才能进入开发
- **CI Guard**: 所有代码提交前必须通过 `tsc --noEmit && npm run build && npm test`

## 4. 进化引擎自动触发

| 触发事件 | 自动行为 |
| :--- | :--- |
| 功能开发完成（All Done） | 自动触发 `/ultrapower:learner`（知识收割） |
| Bug 修复成功 | 自动提取 Error Pattern |
| Session 结束/挂起 | 自动更新 `active_context.md` |
