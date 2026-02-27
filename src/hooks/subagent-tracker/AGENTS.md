<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/subagent-tracker/

## Purpose
子 agent 追踪 hook。监控所有派生的子 agent 的生命周期，追踪 token 使用量、执行时间和完成状态，用于成本控制和性能分析。

## For AI Agents

### 追踪指标
- Token 使用量（输入/输出）
- 执行时间
- Agent 类型分布
- 失败率和重试次数

### 修改此目录时
- 追踪数据格式变更需更新 `src/team/usage-tracker.ts`
- 参见 `docs/standards/agent-lifecycle.md` 了解成本超限处理

## Dependencies

### Internal
- `src/team/usage-tracker.ts` — 使用量追踪
- `docs/standards/agent-lifecycle.md` — Agent 生命周期规范

<!-- MANUAL: -->
