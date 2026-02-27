<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# templates/hooks/lib/

## Purpose
Hook 共享工具库模板目录。提供 hook 脚本间复用的工具函数，包括原子写入和标准输入处理，确保 hook 脚本的稳定性和一致性。

## Key Files

| File | Description |
|------|-------------|
| `atomic-write.mjs` | 原子文件写入工具，防止并发写入冲突 |
| `stdin.mjs` | 标准输入读取工具 |

## For AI Agents

### 修改此目录时
- 原子写入逻辑是状态文件安全的关键，修改需谨慎

<!-- MANUAL: -->
