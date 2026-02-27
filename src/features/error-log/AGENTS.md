<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/error-log/

## Purpose
错误日志模块。记录执行过程中的错误、警告和异常，支持错误分析和 Axiom 进化引擎的学习队列填充。

## For AI Agents

### 错误日志位置
- `.omc/logs/` — 审计日志目录
- `.omc/state/last-tool-error.json` — 最近工具错误

### 修改此目录时
- 错误格式变更需更新 Axiom 进化引擎的解析逻辑
- 参见 `src/hooks/recovery/` 了解错误恢复策略

## Dependencies

### Internal
- `src/hooks/recovery/` — 错误恢复
- `.omc/axiom/evolution/learning_queue.md` — 学习队列

<!-- MANUAL: -->
