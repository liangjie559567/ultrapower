<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/model-routing/

## Purpose
模型路由模块。根据任务复杂度自动选择最合适的 Claude 模型（Haiku/Sonnet/Opus），实现成本与质量的最优平衡。

## For AI Agents

### 路由规则
| 模型 | 适用场景 |
|------|---------|
| Haiku | 快速查找、轻量扫描、范围较窄的检查 |
| Sonnet | 标准实现、调试、审查 |
| Opus | 架构、深度分析、复杂重构 |

### 修改此目录时
- 路由规则变更需更新根目录 `AGENTS.md` 的 model_routing 部分
- 参见 `docs/TIERED_AGENTS_V2.md` 了解分层 agent 设计

## Dependencies

### Internal
- `src/agents/definitions.ts` — Agent 定义（包含默认模型）
- `docs/TIERED_AGENTS_V2.md` — 分层 agent 设计文档

<!-- MANUAL: -->
