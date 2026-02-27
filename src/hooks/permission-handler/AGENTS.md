<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/permission-handler/

## Purpose
权限处理 hook。拦截需要用户授权的工具调用，根据配置的权限模式（自动允许/提示/拒绝）决定是否执行，并记录权限决策。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，拦截权限请求并做出决策 |

## For AI Agents

### 修改此目录时
- 权限模式变更需参见 `docs/standards/runtime-protection.md`
- 敏感操作的权限规则不可降低安全级别

## Dependencies

### Internal
- `docs/standards/runtime-protection.md` — 运行时保护规范
- `src/hooks/guards/` — 安全守卫

<!-- MANUAL: -->
