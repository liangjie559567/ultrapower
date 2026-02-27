<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# skills/project-session-manager/lib/

## Purpose
PSM 核心库目录。包含 project-session-manager skill 的 shell 脚本库，提供配置解析、会话管理、tmux 集成和 git worktree 操作功能。

## Key Files

| File | Description |
|------|-------------|
| `config.sh` | 配置加载和解析，读取 projects.json |
| `parse.sh` | 命令行参数解析工具函数 |
| `session.sh` | 会话生命周期管理（创建、切换、销毁） |
| `tmux.sh` | tmux 窗口和面板操作封装 |
| `worktree.sh` | git worktree 创建和管理操作 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `providers/` | 代码托管平台集成（GitHub、GitLab 等） |

## For AI Agents

### 修改此目录时
- 所有脚本使用 bash，保持 POSIX 兼容性
- 参见 `skills/project-session-manager/SKILL.md` 了解整体工作流
- 参见 `providers/` 了解平台集成接口

## Dependencies

### Internal
- `skills/project-session-manager/` — 父级 PSM skill

<!-- MANUAL: -->
