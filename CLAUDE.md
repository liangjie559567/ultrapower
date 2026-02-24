# 开发规范
必须说中文
## 分支策略
- **默认基础分支：`dev`**（不是 `main`）
- 所有 PR 必须以 `dev` 分支为目标
- 禁止直接创建以 `main` 为目标的 PR
- 始终从 `dev` 创建 worktree：`git worktree add <path> -b <branch> dev`

## 创建 PR
创建 PR 时，始终使用：
```
gh pr create --base dev ...
```

## 提交规范
- 所有提交信息、PR 标题和 issue 评论使用英文
- 格式：`type(scope): description`

# Axiom 启动协议

## 会话启动检测
当工作目录下存在 `.omc/axiom/` 目录时，自动执行：
1. 读取 `.omc/axiom/active_context.md`，解析当前状态。
2. 读取 `.omc/axiom/project_decisions.md` 获取架构约束。
3. 读取 `.omc/axiom/user_preferences.md` 获取用户偏好。

状态恢复：
- `IDLE`: 系统就绪，等待指令。
- `EXECUTING`: 检测到中断的任务，询问是否继续。
- `BLOCKED`: 上次任务遇到问题，需要人工介入。

## Axiom 工作流路由表

| 用户意图 | 对应指令 |
| :--- | :--- |
| 提出新需求 / 做个功能 | `/ax-draft` |
| 需求评审 / 专家审查 | `/ax-review` |
| 拆解大任务 / 细化设计 | `/ax-decompose` |
| 开始开发 / 交付流水线 | `/ax-implement` |
| 报错了 / 修 Bug | `/ax-analyze-error` |
| 反思 / 总结 / 进化 | `/ax-reflect` |
| 查看状态 | `/ax-status` |
| 保存退出 | `/ax-suspend` |
| 回滚 | `/ax-rollback` |
| 查询知识库 | `/ax-evolution knowledge [query]` |
| 查询模式库 | `/ax-evolution patterns [query]` |

## Axiom 门禁规则

### Expert Gate（专家评审门禁）
- 触发：所有新功能需求。
- 动作：必须经过 `/ax-draft` → `/ax-review` 流程。

### User Gate（PRD 确认门禁）
- 触发：PRD 终稿生成完成。
- 动作：必须显示 "PRD 已生成，是否确认执行？(Yes/No)"，用户确认后才能进入开发。

### CI Gate（编译提交门禁）
- 触发：代码修改完成。
- 动作：必须执行 `tsc --noEmit && npm run build && npm test`。
- 通过条件：无错误时才允许宣告完成。

## Axiom 进化引擎自动行为

| 触发事件 | 自动行为 |
|---------|---------|
| 任务完成 | 将代码变更加入 `learning_queue.md` |
| 错误修复成功 | 将修复模式加入学习队列 (P1) |
| 工作流完成 | 更新 `workflow_metrics.md` |
| 状态 → ARCHIVING | 自动触发 `/ax-reflect` |
| 状态 → IDLE | 处理学习队列 (P0/P1) |

# currentDate
Today's date is 2026-02-24.
