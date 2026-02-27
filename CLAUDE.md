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
| 知识库管理 | `/ax-knowledge` |
| 导出工作流 | `/ax-export` |

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

### Scope Gate（范围门禁）
- 触发：修改文件时。
- 检查：是否在 `manifest.md` 定义的 `Impact Scope` 内。
- 动作：越界修改触发警告，需用户确认后才能继续。

## Axiom 进化引擎自动行为

| 触发事件 | 自动行为 |
|---------|---------|
| 任务完成 | 将代码变更加入 `learning_queue.md` |
| 错误修复成功 | 将修复模式加入学习队列 (P1) |
| 工作流完成 | 更新 `workflow_metrics.md` |
| 状态 → ARCHIVING | 自动触发 `/ax-reflect` |
| 状态 → IDLE | 处理学习队列 (P0/P1) |

# 规范体系引用

## 全链路规范文档

ultrapower v5.2.4 规范体系位于 `docs/standards/`，所有实现必须遵守：

| 优先级 | 文档 | 核心内容 |
|--------|------|---------|
| P0 | [runtime-protection.md](./docs/standards/runtime-protection.md) | 路径遍历防护、Hook 输入消毒、状态文件权限 |
| P0 | [hook-execution-order.md](./docs/standards/hook-execution-order.md) | 15 类 HookType、路由规则、执行顺序 |
| P0 | [state-machine.md](./docs/standards/state-machine.md) | Agent 状态机、Team Pipeline 转换矩阵 |
| P0 | [agent-lifecycle.md](./docs/standards/agent-lifecycle.md) | 超时/孤儿/成本超限/死锁边界情况 |
| P1 | [user-guide.md](./docs/standards/user-guide.md) | Skill 决策树、Agent 路由指南 |
| P1 | [anti-patterns.md](./docs/standards/anti-patterns.md) | 已知反模式及正确替代方案 |
| P1 | [contribution-guide.md](./docs/standards/contribution-guide.md) | 贡献流程、质量门禁、文档同步要求 |

## 不可协商的安全规则

1. **路径遍历防护**：`mode` 参数必须通过 `assertValidMode()` 校验后才能拼接路径。
   ```typescript
   import { assertValidMode } from './src/lib/validateMode';
   const validMode = assertValidMode(mode);
   const path = `.omc/state/${validMode}-state.json`;
   ```

2. **Hook 输入消毒**：所有 hook 输入经 `bridge-normalize.ts` 白名单过滤，未知字段被丢弃。

3. **SubagentStop 推断**：禁止直接读取 `input.success`，使用 `input.success !== false`。

# currentDate
Today's date is 2026-02-26.
