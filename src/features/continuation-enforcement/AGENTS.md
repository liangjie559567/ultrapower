<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/continuation-enforcement/

## Purpose
继续执行强制模块。确保在执行模式（autopilot、ralph 等）下，agent 不会过早停止工作，强制执行"零待处理任务"的完成标准。

## For AI Agents

### 完成标准检查
- 零待处理任务
- 所有功能正常
- 测试通过
- 零错误
- 已收集 verifier 证据

### 修改此目录时
- 完成标准变更需更新根目录 `AGENTS.md` 的 execution_protocols 部分

## Dependencies

### Internal
- `src/hooks/autopilot/enforcement.ts` — Autopilot 强制执行
- `src/features/verification/` — 验证模块

<!-- MANUAL: -->
