<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/guards/

## Purpose
通用守卫 hook。实现执行前的安全检查，包括权限验证、危险操作拦截和用户确认提示。

## For AI Agents

### 守卫类型
- 权限守卫：检查操作是否在允许范围内
- 危险操作守卫：拦截破坏性命令（rm -rf、force push 等）
- 范围守卫：检查文件修改是否在 manifest 定义的范围内

### 修改此目录时
- 新增守卫规则需更新 `docs/standards/runtime-protection.md`
- 参见 `src/hooks/axiom-guards/` 了解 Axiom 专用门禁

## Dependencies

### Internal
- `src/hooks/axiom-guards/` — Axiom 专用门禁
- `docs/standards/runtime-protection.md` — 运行时保护规范

<!-- MANUAL: -->
