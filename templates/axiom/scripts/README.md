# Axiom PowerShell Scripts (归档)

这些脚本来自 Axiom `.agent/scripts/`，仅供参考。
ultrapower 是跨平台的，不直接集成这些 Windows 专用脚本。

## 脚本列表

| 文件 | 功能 |
|------|------|
| `agent-runner.ps1` | Agent 主运行器，启动 Axiom 工作流 |
| `Check-Memory.ps1` | 检查记忆文件状态 |
| `Poll-Memory.ps1` | 轮询记忆文件变更 |
| `start-reviews.ps1` | 启动代码审查流程 |
| `Watch-Memory.ps1` | 监控记忆文件变更（文件系统 watcher） |

## 使用说明

这些脚本在 ultrapower 中不直接使用。
等效功能通过 ultrapower skills 实现：
- `ax-status` — 替代 Check-Memory.ps1
- `ax-reflect` — 替代 Poll-Memory.ps1
- `ax-suspend` — 替代 Watch-Memory.ps1
