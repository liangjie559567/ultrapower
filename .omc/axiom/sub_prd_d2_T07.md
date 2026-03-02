---
task: T-07
title: 单元测试（≥15 用例）
depends: [T-03, T-04, T-05, T-06]
---

# T-07: 单元测试

## 目标
在 `src/hooks/observability/__tests__/` 创建测试文件，覆盖核心模块。

## 测试文件与用例

### observability.test.ts（合并测试，≥15 用例）

**db（3 用例）**
- DB 初始化后 3 张表存在
- WAL 模式已启用（`PRAGMA journal_mode` 返回 'wal'）
- 重复调用 getDb() 返回同一实例

**write-queue（3 用例）**
- enqueue 后 pending 增加
- flush 后 pending 归零
- flush 后数据写入 DB

**agent-tracker（3 用例）**
- startRun 返回 UUID
- endRun 后 status=completed，duration_ms > 0
- parent_run_id 正确存储

**tool-tracker（3 用例）**
- startCall/endCall 写入完整记录
- success=false 时 error_msg 存储
- duration_ms 计算正确

**cost-estimator（3 用例）**
- haiku 成本计算正确
- sonnet 成本计算正确
- record 写入四维 token

**query-engine（3 用例）**
- getToolCalls p95 计算正确（插入 100 条测试数据）
- getCostSummary 按 model 分组
- getAgentRuns 按 session_id 过滤

## 实现要点
- 每个测试用独立 in-memory DB（`:memory:`）或 tmpDir
- `afterEach` 清理 DB 连接
- 使用 vitest `describe/it/expect`

## 验收
- ≥ 15 个测试用例全部通过
- tsc --noEmit 0 errors
