<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# skills/nexus/nexus-status/

## Purpose
Nexus 状态子命令 skill。显示 nexus 守护进程的当前状态，包括运行状态、学习队列长度和最近活动。

## Key Files

| File | Description |
|------|-------------|
| `SKILL.md` | Skill 定义文件，包含触发条件和执行工作流 |

## For AI Agents

### 修改此目录时
- 编辑 `SKILL.md` 修改 nexus-status 行为
- 参见 `nexus-daemon/` 了解状态查询实现
- 参见 `skills/nexus/` 了解父级 nexus skill

## Dependencies

### Internal
- `nexus-daemon/` — Nexus 守护进程实现
- `skills/nexus/` — 父级 nexus skill

<!-- MANUAL: -->
