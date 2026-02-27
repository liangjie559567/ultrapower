# Phase 1 实现计划：被动学习（Passive Learning MVP）

## 摘要

Phase 1 的核心目标是让 Axiom 进化引擎在会话结束时自动触发反思和学习入队，同时在 `post-tool-use` hook 中记录 agent/skill 使用计数。这一切都是被动的——不修改任何 agent 提示词，不做任何自动优化，只收集数据。

新增 `constitution.md` 作为安全边界文件，为 Phase 2/3 的自动修改提供不可逾越的规则基线。

## 任务分解

### Task 1：创建 UsageTracker 模块
**文件：** `src/hooks/learner/usage-tracker.ts`（新建）
**存储路径：** `.omc/axiom/evolution/usage_metrics.json`

### Task 2：在 post-tool-use 路径中集成 UsageTracker
**文件：** `src/hooks/bridge.ts`（修改）

### Task 3：创建 SessionReflector 模块
**文件：** `src/hooks/learner/session-reflector.ts`（新建）

### Task 4：在 session-end hook 中集成 SessionReflector
**文件：** `src/hooks/session-end/index.ts`（修改）

### Task 5：创建 constitution.md 安全边界文件
**文件：** `.omc/axiom/constitution.md`（新建）

### Task 6：为 constitution.md 添加初始化逻辑
**文件：** `src/hooks/axiom-boot/storage.ts`（修改）

### Task 7：单元测试
**文件：** `src/hooks/learner/__tests__/usage-tracker.test.ts`（新建）

### Task 8：集成测试 + CI 验证

## 依赖关系
Task 5 → Task 6
Task 1 → Task 2 → Task 7 → Task 8
Task 1 → Task 3 → Task 4 → Task 7 → Task 8

## Phase 2 & 3 未来工作
- Phase 2：prompt-analyzer、ax-evolve 优化建议、prompt-patcher
- Phase 3：constitution-checker、multi-model-review、auto-rollback、evolution-scheduler
