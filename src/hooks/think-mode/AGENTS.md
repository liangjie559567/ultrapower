<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/think-mode/

## Purpose
增强推理模式 hook。在复杂任务中激活扩展思考（extended thinking），提升 Claude 的推理深度和准确性。

## For AI Agents

### 触发条件
- 检测到复杂架构决策
- 用户明确要求深度分析
- 任务涉及多个相互依赖的系统

### 修改此目录时
- 思考模式触发阈值变更需测试对响应质量的影响
- 参见 `docs/FEATURES.md` 了解 think-mode 功能说明

## Dependencies

### Internal
- `src/features/` — 特性层集成

<!-- MANUAL: -->
