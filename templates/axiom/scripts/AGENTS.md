<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# templates/axiom/scripts/

## Purpose
Axiom 初始化脚本模板目录。包含 Windows PowerShell 脚本，用于在新项目中启动 Axiom agent 运行器、监控记忆状态和执行代码审查。

## Key Files

| File | Description |
|------|-------------|
| `agent-runner.ps1` | Axiom agent 运行器脚本 |
| `Check-Memory.ps1` | 记忆状态检查脚本 |
| `Poll-Memory.ps1` | 记忆轮询监控脚本 |
| `Watch-Memory.ps1` | 记忆变更监听脚本 |
| `start-reviews.ps1` | 启动代码审查流程脚本 |
| `README.md` | 脚本使用说明 |

## For AI Agents

### 修改此目录时
- PowerShell 脚本需在 Windows 环境测试
- 参见 `templates/axiom/` 了解完整 Axiom 模板

<!-- MANUAL: -->
