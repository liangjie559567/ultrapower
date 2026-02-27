<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/analytics/

## Purpose
分析和遥测模块。收集匿名使用数据，追踪 agent 调用频率、skill 使用模式和执行性能指标，用于改进 ultrapower。

## For AI Agents

### 隐私规范
- 只收集匿名聚合数据，不收集用户代码或内容
- 用户可通过配置禁用：`"telemetryEnabled": false`
- 数据不包含任何 PII（个人身份信息）

### 修改此目录时
- 新增指标需在 `docs/FEATURES.md` 中说明
- 遵循最小数据收集原则

## Dependencies

### Internal
- `src/cli/analytics.ts` — CLI 层分析入口

<!-- MANUAL: -->
