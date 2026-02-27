<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-27 | Updated: 2026-02-27 -->

# src/features/delegation-routing/

## Purpose
委派路由执行模块。根据 `delegation-categories` 的分类规则，将任务实际路由到对应的 agent，处理路由冲突和回退策略。

## For AI Agents

### 路由优先级
1. 显式 agent 指定（用户直接指定）
2. 任务类型匹配（delegation-categories 规则）
3. 默认 agent（executor）

### 修改此目录时
- 路由逻辑变更需更新 `docs/standards/user-guide.md`
- 参见 `docs/standards/anti-patterns.md` 了解已知反模式

## Dependencies

### Internal
- `src/features/delegation-categories/` — 委派分类规则
- `src/agents/definitions.ts` — Agent 定义

<!-- MANUAL: -->
