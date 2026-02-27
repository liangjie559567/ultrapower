<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/team-pipeline/

## Purpose
Team 流水线 hook。实现 Team 模式的分阶段执行流水线：`team-plan → team-prd → team-exec → team-verify → team-fix`，管理阶段转换和状态持久化。

## For AI Agents

### 流水线阶段
| 阶段 | Agent | 转换条件 |
|------|-------|---------|
| team-plan | explore + planner | 规划/分解完成 |
| team-prd | analyst | 验收标准明确 |
| team-exec | executor + 专家 | 所有任务达到终态 |
| team-verify | verifier + 审查者 | 验证决定下一步 |
| team-fix | executor/build-fixer/debugger | 修复完成或达到最大尝试次数 |

### 状态持久化
- 写入 `.omc/state/team-state.json`
- 跟踪：`current_phase`、`fix_loop_count`、`linked_ralph`

### 修改此目录时
- 阶段转换逻辑变更需更新根目录 `AGENTS.md` 的 team_pipeline 部分
- 参见 `docs/standards/state-machine.md` 了解状态机规范

## Dependencies

### Internal
- `src/team/` — Team 协调层
- `src/features/state-manager/` — 状态管理
- `docs/standards/state-machine.md` — 状态机规范

<!-- MANUAL: -->
