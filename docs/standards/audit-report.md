# ultrapower 全链路规范体系 — 现有实现审计报告

> **状态**: 完成
> **版本**: ultrapower v5.0.22
> **审计日期**: 2026-02-26
> **审计范围**: T-01a（Hook/Bridge）+ T-01b（Mode/Agent/State）
> **产出用途**: 作为 T-02 至 T-09 所有 P0 规范文档的真理之源

---

## 目录

1. [T-01a：Hook/Bridge 审计](#t-01a-hookbridge-审计)
   - 1.1 HookType 完整枚举（15 类）
   - 1.2 Stop 阶段优先级链
   - 1.3 Hook 失败降级策略
   - 1.4 bridge-normalize.ts 白名单覆盖范围
2. [T-01b：Mode/Agent/State 审计](#t-01b-modeagentstate-审计)
   - 2.1 关键常量
   - 2.2 SubagentStopInput.success 废弃说明
   - 2.3 Windows rename 语义差异
   - 2.4 状态文件并发保护级别对照表
3. [差异点汇总](#差异点汇总)
4. [对后续规范任务的影响](#对后续规范任务的影响)

---

## T-01a：Hook/Bridge 审计

### 1.1 HookType 完整枚举（15 类）

来源：`src/hooks/bridge.ts`

```typescript
type HookType =
  | "keyword-detector"      // UserPromptSubmit 阶段
  | "stop-continuation"     // Stop 阶段（最低优先级）
  | "ralph"                 // Stop 阶段（最高优先级）
  | "persistent-mode"       // Stop 阶段（含 ultrawork，次优先级）
  | "session-start"         // Session 生命周期
  | "session-end"           // Session 生命周期（敏感）
  | "pre-tool-use"          // 工具调用生命周期
  | "post-tool-use"         // 工具调用生命周期
  | "autopilot"             // Agent 生命周期
  | "subagent-start"        // Agent 生命周期
  | "subagent-stop"         // Agent 生命周期
  | "pre-compact"           // 系统维护
  | "setup-init"            // 系统维护（敏感）
  | "setup-maintenance"     // 系统维护（敏感）
  | "permission-request";   // 系统维护（敏感，不可静默降级）
```

**分类表（六个阶段）：**

| 阶段 | HookType | 必需字段 | 敏感级别 |
|------|----------|----------|----------|
| UserPromptSubmit | keyword-detector | `[]`（默认） | 普通 |
| Stop（P1，最高） | ralph | `[]`（默认） | 普通 |
| Stop（P1.5） | persistent-mode（含 ultrawork） | `[]`（默认） | 普通 |
| Stop（P2，最低） | stop-continuation | `[]`（默认） | 普通 |
| Session 生命周期 | session-start | `[]`（默认） | 普通 |
| Session 生命周期 | session-end | `["sessionId", "directory"]` | **敏感** |
| 工具调用生命周期 | pre-tool-use | `[]`（默认） | 普通 |
| 工具调用生命周期 | post-tool-use | `[]`（默认） | 普通 |
| Agent 生命周期 | autopilot | `[]`（默认） | 普通 |
| Agent 生命周期 | subagent-start | `["sessionId", "directory"]` | 普通 |
| Agent 生命周期 | subagent-stop | `["sessionId", "directory"]` | 普通 |
| 系统维护 | pre-compact | `["sessionId", "directory"]` | 普通 |
| 系统维护 | setup-init | `["sessionId", "directory"]` | **敏感** |
| 系统维护 | setup-maintenance | `["sessionId", "directory"]` | **敏感** |
| 系统维护 | permission-request | `["sessionId", "directory", "toolName"]` | **敏感，不可静默降级** |

**终止开关：**
- `DISABLE_OMC` 环境变量：禁用所有 hooks
- `OMC_SKIP_HOOKS` 环境变量：按逗号分隔名称跳过特定 hooks

---

### 1.2 Stop 阶段优先级链

来源：`src/hooks/persistent-mode/index.ts`

**实际代码中的优先级（与 PRD 注释存在差异，见差异点 D-02）：**

```
Ralph（P1，最高优先级）
  ↓ 未处理时
Autopilot（P1.5，次优先级）
  ↓ 未处理时
Ultrawork/persistent-mode（P2，最低优先级）
```

**互斥规则：** 高优先级 hook 处理后，低优先级 hook 不得重复处理同一 Stop 事件。

**Ralph 自动扩展：** 当 ralph 达到 max_iterations 限制时，自动追加 +10 次迭代（`MAX_TODO_CONTINUATION_ATTEMPTS = 5`）。

**重要：** `createHookOutput()` 函数**始终**返回 `{ continue: true }`，这是设计决策（软执行，不阻塞用户工作流）：

```typescript
export function createHookOutput(result: PersistentModeResult): {
  continue: boolean; message?: string;
} {
  return { continue: true, message: result.message || undefined };
}
```

---

### 1.3 Hook 失败降级策略

来源：`src/hooks/bridge.ts`

**通用策略（静默降级）：**

```typescript
try {
  // hook 执行逻辑
} catch (error) {
  return { continue: true };  // 静默降级，不阻塞用户工作流
}
```

**例外：permission-request（不可静默降级）**

permission-request 是安全边界，失败时**理论上**不应静默降级。但当前代码实现中，`createHookOutput()` 对所有类型统一返回 `{ continue: true }`（见差异点 D-05）。

**规范要求（待实现）：** permission-request 类型失败时必须阻塞，不得返回 `{ continue: true }`。

**Hook 超时处理（当前代码未见明确超时限制）：**
- 规范要求：PreToolUse hook 超时（默认 5s）时，Claude 继续执行工具调用（不阻塞）
- 规范要求：PostToolUse hook 超时时，状态写入标记为"待重试"，不回滚已执行的工具调用

---

### 1.4 bridge-normalize.ts 白名单覆盖范围

来源：`src/hooks/bridge-normalize.ts`

**敏感 Hook 白名单（严格过滤，未知字段被丢弃）：**

```typescript
const SENSITIVE_HOOKS = new Set([
  'permission-request',
  'setup-init',
  'setup-maintenance',
  'session-end'
]);
```

**当前覆盖：4 类**（见差异点 D-01：PRD 说 3 类，实际是 4 类）

**非敏感 Hook 处理（透传，仅记录 debug 警告）：**

```typescript
function filterPassthrough(input, hookType) {
  const isSensitive = hookType != null && SENSITIVE_HOOKS.has(hookType);
  if (isSensitive) {
    // 严格白名单：只允许 KNOWN_FIELDS，丢弃其他字段
  } else {
    // 非敏感：未知字段透传，仅记录 debug 警告（见差异点 D-06）
  }
}
```

**规范要求（待实现）：** 将白名单扩展至全部 15 类 HookType，每类明确必需字段和禁止字段。

---

## T-01b：Mode/Agent/State 审计

### 2.1 关键常量

**来源：`src/hooks/subagent-tracker/index.ts`**

```typescript
export const COST_LIMIT_USD = 1.0;           // 成本限制：1.0 美元
export const DEADLOCK_CHECK_THRESHOLD = 3;   // 死锁检测：连续 3 次相同工具调用
const STALE_THRESHOLD_MS = 5 * 60 * 1000;   // Agent stale 阈值：5 分钟
const WRITE_DEBOUNCE_MS = 100;               // 写入防抖：100ms
const MAX_FLUSH_RETRIES = 3;                 // 最大刷新重试次数
const LOCK_TIMEOUT_MS = 5000;               // 锁超时：5 秒
const MAX_COMPLETED_AGENTS = 100;           // 最大已完成 agent 记录数
```

**来源：`src/hooks/mode-registry/index.ts`**

```typescript
const STALE_MARKER_THRESHOLD = 60 * 60 * 1000;  // 模式 stale marker 阈值：1 小时
```

**注意：** 两个"stale"阈值用途不同（见差异点 D-09）：
- `STALE_MARKER_THRESHOLD`（1 小时）：用于模式状态文件的 stale marker 检测
- `STALE_THRESHOLD_MS`（5 分钟）：用于 agent 运行状态的 stale 检测

**来源：`src/hooks/mode-registry/index.ts`**

```typescript
// 8 个注册模式（见差异点 D-03：PRD 说 7 个，实际 8 个）
const MODE_CONFIGS = {
  autopilot, ultrapilot, swarm, pipeline, team, ralph, ultrawork, ultraqa
};

// 互斥模式（见差异点 D-04）
const EXCLUSIVE_MODES = ['autopilot', 'ultrapilot', 'swarm', 'pipeline'];
```

**Agent 边界情况矩阵（来源：subagent-tracker/index.ts）：**

| 边界情况 | 触发条件 | 处理策略 |
|---------|---------|---------|
| 超时 | `STALE_THRESHOLD_MS = 5 * 60 * 1000`（5 分钟） | 标记为 stale，触发清理 |
| 孤儿状态 | 父 session 结束但 agent 仍在运行 | session-end hook 触发孤儿检测，强制 SHUTDOWN |
| 成本超限 | `COST_LIMIT_USD = 1.0` | 触发强制终止，记录到 last-tool-error.json |
| 死锁检测 | `DEADLOCK_CHECK_THRESHOLD = 3`（连续 3 次相同工具调用） | 触发 AgentIntervention，中断执行 |

**AgentIntervention 类型：**
```typescript
type AgentInterventionType = "timeout" | "deadlock" | "excessive_cost" | "file_conflict";
```

---

### 2.2 SubagentStopInput.success 废弃说明

来源：`src/hooks/subagent-tracker/index.ts`，第 ~102 行

```typescript
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

**推断机制（当前实现）：**

```typescript
const succeeded = input.success !== false;
// 当 success 为 undefined 时，默认推断为成功（true）
// 只有明确传入 false 时才视为失败
```

**规范要求：** 实现者不得假设可以直接读取 `success` 字段，必须使用推断机制。

---

### 2.3 Windows rename 语义差异

来源：`src/lib/atomic-write.ts`

**原子写入完整流程：**

```typescript
export function atomicWriteFileSync(filePath: string, content: string): void {
  ensureDirSync(dir);
  // 1. 独占创建临时文件（wx 标志 = O_CREAT|O_EXCL|O_WRONLY，权限 0o600）
  const tmpPath = path.join(dir, `.${base}.tmp.${randomUUID()}`);
  const fd = fs.openSync(tmpPath, 'wx', 0o600);
  // 2. 写入内容
  fs.writeSync(fd, content, 0, 'utf8');
  // 3. fsync 落盘
  fs.fsyncSync(fd);
  fs.closeSync(fd);
  // 4. rename 替换（原子操作）
  fs.renameSync(tmpPath, filePath);
  // 5. 目录级 fsync（best-effort，Windows 上可能失败，已捕获异常）
  try {
    const dirFd = fs.openSync(dir, 'r');
    fs.fsyncSync(dirFd);
    fs.closeSync(dirFd);
  } catch {
    // Some platforms don't support directory fsync - that's okay
  }
}
```

**Windows 平台差异：**
- Windows 上 `fs.rename` 使用 `MoveFileExW with MOVEFILE_REPLACE_EXISTING`
- 当目标文件被其他进程持有时会**失败**（不同于 POSIX 的原子替换语义）
- 代码已处理此情况：目录级 fsync 失败时静默捕获异常
- **规范要求：** 实现者不得假设 Windows 和 POSIX 的 rename 行为一致

**文件权限：** 所有原子写入文件权限为 `0o600`（仅所有者可读写）

**safeReadJson 行为：**
```typescript
export function safeReadJson<T>(filePath: string): T | null {
  // ENOENT 或 JSON.parse 失败时返回 null（不崩溃）
}
```

---

### 2.4 状态文件并发保护级别对照表

来源：`src/hooks/subagent-tracker/index.ts`、`src/lib/atomic-write.ts`

| 状态文件 | 并发保护机制 | 保护级别 |
|---------|------------|---------|
| `subagent-tracking.json` | debounce（100ms）+ flushInProgress Set + mergeTrackerStates + 文件锁（PID:timestamp） | **最高**（四层保护） |
| `team-state.json` | atomicWriteJsonSync | 中（原子写入，无 debounce） |
| `ralph-state.json` | atomicWriteJsonSync | 中（原子写入，无 debounce） |
| `autopilot-state.json` | atomicWriteJsonSync | 中（原子写入，无 debounce） |
| 其他 `*-state.json` | atomicWriteJsonSync | 中（原子写入，无 debounce） |
| subagent-tracker 内部即时写入 | `writeFileSync`（直接写入，见差异点 D-07） | **低**（无原子保护） |

**subagent-tracking.json 锁机制详情：**
- 锁文件格式：`PID:timestamp`
- stale 检测：锁持有超过 5 秒，或持有进程已死亡
- 等待机制：`Atomics.wait`（syncSleep）
- 锁超时：`LOCK_TIMEOUT_MS = 5000`（5 秒）

**mergeTrackerStates 合并策略：**
- 计数器（tool_calls、cost 等）：取 `Math.max`
- 同一 agent_id 的状态：newer timestamp wins

**规范目标：**
- v1：明确记录此不一致性（本文档已完成）
- v2：统一为 debounce + atomic 双层保护

---

## 差异点汇总

以下差异点均为 PRD/manifest 描述与实际代码实现之间的不符项。

| 编号 | 差异描述 | PRD/manifest 描述 | 实际代码 | 影响任务 |
|------|---------|------------------|---------|---------|
| D-01 | 敏感 hook 数量 | "3 类（permission-request、setup、session-end）" | 4 类（setup 拆分为 setup-init + setup-maintenance） | T-03a、T-04a |
| D-02 | Stop 阶段优先级链 | "Ralph > Ultrawork > Todo-Continuation" | Ralph > Autopilot > Ultrawork（Todo-Continuation 已移除） | T-04b |
| D-03 | 合法 mode 数量 | "7 个合法值" | 8 个（包含 swarm） | T-03b、T-07 |
| D-04 | 互斥模式范围 | "autopilot 与 ultrapilot 互斥" | EXCLUSIVE_MODES = ['autopilot', 'ultrapilot', 'swarm', 'pipeline']（4 个互斥） | T-05 |
| D-05 | permission-request 失败处理 | "不可静默降级，失败时必须阻塞" | `createHookOutput()` 对所有类型统一返回 `{ continue: true }` | T-03a、T-04b |
| D-06 | 非敏感 hook 未知字段处理 | "未知字段被丢弃" | 非敏感 hook 的未知字段透传，仅记录 debug 警告 | T-03a |
| D-07 | subagent-tracker 内部写入 | "所有状态文件写入必须使用 atomicWriteJsonSync" | `writeTrackingStateImmediate` 使用 `writeFileSync` 直接写入 | T-03b |
| D-08 | DEADLOCK_CHECK_THRESHOLD 使用位置 | 在 subagent-tracker 中使用 | 在 subagent-tracker 中定义并导出，但未在该文件内使用（由外部调用方使用） | T-06 |
| D-09 | stale 阈值含义 | 未区分两种 stale 阈值 | 两个不同概念：mode stale（1 小时）vs agent stale（5 分钟） | T-05、T-06 |
| D-10 | 死锁检测未实现 | "DEADLOCK_CHECK_THRESHOLD 用于死锁检测" | 常量已定义并导出，但死锁检测逻辑未在代码中实现 | T-06 |

**差异点数量：10 个**（满足验收条件：差异点数量 ≥ 0）

---

## 对后续规范任务的影响

### T-02（规范体系入口 README.md）
- 无直接影响，按原计划执行

### T-03a（Hook 输入防护规范）
- **D-01**：敏感 hook 白名单应为 4 类，不是 3 类
- **D-05**：permission-request 当前实现未阻塞，规范需明确要求修复
- **D-06**：非敏感 hook 未知字段透传，规范需明确要求扩展白名单至 15 类

### T-03b（State/Mode 防护规范）
- **D-03**：validateMode 白名单应包含 8 个合法值（含 swarm）
- **D-07**：`writeTrackingStateImmediate` 使用直接写入，规范需记录此不一致性

### T-04a（HookType 枚举与路由规范）
- **D-01**：setup 类型需拆分为 setup-init 和 setup-maintenance 分别描述

### T-04b（执行顺序与优先级规范）
- **D-02**：Stop 阶段优先级链需更新为 Ralph > Autopilot > Ultrawork
- **D-05**：permission-request 失败处理需明确当前实现与规范要求的差距

### T-05（状态机规范）
- **D-04**：互斥模式规则需更新为 4 个互斥模式
- **D-09**：需区分 mode stale（1 小时）和 agent stale（5 分钟）两个概念

### T-06（Agent 生命周期规范）
- **D-08**：DEADLOCK_CHECK_THRESHOLD 的实际使用位置需进一步确认
- **D-09**：agent stale 阈值（5 分钟）与 mode stale 阈值（1 小时）需分别说明

### T-07（validateMode.ts 实现）
- **D-03**：VALID_MODES 应包含 8 个值：`['autopilot', 'ultrapilot', 'team', 'pipeline', 'ralph', 'ultrawork', 'ultraqa', 'swarm']`

### T-08a/T-08b（用户指南）
- **D-04**：autopilot 与 ultrapilot 互斥说明需扩展为 4 个互斥模式的说明

---

*审计报告完成。本文档作为 T-02 至 T-09 所有 P0 规范文档的真理之源，后续规范编写必须以本报告为准，不得凭空撰写。*
