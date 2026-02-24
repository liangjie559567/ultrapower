# Axiom Provider Router（Provider 路由规则）

<!-- Source: C:\Users\ljyih\Desktop\Axiom\.agent\rules\provider_router.rule -->
<!-- Migrated: 2026-02-24 -->

在所有需要启动 Worker CLI 的流程中，先读取配置的 `ACTIVE_PROVIDER`，再按下表构造命令。

## Provider → Worker 命令模板

| ACTIVE_PROVIDER | Worker CLI | 说明 |
| :--- | :--- | :--- |
| `codex` | Codex CLI | 默认首选 |
| `claude_code` | Claude Code | 按本机安装命令名 |
| `opencode` | OpenCode CLI | 以当前 CLI 语法为准 |
| `gemini_cli` | Gemini CLI | 以当前 CLI 语法为准 |
| `gemini` | Gemini (legacy) | 向后兼容 |
| `claude` | Claude (legacy) | 向后兼容 |

## 统一占位符

- `WORKER_EXEC`: 当前 Provider 的执行命令模板
- `WORKER_LABEL`: 当前 Provider 的展示名

## 回退策略

1. 若 `ACTIVE_PROVIDER` 不存在或未命中，回退到 `codex`
2. 若目标 CLI 未安装，输出缺失提示并给出安装命令
3. 仅在当前 Provider 无法执行时，回退到 `codex exec`

## 约束

- 不在 workflow 中硬编码具体 CLI 命令
- workflow 仅引用 `WORKER_EXEC` 占位符

## ultrapower 适配说明

在 ultrapower 中，Provider 路由通过 Task subagent_type 实现：
- `codex` → `mcp__plugin_ultrapower_x__ask_codex`
- `gemini` → `mcp__plugin_ultrapower_g__ask_gemini`
- `claude_code` → `Task(subagent_type="ultrapower:executor")`
