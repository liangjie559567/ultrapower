<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/directory-readme-injector/

## Purpose
目录 README 注入 hook。在 agent 进入某个目录工作时，自动将该目录的 AGENTS.md 内容注入到上下文中，帮助 agent 理解当前工作区域的规范和约束。

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Hook 入口，检测目录变更并注入 AGENTS.md |
| `constants.ts` | 注入触发条件和文件名常量 |
| `storage.ts` | 已注入目录缓存，避免重复注入 |
| `types.ts` | 类型定义 |

## For AI Agents

### 修改此目录时
- 此 hook 是 deepinit 生成的 AGENTS.md 文件的消费者
- 注入深度限制变更需测试大型代码库场景

## Dependencies

### Internal
- `src/features/context-injector/` — 上下文注入框架

<!-- MANUAL: -->
