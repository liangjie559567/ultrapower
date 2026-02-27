<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/omc-orchestrator/

## Purpose
OMC 编排器 hook。作为核心编排层，协调各 hook 的执行顺序，管理 hook 间的数据传递，并提供审计日志记录功能。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，编排所有 hook 执行 |
| `constants.ts` | 编排规则和优先级常量 |
| `audit.ts` | 审计日志记录 |

## For AI Agents

### 修改此目录时
- 参见 `docs/standards/hook-execution-order.md` 了解 15 类 HookType 和执行顺序
- 编排规则变更需全面测试 hook 交互

## Dependencies

### Internal
- `docs/standards/hook-execution-order.md` — Hook 执行顺序规范
- `src/hooks/guards/` — 安全守卫

<!-- MANUAL: -->
