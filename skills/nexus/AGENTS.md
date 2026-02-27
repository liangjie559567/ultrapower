<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# skills/nexus/

## Purpose
Nexus 自我改进系统 skill 目录。包含 nexus 主命令及其三个子命令（nexus-evolve、nexus-review、nexus-status），管理 nexus 守护进程的交互入口。

## Key Files

| File | Description |
|------|-------------|
| `SKILL.md` | Nexus 主命令 skill 定义，包含子命令路由逻辑 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `nexus-evolve/` | 触发进化循环的子命令 skill |
| `nexus-review/` | 触发审查流程的子命令 skill |
| `nexus-status/` | 查询守护进程状态的子命令 skill |

## For AI Agents

### 修改此目录时
- 参见 `nexus-daemon/` 了解守护进程实现
- 子命令变更需同步更新 `SKILL.md` 中的路由逻辑

## Dependencies

### Internal
- `nexus-daemon/` — Nexus 守护进程 Python 实现
- `src/hooks/nexus/` — Nexus hook 集成

<!-- MANUAL: -->
