<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/plugin-patterns/

## Purpose
插件模式 hook。检测并注入插件特定的行为模式，确保插件 agent 遵循 OMC 插件规范，提供插件间的模式共享机制。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，注入插件模式上下文 |

## For AI Agents

### 修改此目录时
- 插件模式变更需同步更新插件文档

## Dependencies

### Internal
- `src/features/builtin-skills/` — 内置 skill 注册表

<!-- MANUAL: -->
