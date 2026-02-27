<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/rules-injector/

## Purpose
规则文件注入 hook。在会话启动时自动将 `templates/rules/` 中的规则模板注入到当前上下文，包括编码风格、测试规范、安全规则和 Git 工作流规范。

## For AI Agents

### 规则模板位置
- `templates/rules/coding-style` — 编码风格规范
- `templates/rules/testing` — 测试规范
- `templates/rules/security` — 安全规则
- `templates/rules/performance` — 性能规范
- `templates/rules/git-workflow` — Git 工作流规范

### 修改此目录时
- 注入逻辑变更需同步更新 `templates/rules/` 中的模板
- 参见根目录 `AGENTS.md` 的修改检查清单

## Dependencies

### Internal
- `templates/rules/` — 规则模板文件
- `src/hooks/bridge.ts` — Hook 桥接层

<!-- MANUAL: -->
