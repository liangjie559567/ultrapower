<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# tests/

## Purpose
集成测试根目录。包含 ultrapower 的端到端集成测试，覆盖 brainstorm-server、claude-code、skill 触发、subagent 驱动开发等场景。

## Key Files

| File | Description |
|------|-------------|
| `package.json` | 测试依赖配置 |
| `package-lock.json` | 依赖锁定文件 |


## Subdirectories

| Directory | Purpose |
|-----------|----------|
| `brainstorm-server/` | Brainstorm 服务器集成测试 |
| `claude-code/` | Claude Code 集成测试 |
| `explicit-skill-requests/` | 显式 skill 请求测试 |
| `opencode/` | OpenCode 集成测试 |
| `skill-triggering/` | Skill 触发测试 |
| `subagent-driven-dev/` | 子 agent 驱动开发测试 |

## For AI Agents

### 修改此目录时
- 参见父级目录了解整体结构
- 遵循项目编码规范

## Dependencies

### Internal
- `src/` — 相关模块
- `skills/` — 相关模块

<!-- MANUAL: -->
