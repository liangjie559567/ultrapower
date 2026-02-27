<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# templates/rules/

## Purpose
规则文件模板目录。存放注入到目标项目的规则文档模板，包括 Axiom 路由规则、编码风格、Git 工作流、安全规范和测试规范，供 `omc install` 时复制到 `.claude/rules/`。

## Key Files

| File | Description |
|------|-------------|
| `axiom-gatekeepers.md` | Axiom 门禁规则模板 |
| `axiom-provider-router.md` | Axiom 提供商路由规则模板 |
| `axiom-router.md` | Axiom 工作流路由规则模板 |
| `axiom-skills.md` | Axiom skill 使用规则模板 |
| `coding-style.md` | 编码风格规范模板 |
| `git-workflow.md` | Git 工作流规范模板 |
| `performance.md` | 性能优化规范模板 |
| `security.md` | 安全规范模板 |
| `testing.md` | 测试规范模板 |
| `README.md` | 规则文件使用说明 |

## For AI Agents

### 修改此目录时
- 规则模板变更会影响所有新安装项目的 agent 行为
- 参见 `docs/standards/` 了解规范体系

## Dependencies

### Internal
- `docs/standards/` — 规范体系文档

<!-- MANUAL: -->
