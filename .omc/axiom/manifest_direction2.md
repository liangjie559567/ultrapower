---
title: "Agent 可观测性平台 Manifest"
direction: 2
status: ready
created: 2026-03-02
---

# Manifest：Agent 可观测性平台

## Impact Scope

```
src/hooks/observability/
  db.ts
  write-queue.ts
  agent-tracker.ts
  tool-tracker.ts
  cost-estimator.ts
  query-engine.ts
  __tests__/
    db.test.ts
    write-queue.test.ts
    agent-tracker.test.ts
    tool-tracker.test.ts
    cost-estimator.test.ts
    query-engine.test.ts
skills/trace/SKILL.md
skills/ax-status/SKILL.md
```

## Task DAG

```
T-01 (db.ts) ──────────────────────────────────────────┐
T-02 (write-queue.ts) ─────────────────────────────────┤
T-03 (agent-tracker.ts) ← T-01, T-02 ──────────────────┤
T-04 (tool-tracker.ts) ← T-01, T-02 ───────────────────┤
T-05 (cost-estimator.ts) ← T-01, T-02 ─────────────────┤
T-06 (query-engine.ts) ← T-03, T-04, T-05 ─────────────┤
T-07 (单元测试) ← T-03, T-04, T-05, T-06 ──────────────┤
T-08 (skill 集成) ← T-06 ──────────────────────────────┘
```

## Tasks

| ID | 名称 | 依赖 | 文件 |
|----|------|------|------|
| T-01 | SQLite DB 初始化 | — | `src/hooks/observability/db.ts` |
| T-02 | 异步写入队列 | — | `src/hooks/observability/write-queue.ts` |
| T-03 | Agent 追踪器 | T-01, T-02 | `src/hooks/observability/agent-tracker.ts` |
| T-04 | 工具调用追踪器 | T-01, T-02 | `src/hooks/observability/tool-tracker.ts` |
| T-05 | 成本估算器 | T-01, T-02 | `src/hooks/observability/cost-estimator.ts` |
| T-06 | 查询引擎 | T-03, T-04, T-05 | `src/hooks/observability/query-engine.ts` |
| T-07 | 单元测试（≥15 用例） | T-03~T-06 | `src/hooks/observability/__tests__/` |
| T-08 | Skill 集成 | T-06 | `skills/trace/SKILL.md`, `skills/ax-status/SKILL.md` |
