# Domain Expert Review: Draft PRD - Agent 可观测性平台

## 1. Logic Validation (逻辑验证)

### SQLite 同步写入阻塞问题
- **结论**: Adjustment Needed
- better-sqlite3 是同步 API，每次 `INSERT` 会在 Node.js 主线程上阻塞。对于 agent 执行追踪（高频写入），这会直接延迟 agent 响应。
- 现有 `job-state-db.ts` 已启用 `PRAGMA journal_mode = WAL`，WAL 模式允许并发读，但**写入仍然是串行阻塞的**。
- 实际影响：单次 SQLite 同步写入约 0.1–2ms，在 agent 热路径上累积可达数十毫秒。
- 缓解方案（不需要改变技术选型）：
  1. 写入操作放入内存队列，用 `setImmediate` 异步 flush，避免阻塞调用方。
  2. 对非关键路径（tool_calls 详情）使用批量写入而非逐条写入。
  3. 加 `PRAGMA synchronous = NORMAL`（WAL 模式下安全，减少 fsync 次数）。

### P95 计算在 SQLite 中的实现
- **结论**: Adjustment Needed
- SQLite 没有内置 `PERCENTILE_CONT` 函数（PostgreSQL/DuckDB 有）。
- 正确实现方式：
  ```sql
  -- 需要 ORDER BY + LIMIT/OFFSET 模拟
  SELECT duration_ms FROM tool_calls
  WHERE tool_name = ?
  ORDER BY duration_ms
  LIMIT 1 OFFSET (
    SELECT CAST(COUNT(*) * 0.95 AS INTEGER) FROM tool_calls WHERE tool_name = ?
  );
  ```
- 这个查询在数据量大时性能差（全表扫描）。PRD 未说明数据量预期，需要在 `duration_ms` 上建索引，并限制查询窗口（如最近 1000 条）。
- 替代方案：在应用层用 JavaScript 计算 P95，从 SQLite 取原始数据后排序，更灵活且无 SQL 复杂度。

### 成本追踪字段完整性
- **结论**: Adjustment Needed
- PRD 仅提到 haiku/sonnet/opus 单价，但现有 `cost-estimator.ts` 已实现四个维度：`inputCost`、`outputCost`、`cacheWriteCost`、`cacheReadCost`。
- agent_runs 表如果只存 `total_cost`，会丢失 cache 节省信息，无法做成本优化分析。
- 必须存储：`input_tokens`、`output_tokens`、`cache_creation_tokens`、`cache_read_tokens`，而非仅存金额。

---

## 2. Industry Standard Check (标准合规)

### Token 成本估算准确性
- **结论**: Pass（有条件）
- 现有 `types.ts` 中的 PRICING 硬编码值与 Anthropic 官方定价（截至 2026-03）对比：
  | 模型 | PRD/代码 Input/MTok | PRD/代码 Output/MTok | 官方 Input/MTok | 官方 Output/MTok |
  |------|---------------------|----------------------|-----------------|------------------|
  | Haiku 4 | $0.80 | $4.00 | $0.80 | $4.00 |
  | Sonnet 4.x | $3.00 | $15.00 | $3.00 | $15.00 |
  | Opus 4.x | $15.00 | $75.00 | $15.00 | $75.00 |
- 数值准确。但 `cacheWriteMarkup: 0.25` 表示 cache write 价格 = input × 1.25，实际 Anthropic 定价是 cache write = input × **1.25**（即 +25%），正确。
- `cacheReadDiscount: 0.90` 表示 cache read = input × 0.10（节省 90%），正确。
- 风险：硬编码定价会随 Anthropic 调价而过时。代码已有 `tokscale-adapter.ts` 动态定价路径，PRD 应明确优先使用动态路径，硬编码仅作 fallback。

### 可观测性行业标准对比
- **结论**: Adjustment Needed
- 行业标准可观测性三支柱：Metrics（指标）、Traces（追踪）、Logs（日志）。
- PRD 当前覆盖：Metrics（P95 耗时、成本）+ 部分 Traces（agent_runs、tool_calls）。
- 缺失：结构化 Logs（错误详情、agent 决策链）、Span 关联（parent_run_id 将 tool_call 关联到 agent_run）。
- 不是造轮子：OpenTelemetry 是标准，但对 CLI 工具引入 OTEL SDK 过重。SQLite 方案合理，但 schema 设计应参考 OTEL Span 模型（trace_id、span_id、parent_span_id）。

---

## 3. Value Proposition (价值主张)

### 开发者用户
- **收益**: 能看到哪个 agent/tool 最慢、最贵，直接指导优化决策。P95 耗时可识别长尾问题。
- **风险**: 如果同步写入拖慢 agent，用户会关掉这个功能，价值归零。性能影响必须 < 1ms/写入。

### 成本敏感用户
- **收益**: cache token 分解（write vs read）能量化 prompt caching 的实际节省，这是现有工具普遍缺失的。
- **前提**: 必须存储四维 token 数据，而非仅存总成本。

---

## 4. 遗漏的可观测性维度

以下维度在 PRD 中未提及，但对 agent 系统有实际价值：

| 维度 | 说明 | 优先级 |
|------|------|--------|
| `parent_run_id` | tool_call 关联到 agent_run，支持调用链追踪 | P0 |
| `error_type` / `error_message` | 区分超时、API 错误、用户取消 | P0 |
| `agent_model` | 记录实际使用的模型（含 fallback 后的模型） | P1 |
| `retry_count` | tool 重试次数，识别不稳定工具 | P1 |
| `context_window_usage` | input_tokens / max_context，识别接近上限的 agent | P2 |

---

## Conclusion (结论)

**Modification Required**

### Critical Domain Gaps (关键领域缺陷)

1. **同步写入阻塞**：必须在热路径上使用异步队列 flush，否则会降低 agent 执行性能，与可观测性的"零侵入"原则相悖。

2. **P95 实现未定义**：SQLite 无原生百分位函数，PRD 需明确实现策略（SQL 模拟 vs 应用层计算），并指定查询窗口大小以保证性能。

3. **token 存储粒度不足**：必须存储四维 token 数据（input/output/cache_write/cache_read），仅存总成本会丢失 cache 优化分析能力。

4. **缺少 `parent_run_id`**：没有 span 关联，tool_calls 表是孤立数据，无法重建 agent 执行链，可观测性价值大幅降低。
