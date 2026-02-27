<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/mode-registry/

## Purpose
模式注册表 hook。维护所有执行模式（autopilot、ralph、ultrawork 等）的注册信息，提供模式查询、状态检查和冲突检测功能。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，提供模式注册和查询接口 |
| `types.ts` | 模式注册表类型定义 |

## For AI Agents

### 修改此目录时
- 新增执行模式需在此注册
- 参见 `docs/standards/state-machine.md` 了解状态机规范

## Dependencies

### Internal
- `src/features/state-manager/` — 状态管理
- `docs/standards/state-machine.md` — 状态机规范

<!-- MANUAL: -->
