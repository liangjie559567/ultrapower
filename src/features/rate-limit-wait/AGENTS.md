<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/rate-limit-wait/

## Purpose
速率限制等待模块。检测 API 速率限制错误，自动计算等待时间并重试，避免因速率限制导致任务失败。

## For AI Agents

### 修改此目录时
- 等待策略变更需测试高并发场景
- 参见 `docs/standards/agent-lifecycle.md` 了解速率限制处理规范

## Dependencies

### Internal
- `src/hooks/recovery/` — 错误恢复（速率限制是一种可恢复错误）

<!-- MANUAL: -->
