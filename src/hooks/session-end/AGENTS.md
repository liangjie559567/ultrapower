<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/session-end/

## Purpose
会话结束 hook。在 Claude Code 会话结束时执行清理操作，包括保存最终状态、生成会话摘要、触发知识收割和清理临时文件。

## For AI Agents

### 会话结束时执行
1. 保存当前 notepad 状态
2. 更新项目记忆
3. 若有 Axiom 任务，触发 `/ax-reflect`
4. 清理临时状态文件

### 修改此目录时
- 必需字段：`sessionId`、`directory`（通过 bridge-normalize 白名单过滤）
- 参见 `scripts/session-end.mjs` 了解脚本层实现

## Dependencies

### Internal
- `scripts/session-end.mjs` — 脚本层入口
- `src/hooks/memory/` — 记忆保存

<!-- MANUAL: -->
