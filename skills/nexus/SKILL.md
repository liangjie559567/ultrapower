---
name: nexus
description: nexus 自我改进系统 - 管理 nexus 子命令的入口
triggers:
  - nexus
  - nexus help
---

# nexus

nexus 是 ultrapower 的自我改进系统，通过收集会话数据并在 VPS 端运行进化引擎来持续优化 agent 行为。

## 子命令

| 命令 | 用途 |
|------|------|
| `/nexus-status` | 查看 nexus 系统状态 |
| `/nexus-evolve` | 手动触发进化引擎 |
| `/nexus-review` | 审批待处理的改进建议 |

## 快速开始

1. 配置 nexus：编辑 `.omc/nexus/config.json`，设置 `enabled: true` 和 `gitRemote`
2. 查看状态：`/nexus-status`
3. 触发进化：`/nexus-evolve`
4. 审批改进：`/nexus-review`

## 架构

nexus 由以下组件组成：

- **data-collector hook**：在每次会话结束时收集工具使用数据
- **consciousness-sync hook**：将事件推送到 nexus-daemon 仓库
- **improvement-puller hook**：拉取 VPS 端生成的改进建议
- **nexus-daemon**（VPS 端）：Python 守护进程，分析数据并生成优化建议
