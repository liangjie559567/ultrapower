<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/utils/

## Purpose
跨模块共享的工具函数库。提供路径处理、配置目录定位、字符串宽度计算等基础工具。

## Key Files

| 文件 | 描述 |
|------|------|
| `paths.ts` | 路径工具函数（worktree 路径、状态文件路径等） |
| `config-dir.ts` | 配置目录定位（`~/.claude/`、`.omc/` 等） |
| `string-width.ts` | 字符串显示宽度计算（支持 CJK 字符） |

## Subdirectories

| 目录 | 用途 |
|------|------|
| `__tests__/` | 工具函数单元测试 |

## For AI Agents

### 路径安全规则
- 所有路径操作必须通过 `paths.ts` 中的函数，不得直接拼接字符串
- `mode` 参数必须通过 `assertValidMode()` 校验后才能用于路径构建
- 参见 `docs/standards/runtime-protection.md`

### 修改此目录时
- 修改路径函数后需更新所有调用方
- `string-width.ts` 用于 HUD 显示对齐，修改需测试 CJK 字符场景

## Dependencies

### Internal
- 被 `src/hooks/`、`src/features/`、`src/tools/` 广泛引用

<!-- MANUAL: -->
