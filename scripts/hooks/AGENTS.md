<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# scripts/hooks/

## Purpose
脚本层 hook 文件目录。包含 Git hook 脚本（pre-commit、post-commit）和 OMC hook 安装脚本，用于在开发工作流中自动触发 OMC 功能。

## Key Files

| File | Description |
|------|-------------|
| `install-hooks.sh` | 安装所有 Git hooks 的脚本 |
| `pre-commit.sh` | Git pre-commit hook，触发代码检查 |
| `post-commit.sh` | Git post-commit hook，触发提交后操作 |

## For AI Agents

### 修改此目录时
- Hook 脚本变更需在 Unix 和 Windows 环境中测试
- 参见 `src/hooks/` 了解 TypeScript hook 实现

## Dependencies

### Internal
- `scripts/lib/` — 脚本共享工具库

<!-- MANUAL: -->
