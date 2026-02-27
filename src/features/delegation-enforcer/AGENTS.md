<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/delegation-enforcer/

## Purpose
委派强制执行模块。确保实质性代码变更被路由到 executor agent，而非由主 agent 直接处理，维护编辑工作流的一致性。

## For AI Agents

### 强制规则
- 多文件实现 → 必须委派给 `executor`
- 复杂重构 → 必须委派给 `deep-executor`
- 简单单行修改 → 可直接处理

### 修改此目录时
- 强制规则变更需更新根目录 `AGENTS.md` 的 delegation_rules 部分
- 参见 `docs/standards/anti-patterns.md` 了解已知反模式

## Dependencies

### Internal
- `src/features/delegation-categories/` — 委派分类规则
- `src/features/delegation-routing/` — 委派路由执行

<!-- MANUAL: -->
