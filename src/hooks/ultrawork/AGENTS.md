<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/ultrawork/

## Purpose
Ultrawork 模式 hook 实现。提供最大并行度的 agent 编排，同时执行多个独立任务。

## Key Files

| 文件 | 描述 |
|------|------|
| `index.ts` | Ultrawork hook 入口 |
| `session-isolation.test.ts` | 会话隔离测试 |

## For AI Agents

### Ultrawork 触发词
- "ulw"、"ultrawork"

### 并行化规则
- 独立任务并行执行（最多 20 个并发）
- 依赖任务顺序执行
- 使用 `run_in_background: true` 启动后台任务

### 状态文件
- `.omc/state/ultrawork-state.json`

### 修改此目录时
- Ultrawork 被 Ralph 包含，修改需考虑 Ralph 模式的影响
- 并发限制变更需更新 `docs/FEATURES.md`

## Dependencies

### Internal
- `src/hooks/ralph/` — Ralph 包含 ultrawork
- `skills/ultrawork/SKILL.md` — Ultrawork skill 定义

<!-- MANUAL: -->
