<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/cli/commands/

## Purpose
CLI 命令实现目录。包含 ultrapower CLI 的各子命令实现，如 agents、sessions、stats、cleanup 等管理命令。

## Key Files

| File | Description |
|------|-------------|
| `agents.ts` | agent 列表和管理命令 |
| `backfill.ts` | 数据回填命令 |
| `cleanup.ts` | 清理命令 |
| `cost.ts` | 成本统计命令 |
| `doctor-conflicts.ts` | 冲突诊断命令 |
| `export.ts` | 导出命令 |
| `sessions.ts` | 会话管理命令 |
| `stats.ts` | 统计命令 |
| `teleport.ts` | Teleport 命令 |
| `wait.ts` | 等待命令 |

## Subdirectories

| Directory | Purpose |
|-----------|----------|
| `__tests__/` | 命令单元测试 |

## For AI Agents

### 修改此目录时
- 运行测试：`npm test`
- 参见父级目录了解被测模块实现

## Dependencies

### Internal
- `src/cli/` — 相关模块
- `src/features/` — 相关模块

<!-- MANUAL: -->
