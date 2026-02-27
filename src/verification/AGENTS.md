<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/verification/

## Purpose
验证系统模块。实现任务完成验证逻辑，包括证据收集、声明验证和测试充分性检查。支持 verifier agent 的核心功能。

## For AI Agents

### 验证规模指导
- 小型变更（<5 文件，<100 行）：`model="haiku"`
- 标准变更：`model="sonnet"`
- 大型或安全/架构变更（>20 文件）：`model="opus"`

### 修改此目录时
- 验证逻辑变更需更新 `agents/verifier.md` 中的行为描述
- 参见 `docs/standards/` 了解验证标准

## Dependencies

### Internal
- `agents/verifier.md` — verifier agent 提示
- `src/features/verification/` — 特性层验证实现

<!-- MANUAL: -->
