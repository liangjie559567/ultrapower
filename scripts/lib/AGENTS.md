<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# scripts/lib/

## Purpose
脚本共享工具库。提供脚本层公共工具函数，目前包含标准输入处理模块，供各构建和 hook 脚本复用。

## Key Files

| File | Description |
|------|-------------|
| `stdin.mjs` | 标准输入读取工具，用于脚本间数据传递 |

## For AI Agents

### 修改此目录时
- 工具函数变更需检查所有引用脚本

## Dependencies

### Internal
- `scripts/` — 父级脚本目录

<!-- MANUAL: -->
