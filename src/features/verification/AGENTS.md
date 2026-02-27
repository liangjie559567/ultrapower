<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/verification/

## Purpose
验证特性模块。实现任务完成验证的核心逻辑，包括证据收集策略、验证命令执行和结果评估。

## For AI Agents

### 验证流程
1. 确定验证命令（`npm test`、`tsc --noEmit` 等）
2. 执行验证命令
3. 解析输出，判断通过/失败
4. 生成验证报告

### 修改此目录时
- 验证策略变更需更新 `agents/verifier.md`
- 参见 `docs/standards/` 了解验证标准

## Dependencies

### Internal
- `agents/verifier.md` — Verifier agent 提示
- `src/verification/` — 验证系统模块

<!-- MANUAL: -->
