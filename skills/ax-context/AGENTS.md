<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# skills/ax-context/

## Purpose
Axiom 上下文管理器 skill。读取/保存短期记忆、长期记忆和状态机，维护跨会话任务状态。

## Key Files

| File | Description |
|------|-------------|
| `SKILL.md` | Skill 定义文件，包含触发条件、执行工作流和使用说明 |

## For AI Agents

### 修改此目录时
- 编辑 `SKILL.md` 修改 skill 行为
- 触发关键词变更需同步更新 `src/features/magic-keywords/`
- 参见 `skills/writing-skills/` 了解 skill 编写规范

## Dependencies

### Internal
- `src/skills/` — Skill TypeScript 运行时注册
- `src/features/magic-keywords/` — 关键词触发系统

<!-- MANUAL: -->
