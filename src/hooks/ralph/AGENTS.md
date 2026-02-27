<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/hooks/ralph/

## Purpose
Ralph 模式 hook 实现。Ralph 是带 verifier 验证的自引用循环执行模式，持续执行直到 architect 验证通过。

## Key Files

| 文件 | 描述 |
|------|------|
| `index.ts` | Ralph hook 入口 |
| `loop.ts` | Ralph 循环控制逻辑（迭代、终止条件） |
| `prd.ts` | PRD（产品需求文档）处理 |
| `progress.ts` | 进度追踪和报告 |
| `verifier.ts` | 集成 verifier agent 进行完成验证 |

## For AI Agents

### Ralph 触发词
- "ralph"、"don't stop"、"must complete"

### Ralph 循环流程
```
执行任务 → verifier 验证 → 通过? → 完成 : 继续循环
```

### 状态文件
- `.omc/state/ralph-state.json`

### 修改此目录时
- Ralph 包含 ultrawork（持久性包装器），修改需考虑两者协调
- 循环终止条件变更需更新 `skills/ralph/SKILL.md`

## Dependencies

### Internal
- `src/hooks/ultrawork/` — Ralph 包含 ultrawork
- `agents/verifier.md` — 验证 agent
- `skills/ralph/SKILL.md` — Ralph skill 定义

<!-- MANUAL: -->
