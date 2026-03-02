# Tech Feasibility Review: Agent 可观测性平台

## 1. Architecture Impact (架构影响)

- Schema Changes: Yes — 新增 `.omc/observability.db`（SQLite），3 张新表
- API Changes: Yes — 新增 `src/hooks/observability/` 模块 + `skills/ax-observe/SKILL.md`

**关键发现：严重重复风险**

PRD 提议的功能与现有代码高度重叠：

| PRD 提议 | 已有实现 |
|---------|---------|
| `agent_runs` 表（agent_type/model/duration_ms） | `src/hooks/subagent-tracker/index.ts` — `SubagentInfo` 接口已有完整字段 |
| `tool_calls` 表（tool_name/duration_ms/success） | `recordToolUsageWithTiming()` 已实现，存于 JSON state |
| `cost_records` 表（token 估算/模型单价） | `src/analytics/cost-estimator.ts` — `calculateCost()` 已支持 haiku/sonnet/opus |
| tool 聚合统计（avg/p95/failure_rate） | `getAgentPerformance()` 已计算 avg_ms/max_ms/failures |
| query-engine | `src/analytics/query-engine.ts` 已存在 |

**结论：PRD 描述的是对已有 JSON-based 追踪系统的 SQLite 迁移，而非全新功能。**

---

## 2. Risk Assessment (风险评估)

- Complexity Score (1-10): **4**
- POC Required: No

**风险点：**

1. **数据迁移**（中风险）：现有 `subagent-tracking.json` 数据需要决策——迁移还是并行运行？PRD 未说明。
2. **并发写入**（低风险）：`better-sqlite3` 是同步 API，与现有 debounce+lock 机制兼容，但需要确认 WAL 模式开启以支持并发读。
3. **Hook 集成点**（低风险）：`PreToolUse`/`PostToolUse`/`SubagentStart`/`SubagentStop` 已有 hook 接入点，新模块只需挂载。
4. **p95 计算**（低风险）：SQLite 无内置 percentile 函数，需要应用层排序计算，数据量小时可接受。

---

## 3. Implementation Plan (大致实现计划)

**Backend（约 2 天）：**
- `src/hooks/observability/db.ts`：初始化 3 张表，开启 WAL 模式
- `src/hooks/observability/agent-tracker.ts`：复用 `SubagentInfo` 类型，写入 `agent_runs`
- `src/hooks/observability/tool-tracker.ts`：复用 `ToolUsageEntry`，写入 `tool_calls`
- `src/hooks/observability/cost-estimator.ts`：调用已有 `calculateCost()`，写入 `cost_records`
- `src/hooks/observability/query-engine.ts`：聚合查询（avg/p95/failure_rate）

**Frontend/Skill（约 0.5 天）：**
- `skills/ax-observe/SKILL.md`：调用 query-engine 输出格式化报告
- `/ax-status` 集成：追加 observability 摘要

**测试（约 1 天）：**
- ≥15 个测试用例覆盖：表创建、写入、聚合查询、成本估算

---

## Conclusion (结论)

- **Pass**（条件通过）
- Estimated Effort: **3~4 天**

**前置决策（需 PRD 补充）：**
1. 是否废弃现有 JSON 追踪，完全迁移到 SQLite？还是双轨并行？
2. `observability.db` 是否纳入 `.gitignore`？
3. p95 计算的数据窗口定义（最近 N 条 vs 时间窗口）？

建议在实现前明确第 1 点，否则会产生数据双写的维护负担。
