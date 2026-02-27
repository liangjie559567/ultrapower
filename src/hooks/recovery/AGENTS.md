<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/recovery/

## Purpose
错误恢复 hook。检测执行失败、超时和死锁情况，自动触发恢复策略，防止 agent 陷入无限循环或卡死状态。

## For AI Agents

### 恢复策略
- 执行失败：最多重试 3 次，每次间隔递增
- 超时：强制终止并报告 BLOCKED 状态
- 死锁：检测循环依赖并中断

### 修改此目录时
- 恢复策略变更需更新 `docs/standards/agent-lifecycle.md`
- 参见 `docs/standards/agent-lifecycle.md` 了解超时/孤儿/死锁边界情况

## Dependencies

### Internal
- `docs/standards/agent-lifecycle.md` — Agent 生命周期规范
- `src/features/state-manager/` — 状态管理

<!-- MANUAL: -->
