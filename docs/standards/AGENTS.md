<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# docs/standards/

## Purpose
规范体系文档目录。包含 ultrapower 全链路开发规范，是所有实现必须遵守的权威参考文档，涵盖运行时保护、Hook 执行顺序、状态机、Agent 生命周期等核心规范。

## Key Files

| File | Description |
|------|-------------|
| `runtime-protection.md` | P0 — 路径遍历防护、Hook 输入消毒、状态文件权限 |
| `hook-execution-order.md` | P0 — 15 类 HookType、路由规则、执行顺序 |
| `state-machine.md` | P0 — Agent 状态机、Team Pipeline 转换矩阵 |
| `agent-lifecycle.md` | P0 — 超时/孤儿/成本超限/死锁边界情况 |
| `user-guide.md` | P1 — Skill 决策树、Agent 路由指南 |
| `anti-patterns.md` | P1 — 已知反模式及正确替代方案 |
| `contribution-guide.md` | P1 — 贡献流程、质量门禁、文档同步要求 |
| `audit-report.md` | 安全审计报告 |
| `README.md` | 规范体系概览 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `templates/` | 规范文档模板 |

## For AI Agents

### 重要规则
- P0 文档是不可协商的安全规则，任何实现必须遵守
- 修改规范文档前需经过 `code-reviewer` 审查

## Dependencies

### Internal
- 被所有 `src/` 实现文件引用

<!-- MANUAL: -->
