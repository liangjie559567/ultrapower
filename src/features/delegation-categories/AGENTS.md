<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/delegation-categories/

## Purpose
委派分类模块。定义任务类型到 agent 类型的映射规则，实现智能委派路由——根据任务特征自动选择最合适的 agent。

## For AI Agents

### 委派规则
- 多文件实现 → `executor`
- 复杂自主任务 → `deep-executor`
- 代码库探索 → `explore`
- 根因分析 → `debugger`
- 安全审查 → `security-reviewer`
- 文档查找 → `document-specialist` 或 MCP 工具

### 修改此目录时
- 新增委派规则需更新根目录 `AGENTS.md` 的 delegation_rules 部分
- 参见 `docs/standards/user-guide.md` 了解 Agent 路由指南

## Dependencies

### Internal
- `src/features/delegation-routing/` — 委派路由执行
- `docs/standards/user-guide.md` — 用户指南

<!-- MANUAL: -->
