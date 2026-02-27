<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/auto-slash-command/

## Purpose
自动斜杠命令 hook。检测用户输入中的命令模式，自动将其路由到对应的 skill 或 agent，无需用户手动输入完整命令路径。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，拦截并路由命令 |
| `constants.ts` | 命令映射表和路由规则 |
| `detector.ts` | 命令模式检测逻辑 |
| `executor.ts` | 命令执行分发器 |
| `live-data.ts` | 实时命令数据获取 |
| `types.ts` | 类型定义 |

## For AI Agents

### 修改此目录时
- 新增命令映射需同步更新 `commands/` 目录
- 参见 `src/features/magic-keywords/` 了解关键词冲突解决规则

## Dependencies

### Internal
- `src/features/magic-keywords/` — 关键词检测
- `commands/` — 命令定义

<!-- MANUAL: -->
