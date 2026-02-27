<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/ultrapilot/

## Purpose
Ultrapilot 模式 hook。实现带文件所有权分区的并行 autopilot，通过 git worktree 隔离多个并行执行流，防止文件冲突。

## For AI Agents

### Ultrapilot vs Autopilot
- Autopilot：单流执行，顺序处理任务
- Ultrapilot：多流并行，每个流拥有独立文件所有权

### 状态文件
- `.omc/state/ultrapilot-state.json`

### 修改此目录时
- Autopilot 和 Ultrapilot 互斥，修改需考虑冲突解决
- 参见 `src/team/git-worktree.ts` 了解 worktree 管理

## Dependencies

### Internal
- `src/team/git-worktree.ts` — Git worktree 管理
- `skills/ultrapilot/SKILL.md` — Ultrapilot skill 定义

<!-- MANUAL: -->
