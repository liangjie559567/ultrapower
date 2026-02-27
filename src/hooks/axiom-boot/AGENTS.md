<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/axiom-boot/

## Purpose
Axiom 系统启动 hook。在会话启动时自动注入 Axiom 记忆上下文，读取 `.omc/axiom/` 目录中的状态文件，恢复上次会话的任务状态。

## For AI Agents

### 启动时执行顺序
1. 读取 `.omc/axiom/active_context.md`
2. 读取 `.omc/axiom/project_decisions.md`
3. 读取 `.omc/axiom/user_preferences.md`
4. 根据状态决定：IDLE（等待）/ EXECUTING（提示恢复）/ BLOCKED（需要介入）

### 修改此目录时
- 修改启动逻辑需测试三种状态（IDLE/EXECUTING/BLOCKED）的恢复场景
- 参见 `CLAUDE.md` 的 Axiom 启动协议部分

## Dependencies

### Internal
- `.omc/axiom/active_context.md` — 当前任务状态
- `src/hooks/axiom-guards/` — 门禁规则执行

<!-- MANUAL: -->
