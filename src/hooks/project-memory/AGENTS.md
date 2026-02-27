<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/project-memory/

## Purpose
项目记忆 hook。在工具调用前后自动读取和更新项目记忆（`.omc/project-memory.json`），将技术栈、构建规范、约定等持久化信息注入 agent 上下文。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，注入项目记忆上下文 |
| `constants.ts` | 记忆字段和注入规则常量 |
| `detector.ts` | 检测需要更新记忆的事件 |
| `directive-detector.ts` | 检测用户指令并持久化到记忆 |
| `directory-mapper.ts` | 目录结构映射和记忆 |
| `formatter.ts` | 记忆内容格式化 |
| `hot-path-tracker.ts` | 高频访问路径追踪 |
| `learner.ts` | 从对话中学习并更新记忆 |
| `pre-compact.ts` | 压缩前记忆保存 |
| `storage.ts` | 记忆持久化存储 |
| `types.ts` | 类型定义 |

## For AI Agents

### 修改此目录时
- 记忆字段变更需同步更新 `src/tools/` 中的 `project_memory_*` 工具接口

## Dependencies

### Internal
- `src/hooks/memory/` — 通用记忆系统 hook

<!-- MANUAL: -->
