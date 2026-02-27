<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# commands/

## Purpose
包含 17 个斜杠命令定义（Axiom 工作流命令）。这些 Markdown 文件定义用户可通过 `/command-name` 调用的命令，与 `skills/` 目录中的 skill 实现保持镜像关系。

## Key Files

| 文件 | 描述 |
|------|------|
| `ax-draft.md` | `/ax-draft` — 需求起草工作流 |
| `ax-review.md` | `/ax-review` — 5 专家并行评审 |
| `ax-decompose.md` | `/ax-decompose` — 任务拆解为原子 DAG |
| `ax-implement.md` | `/ax-implement` — 按 Manifest 执行任务 |
| `ax-reflect.md` | `/ax-reflect` — 会话反思与知识入队 |
| `ax-status.md` | `/ax-status` — Axiom 状态仪表盘 |
| `ax-rollback.md` | `/ax-rollback` — 回滚到最近检查点 |
| `ax-suspend.md` | `/ax-suspend` — 保存状态安全退出 |
| `ax-knowledge.md` | `/ax-knowledge` — 查询知识库 |
| `ax-evolve.md` | `/ax-evolve` — 触发知识收割 |
| `ax-evolution.md` | `/ax-evolution` — 进化引擎统一入口 |
| `ax-export.md` | `/ax-export` — 导出工作流产物 |
| `ax-context.md` | `/ax-context` — 操作 Axiom 记忆系统 |
| `brainstorm.md` | `/brainstorm` — 结构化创意探索 |
| `execute-plan.md` | `/execute-plan` — 分批执行计划 |
| `write-plan.md` | `/write-plan` — 创建详细实现计划 |

## For AI Agents

### Skills ↔ Commands 同步规则
- `commands/` 中的每个命令文件对应 `skills/` 中的同名 skill 实现
- 修改命令定义时，必须同步更新对应的 `skills/*/SKILL.md`
- 两者功能描述必须保持一致

### 修改此目录时
- 新增命令需同时在 `skills/` 创建对应目录和 `SKILL.md`
- 命令文件使用 Markdown 格式，包含触发词、描述和使用示例

## Dependencies

### Internal
- `skills/` — 每个命令对应的 skill 实现
- `src/features/builtin-skills/` — 内置 skill 加载机制

<!-- MANUAL: -->
