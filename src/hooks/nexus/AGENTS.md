<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/nexus/

## Purpose
Nexus 自我改进 hook。连接 nexus-daemon 自我改进系统，在会话结束时收集数据、触发进化引擎，并将改进结果同步回 OMC 系统。

## Key Files

| File | Description |
|------|-------------|
| `config.ts` | Nexus 连接配置 |
| `consciousness-sync.ts` | 意识状态同步逻辑 |
| `data-collector.ts` | 会话数据采集 |
| `improvement-puller.ts` | 从 nexus-daemon 拉取改进建议 |
| `session-end-hook.ts` | 会话结束时触发的 nexus 同步 |
| `types.ts` | 类型定义 |

## For AI Agents

### 修改此目录时
- 参见 `nexus-daemon/` 了解 Python 守护进程实现
- 数据采集字段变更需同步更新 nexus-daemon 的解析逻辑

## Dependencies

### Internal
- `nexus-daemon/` — Python 自我改进守护进程
- `src/hooks/session-end/` — 会话结束 hook

<!-- MANUAL: -->
