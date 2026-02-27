<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/autopilot/

## Purpose
Autopilot 模式 hook 实现。处理全自主执行模式的启动、状态管理、取消和强制执行逻辑。

## Key Files

| 文件 | 描述 |
|------|------|
| `index.ts` | Autopilot hook 入口，处理 hook 事件路由 |
| `enforcement.ts` | 执行强制逻辑（确保 autopilot 模式下的行为约束） |
| `cancel.ts` | 取消 autopilot 模式的处理逻辑 |
| `prompts.ts` | Autopilot 模式的提示词模板 |

## Subdirectories

| 目录 | 用途 |
|------|------|
| `__tests__/` | Autopilot hook 单元测试 |

## For AI Agents

### Autopilot 触发词
- "autopilot"、"build me"、"I want a"

### 状态文件
- 读写：`.omc/state/autopilot-state.json`
- 使用 `state_read(mode="autopilot")` / `state_write(mode="autopilot")`

### 修改此目录时
- 修改后需同步更新 `skills/autopilot/SKILL.md`
- 取消逻辑需与 `src/hooks/ultraqa/` 协调（autopilot 可转换为 ultraqa）

## Dependencies

### Internal
- `src/features/boulder-state/` — 持久执行状态
- `src/features/state-manager/` — 状态管理
- `skills/autopilot/SKILL.md` — Autopilot skill 定义

<!-- MANUAL: -->
