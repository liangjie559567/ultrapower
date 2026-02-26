# Agent 生命周期规范

> **ultrapower-version**: 5.0.21
> **优先级**: P0（必须遵守）
> **真理之源**: `docs/standards/audit-report.md`
> **覆盖范围**: T-06（Agent 边界情况矩阵 + SubagentStopInput.success 废弃说明 + 孤儿 Agent 检测）

---

## 目录

1. [Agent 边界情况矩阵](#1-agent-边界情况矩阵)
   - 1.1 超时（Timeout）
   - 1.2 孤儿状态（Orphan）
   - 1.3 成本超限（Excessive Cost）
   - 1.4 死锁检测（Deadlock）
   - 1.5 文件冲突（File Conflict）
2. [SubagentStopInput.success 废弃说明](#2-subagentstopinutsuccess-废弃说明)
   - 2.1 废弃原因
   - 2.2 推断机制替代方案
   - 2.3 迁移指南
3. [孤儿 Agent 检测与清理](#3-孤儿-agent-检测与清理)
   - 3.1 孤儿 Agent 定义
   - 3.2 session-end hook 清理机制
   - 3.3 清理流程详解
4. [关键常量汇总](#4-关键常量汇总)
5. [AgentIntervention 接口规范](#5-agentintervention-接口规范)
6. [并发保护与状态合并](#6-并发保护与状态合并)

---

## 1. Agent 边界情况矩阵

来源：`src/hooks/subagent-tracker/index.ts`

### 1.1 超时（Timeout）

| 参数 | 值 | 来源 |
|------|-----|------|
| 检测阈值 | `STALE_THRESHOLD_MS = 5 * 60 * 1000`（5 分钟） | `subagent-tracker/index.ts` |
| 警告触发 | agent 运行超过 5 分钟 | `getStaleAgents()` |
| 自动终止触发 | agent 运行超过 **10 分钟** | `suggestInterventions()` |
| 处理策略 | 生成 `AgentIntervention`，`suggested_action: "kill"` | `suggestInterventions()` |
| 自动执行 | `auto_execute: elapsed > 10`（超过 10 分钟自动执行） | `suggestInterventions()` |

> **注意（差异点 D-08）**：超时阈值存在两个不同的值：
> - `STALE_THRESHOLD_MS = 5 分钟`：用于 `getStaleAgents()` 检测 stale agent
> - `auto_execute: elapsed > 10`：实际自动终止阈值为 **10 分钟**
>
> 两者含义不同：5 分钟触发警告，10 分钟触发自动终止。实现者不得混淆。

**超时处理伪代码**：

```typescript
// src/hooks/subagent-tracker/index.ts
function suggestInterventions(agents: SubagentInfo[]): AgentIntervention[] {
  const interventions: AgentIntervention[] = [];

  for (const agent of agents) {
    const elapsed = (Date.now() - new Date(agent.started_at).getTime()) / 1000 / 60; // 分钟

    if (elapsed > 5) { // STALE_THRESHOLD_MS / 60000
      interventions.push({
        type: "timeout",
        agent_id: agent.agent_id,
        agent_type: agent.agent_type,
        reason: `Agent running for ${elapsed}m (threshold: 5m)`,
        suggested_action: "kill",
        auto_execute: elapsed > 10, // 超过 10 分钟自动终止
      });
    }
  }

  return interventions;
}
```

### 1.2 孤儿状态（Orphan）

| 参数 | 值 | 来源 |
|------|-----|------|
| 定义 | 父会话已结束但 agent 记录仍存在于 tracking 文件中 | session-end hook |
| 检测时机 | `SessionEnd` 事件触发时 | `session-end/index.ts` |
| 处理策略 | 删除整个 `subagent-tracking.json` 文件 | `cleanupTransientState()` |
| 是否逐个 SHUTDOWN | **否**（批量清除，非逐个信号） | `cleanupTransientState()` |

> **重要**：session-end hook **不向孤儿 agent 发送 SHUTDOWN 信号**。它通过删除 `subagent-tracking.json` 文件来批量清除所有 agent 记录。这意味着孤儿 agent 的状态在会话结束时被强制清除，而非优雅关闭。

### 1.3 成本超限（Excessive Cost）

| 参数 | 值 | 来源 |
|------|-----|------|
| 常量名 | `COST_LIMIT_USD` | `subagent-tracker/index.ts` |
| 限制值 | `1.0`（美元） | 代码定义 |
| 检测字段 | `agent.token_usage.cost_usd` | `suggestInterventions()` |
| 处理策略 | 生成 `AgentIntervention`，`suggested_action: "warn"` | `suggestInterventions()` |
| 自动执行 | `auto_execute: false`（仅警告，不自动终止） | `suggestInterventions()` |

**成本检测伪代码**：

```typescript
// src/hooks/subagent-tracker/index.ts
export const COST_LIMIT_USD = 1.0;

if (agent.token_usage && agent.token_usage.cost_usd > COST_LIMIT_USD) {
  interventions.push({
    type: "excessive_cost",
    agent_id: agent.agent_id,
    agent_type: agent.agent_type,
    reason: `Agent cost $${agent.token_usage.cost_usd.toFixed(4)} exceeds limit $${COST_LIMIT_USD}`,
    suggested_action: "warn",
    auto_execute: false, // 仅警告，不自动终止
  });
}
```

### 1.4 死锁检测（Deadlock）

| 参数 | 值 | 来源 |
|------|-----|------|
| 常量名 | `DEADLOCK_CHECK_THRESHOLD` | `subagent-tracker/index.ts` |
| 阈值值 | `3` | 代码定义 |
| 实现状态 | **常量已定义，检测逻辑未实现** | 差异点 D-10 |
| AgentIntervention 类型 | `"deadlock"` 已在类型定义中 | `AgentIntervention` 接口 |

> **注意（差异点 D-10）**：`DEADLOCK_CHECK_THRESHOLD = 3` 常量已在代码中定义，`AgentIntervention` 类型也包含 `"deadlock"` 类型，但 `suggestInterventions()` 函数中**未实现**死锁检测逻辑。当前 `suggestInterventions()` 仅检测 `timeout`、`excessive_cost` 和 `file_conflict`，不检测 `deadlock`。
>
> **规范要求（v2 目标）**：实现死锁检测逻辑，当检测到 N 个 agent（N >= `DEADLOCK_CHECK_THRESHOLD`）相互等待时触发干预。

**当前实现（差异点 D-10）**：

```typescript
// src/hooks/subagent-tracker/index.ts
export const DEADLOCK_CHECK_THRESHOLD = 3; // 已定义但未使用

// suggestInterventions() 当前仅检测：
// ✅ timeout
// ✅ excessive_cost
// ✅ file_conflict
// ❌ deadlock（未实现）
```

### 1.5 文件冲突（File Conflict）

| 参数 | 值 | 来源 |
|------|-----|------|
| 检测函数 | `detectFileConflicts()` | `subagent-tracker/index.ts` |
| 检测条件 | 同一文件被多个 `RUNNING` 状态的 agent 修改 | `detectFileConflicts()` |
| 处理策略 | 生成 `AgentIntervention`，`suggested_action: "warn"` | `suggestInterventions()` |
| 自动执行 | `auto_execute: false`（仅警告） | `suggestInterventions()` |

---

## 2. SubagentStopInput.success 废弃说明

来源：`src/hooks/subagent-tracker/index.ts`

### 2.1 废弃原因

`SubagentStopInput.success` 字段已标记为 `@deprecated`，原因是 **Claude Code SDK 不提供此字段**。

```typescript
// src/hooks/subagent-tracker/index.ts
export interface SubagentStopInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  hook_event_name: "SubagentStop";
  agent_id: string;
  agent_type: string;
  output?: string;
  /** @deprecated The SDK does not provide a success field. Use inferred status instead. */
  success?: boolean;
}
```

**废弃背景**：
- SDK 在 `SubagentStop` 事件中不传递 `success` 字段
- 历史代码依赖此字段判断 agent 是否成功完成
- 直接读取 `input.success` 会导致始终得到 `undefined`，进而错误地将所有 agent 标记为失败

### 2.2 推断机制替代方案

**当前实现（Bug #1 修复）**：

```typescript
// src/hooks/subagent-tracker/index.ts
// SDK does not provide `success` field, so default to 'completed' when undefined (Bug #1 fix)
const succeeded = input.success !== false;
```

**推断规则**：

| `input.success` 值 | `succeeded` 结果 | 说明 |
|---------------------|-----------------|------|
| `undefined`（SDK 默认） | `true` | SDK 不提供此字段，默认视为成功 |
| `true` | `true` | 显式成功（向后兼容） |
| `false` | `false` | 显式失败（向后兼容） |

**设计理由**：
- `input.success !== false` 等价于"除非明确为 false，否则视为成功"
- 这是对 SDK 行为的最保守假设：agent 完成即视为成功
- 保留向后兼容性：如果未来 SDK 提供此字段，`false` 值仍能正确处理

### 2.3 迁移指南

**禁止模式**：

```typescript
// ❌ 禁止：直接读取 success 字段
const succeeded = input.success; // 始终为 undefined，导致 falsy 判断错误

// ❌ 禁止：使用 Boolean 转换
const succeeded = Boolean(input.success); // undefined -> false，错误地标记为失败
```

**正确模式**：

```typescript
// ✅ 正确：使用推断机制
const succeeded = input.success !== false;

// ✅ 正确：或使用显式注释说明意图
// SDK does not provide success field; treat undefined as success
const succeeded = input.success !== false;
```

---

## 3. 孤儿 Agent 检测与清理

来源：`src/hooks/session-end/index.ts`

### 3.1 孤儿 Agent 定义

**孤儿 Agent**：父会话（parent session）已通过 `SessionEnd` 事件结束，但 agent 的状态记录仍存在于 `subagent-tracking.json` 中的 agent。

**产生原因**：
- 会话异常终止（`reason: "other"`）
- 用户强制退出（`reason: "logout"`）
- 上下文清除（`reason: "clear"`）
- Agent 在会话结束时仍处于 `RUNNING` 或 `WAITING` 状态

### 3.2 session-end hook 清理机制

`SessionEnd` 事件触发时，`processSessionEnd()` 按以下顺序执行：

```
1. recordSessionMetrics()     — 记录会话指标（spawned/completed 计数）
2. exportSessionSummary()     — 导出到 .omc/sessions/{session_id}.json
3. cleanupTransientState()    — 删除 subagent-tracking.json（孤儿清理）
4. cleanupModeStates()        — 清理活跃模式状态文件
5. extractPythonReplSessionIds() + cleanupBridgeSessions() — 清理 Python REPL
6. triggerStopCallbacks()     — 触发通知回调（文件/Telegram/Discord）
7. notify('session-end', ...) — 触发新通知系统
```

### 3.3 清理流程详解

**`cleanupTransientState()` — 孤儿 Agent 批量清理**：

```typescript
// src/hooks/session-end/index.ts
export function cleanupTransientState(directory: string): number {
  // 删除整个 subagent-tracking.json 文件
  const trackingPath = path.join(directory, '.omc', 'state', 'subagent-tracking.json');
  if (fs.existsSync(trackingPath)) {
    fs.unlinkSync(trackingPath); // 批量清除所有 agent 记录
    filesRemoved++;
  }

  // 清理 24 小时前的 checkpoints
  // 清理 .omc/ 下的所有 .tmp 文件
}
```

**`cleanupModeStates()` — 模式状态清理**：

```typescript
// src/hooks/session-end/index.ts
// 仅清理满足以下条件的状态文件：
// 1. state.active === true（活跃状态）
// 2. state.session_id 匹配当前 session_id（或无 session_id 的旧版文件）
export function cleanupModeStates(directory: string, sessionId?: string): {
  filesRemoved: number;
  modesCleaned: string[];
}
```

**清理范围**：

| 文件 | 清理条件 |
|------|---------|
| `subagent-tracking.json` | 无条件删除（所有孤儿 agent 记录） |
| `autopilot-state.json` | `active=true` 且 session_id 匹配 |
| `ultrapilot-state.json` | `active=true` 且 session_id 匹配 |
| `ralph-state.json` | `active=true` 且 session_id 匹配 |
| `ultrawork-state.json` | `active=true` 且 session_id 匹配 |
| `ultraqa-state.json` | `active=true` 且 session_id 匹配 |
| `pipeline-state.json` | `active=true` 且 session_id 匹配 |
| `swarm-active.marker` | 无条件删除（marker 文件） |
| `swarm-summary.json` | 无条件删除（marker 文件） |
| `.omc/**/*.tmp` | 无条件删除（临时文件） |
| `.omc/checkpoints/*` | 超过 24 小时的文件 |

**session_id 匹配规则**（修复 issue #573）：

```typescript
// 防止跨会话误清理
const stateSessionId = state.session_id as string | undefined;
if (!sessionId || !stateSessionId || stateSessionId === sessionId) {
  // 清理：无 sessionId 参数 OR 状态无 session_id（旧版）OR session_id 匹配
  fs.unlinkSync(localPath);
}
// 否则：state.session_id 与当前 session 不匹配，跳过（防止清理其他并发会话的状态）
```

---

## 4. 关键常量汇总

来源：`src/hooks/subagent-tracker/index.ts`

| 常量名 | 值 | 用途 | 导出状态 |
|--------|-----|------|---------|
| `COST_LIMIT_USD` | `1.0` | 单 agent 成本上限（美元） | `export const` |
| `DEADLOCK_CHECK_THRESHOLD` | `3` | 死锁检测阈值（未实现） | `export const` |
| `STALE_THRESHOLD_MS` | `5 * 60 * 1000`（5 分钟） | Agent stale 检测阈值 | 模块内部 |
| `MAX_COMPLETED_AGENTS` | `100` | 已完成 agent 记录最大保留数 | 模块内部 |
| `LOCK_TIMEOUT_MS` | `5000`（5 秒） | 文件锁超时 | 模块内部 |
| `LOCK_RETRY_MS` | `50` | 文件锁重试间隔 | 模块内部 |
| `WRITE_DEBOUNCE_MS` | `100` | 状态写入防抖间隔 | 模块内部 |
| `MAX_FLUSH_RETRIES` | `3` | 最大刷新重试次数 | 模块内部 |
| `FLUSH_RETRY_BASE_MS` | `50` | 刷新重试指数退避基数 | 模块内部 |

**自动终止阈值**（非常量，硬编码在逻辑中）：

```typescript
// src/hooks/subagent-tracker/index.ts
auto_execute: elapsed > 10 // 10 分钟，硬编码（非常量）
```

> **规范要求（v2 目标）**：将 `10` 提取为具名常量 `AUTO_KILL_THRESHOLD_MINUTES = 10`，提升可维护性。

---

## 5. AgentIntervention 接口规范

来源：`src/hooks/subagent-tracker/index.ts`

```typescript
export interface AgentIntervention {
  type: "timeout" | "deadlock" | "excessive_cost" | "file_conflict";
  agent_id: string;
  agent_type: string;
  reason: string;
  suggested_action: "kill" | "restart" | "warn" | "skip";
  auto_execute: boolean;
}
```

**各类型的默认行为**：

| `type` | `suggested_action` | `auto_execute` | 实现状态 |
|--------|-------------------|----------------|---------|
| `timeout` | `"kill"` | `elapsed > 10`（10 分钟后为 true） | ✅ 已实现 |
| `excessive_cost` | `"warn"` | `false` | ✅ 已实现 |
| `file_conflict` | `"warn"` | `false` | ✅ 已实现 |
| `deadlock` | 未定义 | 未定义 | ❌ 未实现（差异点 D-10） |

**`auto_execute` 语义**：

- `true`：系统自动执行 `suggested_action`，无需人工确认
- `false`：仅生成建议，需人工或上层逻辑决定是否执行

---

## 6. 并发保护与状态合并

来源：`src/hooks/subagent-tracker/index.ts`

### 6.1 四层并发保护（subagent-tracking.json）

`subagent-tracking.json` 是并发写入最频繁的状态文件，采用四层保护：

```
第一层：debounce（WRITE_DEBOUNCE_MS = 100ms）
  → 合并短时间内的多次写入请求

第二层：flushInProgress Set
  → 防止同一进程内的并发 flush

第三层：mergeTrackerStates()
  → 读取磁盘状态后合并，防止覆盖其他进程的写入

第四层：文件锁（PID:timestamp 格式）
  → 跨进程互斥，LOCK_TIMEOUT_MS = 5000ms
```

### 6.2 mergeTrackerStates 合并规则

```typescript
// 计数器：取 Math.max，防止双重计数
const total_spawned = Math.max(diskState.total_spawned, pendingState.total_spawned);

// 同一 agent_id 的状态：newer timestamp wins
if (pendingTime >= existingTime) {
  agentMap.set(agent.agent_id, agent);
}
```

### 6.3 writeTrackingStateImmediate 直接写入（差异点 D-07）

```typescript
// src/hooks/subagent-tracker/index.ts（当前实现）
function writeTrackingStateImmediate(directory: string, state: SubagentTrackingState): void {
  const statePath = getStateFilePath(directory);
  state.last_updated = new Date().toISOString();
  try {
    writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8"); // 直接写入，无原子保护
  } catch (error) {
    console.error("[SubagentTracker] Error writing state:", error);
  }
}
```

> **注意（差异点 D-07）**：`writeTrackingStateImmediate()` 使用 `writeFileSync` 直接写入，绕过了 `atomicWriteJsonSync` 的原子保护。这是已知技术债务（TD-4），v2 目标是统一为 debounce + atomic 双层保护。

### 6.4 MAX_COMPLETED_AGENTS 驱逐策略

```typescript
// 已完成 agent 记录超过 MAX_COMPLETED_AGENTS = 100 时，驱逐最旧的记录
// 防止 subagent-tracking.json 无限增长
```

---

## 差异点说明

| 差异点 | 描述 | 当前状态 | 规范要求 |
|--------|------|---------|---------|
| D-07 | subagent-tracker 内部写入 | `writeFileSync` 直接写入（无原子保护） | v2 统一为 atomicWriteJsonSync |
| D-08 | 超时阈值双重含义 | 5 分钟（stale 检测）vs 10 分钟（自动终止） | 必须区分，不得混淆 |
| D-10 | 死锁检测未实现 | `DEADLOCK_CHECK_THRESHOLD = 3` 已定义，逻辑未实现 | v2 实现死锁检测逻辑 |
