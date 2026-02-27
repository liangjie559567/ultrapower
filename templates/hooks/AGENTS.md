<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# templates/hooks/

## Purpose
Hook 脚本模板目录。存放安装到目标项目的 hook 脚本模板，包括关键词检测、持久模式、工具调用前后处理等核心 hook，供 `omc install` 时复制到 `.claude/hooks/`。

## Key Files

| File | Description |
|------|-------------|
| `keyword-detector.mjs` | 魔法关键词检测 hook 模板 |
| `persistent-mode.mjs` | 持久执行模式 hook 模板 |
| `post-tool-use.mjs` | 工具调用后处理 hook 模板 |
| `post-tool-use-failure.mjs` | 工具调用失败处理 hook 模板 |
| `pre-tool-use.mjs` | 工具调用前处理 hook 模板 |
| `session-start.mjs` | 会话启动 hook 模板 |
| `stop-continuation.mjs` | 停止继续执行 hook 模板 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `lib/` | Hook 共享工具库模板 |

## For AI Agents

### 修改此目录时
- 模板变更会影响所有新安装项目的 hook 行为
- 参见 `src/hooks/` 了解 TypeScript 源码实现

## Dependencies

### Internal
- `src/hooks/` — Hook TypeScript 源码

<!-- MANUAL: -->
