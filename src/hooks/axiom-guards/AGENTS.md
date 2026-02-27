<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/axiom-guards/

## Purpose
Axiom 门禁规则执行 hook。实现四种门禁：Expert Gate（专家评审）、User Gate（PRD 确认）、CI Gate（编译提交）、Scope Gate（范围检查）。

## For AI Agents

### 四种门禁规则
| 门禁 | 触发条件 | 动作 |
|------|---------|------|
| Expert Gate | 所有新功能需求 | 必须经过 `/ax-draft` → `/ax-review` |
| User Gate | PRD 终稿生成 | 显示确认提示，等待用户确认 |
| CI Gate | 代码修改完成 | 执行 `tsc --noEmit && npm run build && npm test` |
| Scope Gate | 修改文件时 | 检查是否在 manifest.md 定义的范围内 |

### 修改此目录时
- 门禁规则变更需更新 `CLAUDE.md` 的 Axiom 门禁规则部分
- CI Gate 命令变更需同步更新 `docs/standards/` 相关文档

## Dependencies

### Internal
- `src/hooks/axiom-boot/` — 启动时加载门禁配置
- `.omc/axiom/` — Axiom 状态文件

<!-- MANUAL: -->
