<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/agent-usage-reminder/

## Purpose
Agent 使用提醒 hook。在适当时机提示用户可用的 agent 类型和使用场景，帮助用户发现并正确使用 OMC agent 生态系统。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，注入 agent 使用提醒上下文 |
| `constants.ts` | 提醒触发条件和消息模板常量 |
| `storage.ts` | 提醒状态持久化（避免重复提醒） |
| `types.ts` | 类型定义 |

## For AI Agents

### 修改此目录时
- 提醒频率变更需避免打扰用户工作流
- 参见 `src/features/magic-keywords/` 了解关键词触发逻辑

## Dependencies

### Internal
- `src/agents/` — agent 定义列表
- `src/features/magic-keywords/` — 关键词检测

<!-- MANUAL: -->
