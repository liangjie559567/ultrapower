# 反模式清单

> **ultrapower-version**: 5.0.21
> **优先级**: P0（必须遵守）
> **真理之源**: `docs/standards/audit-report.md`
> **覆盖范围**: T-09（已知反模式 + 正确替代方案）

---

## 目录

1. [安全反模式](#1-安全反模式)
2. [状态管理反模式](#2-状态管理反模式)
3. [Agent 生命周期反模式](#3-agent-生命周期反模式)
4. [并发反模式](#4-并发反模式)
5. [模式路由反模式](#5-模式路由反模式)
6. [测试反模式](#6-测试反模式)

---

## 1. 安全反模式

### AP-S01：未校验 mode 参数直接拼接路径

**来源**：`docs/standards/runtime-protection.md` §2.4

```typescript
// ❌ 反模式：路径遍历风险
const stateFilePath = `.omc/state/${mode}-state.json`;
// 攻击者可传入 mode = "../../etc/passwd" 读取任意文件
```

```typescript
// ✅ 正确：先校验再拼接
import { assertValidMode } from '../lib/validateMode';
const validMode = assertValidMode(mode);
const stateFilePath = `.omc/state/${validMode}-state.json`;
```

**规则**：所有使用 mode 参数构建文件路径的代码，必须先调用 `assertValidMode()` 或 `validateMode()`。

---

### AP-S02：直接读取 SubagentStopInput.success

**来源**：`docs/standards/agent-lifecycle.md` §2

```typescript
// ❌ 反模式：SDK 不提供此字段，始终为 undefined
const succeeded = input.success;         // undefined → falsy → 错误地标记为失败
const succeeded = Boolean(input.success); // undefined → false → 同上
```

```typescript
// ✅ 正确：使用推断机制
// SDK does not provide success field; treat undefined as success
const succeeded = input.success !== false;
```

**规则**：`SubagentStopInput.success` 已标记为 `@deprecated`，禁止直接读取。

---

### AP-S03：在状态文件中存储敏感信息

```typescript
// ❌ 反模式：状态文件可能被其他进程读取
state_write(mode="autopilot", {
  api_key: "sk-...",
  user_token: "Bearer ...",
});
```

```typescript
// ✅ 正确：状态文件只存储执行状态，不存储凭证
state_write(mode="autopilot", {
  current_phase: "executing",
  task_id: "task-123",
  active: true,
});
```

---

## 2. 状态管理反模式

### AP-ST01：混淆两种 stale 阈值

**来源**：`docs/standards/state-machine.md` §4（差异点 D-09）

```typescript
// ❌ 反模式：将 agent stale 阈值用于 mode stale 检测
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 分钟
if (Date.now() - modeState.last_updated > STALE_THRESHOLD_MS) {
  // 错误：mode stale 阈值应为 1 小时，不是 5 分钟
  cleanupModeState();
}
```

```typescript
// ✅ 正确：区分两种阈值
// Agent stale（subagent-tracker）：5 分钟
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

// Mode stale marker（mode-registry）：1 小时
const STALE_MARKER_THRESHOLD = 60 * 60 * 1000;
```

**规则**：两种 stale 阈值含义不同，不得混用。详见 `docs/standards/state-machine.md` §4。

---

### AP-ST02：跨会话误清理状态文件

**来源**：`docs/standards/agent-lifecycle.md` §3.3（修复 issue #573）

```typescript
// ❌ 反模式：无条件清理所有活跃状态
for (const stateFile of activeStateFiles) {
  fs.unlinkSync(stateFile); // 可能删除其他并发会话的状态
}
```

```typescript
// ✅ 正确：检查 session_id 匹配
const stateSessionId = state.session_id as string | undefined;
if (!sessionId || !stateSessionId || stateSessionId === sessionId) {
  fs.unlinkSync(localPath); // 只清理匹配当前会话的状态
}
```

---

### AP-ST03：在 `~/.claude/` 中存储 OMC 状态

```
// ❌ 反模式：状态存储在全局目录
~/.claude/state/autopilot-state.json

// ✅ 正确：状态存储在 worktree 根目录
{worktree}/.omc/state/autopilot-state.json
```

**规则**：所有 OMC 状态必须存储在 git worktree 根目录的 `.omc/state/` 下，不在 `~/.claude/`。

---

## 3. Agent 生命周期反模式

### AP-AL01：向孤儿 Agent 发送 SHUTDOWN 信号

**来源**：`docs/standards/agent-lifecycle.md` §3.2

```typescript
// ❌ 反模式：逐个向孤儿 agent 发送信号（session-end hook 不这样做）
for (const orphanAgent of orphanAgents) {
  sendShutdownSignal(orphanAgent.agent_id); // 错误：批量清除，非逐个信号
}
```

```typescript
// ✅ 正确：批量清除 tracking 文件
function cleanupTransientState(directory: string): number {
  const trackingPath = path.join(directory, '.omc', 'state', 'subagent-tracking.json');
  if (fs.existsSync(trackingPath)) {
    fs.unlinkSync(trackingPath); // 批量清除所有 agent 记录
  }
}
```

---

### AP-AL02：混淆超时阈值（5 分钟 vs 10 分钟）

**来源**：`docs/standards/agent-lifecycle.md` §1.1（差异点 D-08）

```typescript
// ❌ 反模式：将 stale 检测阈值用于自动终止
if (elapsed > 5) { // 5 分钟
  autoKillAgent(); // 错误：5 分钟只触发警告，不自动终止
}
```

```typescript
// ✅ 正确：区分两个阈值
if (elapsed > 5) {
  // 触发警告（stale 检测）
  interventions.push({ type: "timeout", auto_execute: false });
}
if (elapsed > 10) {
  // 自动终止（10 分钟阈值）
  interventions.push({ type: "timeout", auto_execute: true });
}
```

---

### AP-AL03：实现死锁检测但忽略 DEADLOCK_CHECK_THRESHOLD

**来源**：`docs/standards/agent-lifecycle.md` §1.4（差异点 D-10）

```typescript
// ❌ 反模式：硬编码死锁阈值
if (mutuallyWaitingAgents.length >= 2) { // 错误：应使用常量
  triggerDeadlockIntervention();
}
```

```typescript
// ✅ 正确：使用已定义的常量
export const DEADLOCK_CHECK_THRESHOLD = 3;
if (mutuallyWaitingAgents.length >= DEADLOCK_CHECK_THRESHOLD) {
  triggerDeadlockIntervention();
}
```

---

## 4. 并发反模式

### AP-C01：绕过原子写入保护

**来源**：`docs/standards/agent-lifecycle.md` §6.3（差异点 D-07，已知技术债务 TD-4）

```typescript
// ❌ 反模式：直接写入，无原子保护（当前 writeTrackingStateImmediate 的已知问题）
writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
// 风险：并发写入可能导致文件损坏
```

```typescript
// ✅ 正确（v2 目标）：使用原子写入
atomicWriteJsonSync(statePath, state);
// 通过临时文件 + rename 保证原子性
```

**注意**：`writeTrackingStateImmediate()` 当前使用直接写入（TD-4），v2 目标统一为 `atomicWriteJsonSync`。

---

### AP-C02：不使用防抖直接写入高频状态

```typescript
// ❌ 反模式：每次工具调用都立即写入
onToolCall(() => {
  writeTrackingState(directory, state); // 高频写入，性能问题
});
```

```typescript
// ✅ 正确：使用防抖合并写入
const WRITE_DEBOUNCE_MS = 100;
const debouncedWrite = debounce(writeTrackingState, WRITE_DEBOUNCE_MS);
onToolCall(() => {
  debouncedWrite(directory, state);
});
```

---

## 5. 模式路由反模式

### AP-MR01：将 autopilot 与 ultrapilot 同时激活

**来源**：`docs/standards/state-machine.md` §5（差异点 D-04）

```typescript
// ❌ 反模式：同时激活互斥模式
activateMode('autopilot');
activateMode('ultrapilot'); // 错误：两者互斥
```

```typescript
// ✅ 正确：检查互斥冲突
const EXCLUSIVE_MODES = ['autopilot', 'ultrapilot', 'swarm', 'pipeline'];
if (checkExclusiveConflict(newMode)) {
  throw new Error(`Mode ${newMode} conflicts with active exclusive mode`);
}
```

**互斥模式完整列表**：`autopilot`、`ultrapilot`、`swarm`、`pipeline`（共 4 个，非 PRD 原描述的 2 个）。

---

### AP-MR02：使用不在白名单中的 mode 字符串

```typescript
// ❌ 反模式：使用未定义的 mode
state_write(mode="custom-mode", { ... }); // 错误：不在 VALID_MODES 中

// ❌ 反模式：大小写错误
state_write(mode="AUTOPILOT", { ... }); // 错误：大小写敏感
```

```typescript
// ✅ 正确：只使用 VALID_MODES 中的 8 个值
// 'autopilot' | 'ultrapilot' | 'team' | 'pipeline' |
// 'ralph' | 'ultrawork' | 'ultraqa' | 'swarm'
state_write(mode="autopilot", { ... });
```

---

## 6. 测试反模式

### AP-T01：测试文件放在错误目录

```
// ❌ 反模式：测试文件与源文件混放
src/lib/validateMode.ts
src/lib/validateMode.test.ts  // 错误：应在 __tests__ 目录

// ✅ 正确：测试文件统一放在 src/__tests__/
src/lib/validateMode.ts
src/__tests__/validateMode.test.ts
```

---

### AP-T02：测试中使用错误的导入路径

```typescript
// ❌ 反模式：路径层级错误
// 文件位于 src/__tests__/validateMode.test.ts
import { validateMode } from '../../lib/validateMode'; // 错误：多了一层 ../

// ✅ 正确：从 src/__tests__/ 到 src/lib/ 只需一层
import { validateMode } from '../lib/validateMode';
```

---

### AP-T03：不测试非字符串类型输入

```typescript
// ❌ 反模式：只测试字符串输入
it('should validate mode', () => {
  expect(validateMode('autopilot')).toBe(true);
  expect(validateMode('unknown')).toBe(false);
  // 缺少非字符串类型测试
});
```

```typescript
// ✅ 正确：测试所有边界情况
it('should return false for non-string types', () => {
  expect(validateMode(null)).toBe(false);
  expect(validateMode(undefined)).toBe(false);
  expect(validateMode(42)).toBe(false);
  expect(validateMode()).toBe(false);
  expect(validateMode([])).toBe(false);
});
```

---

## 差异点索引

| 差异点 | 相关反模式 | 详细说明 |
|--------|-----------|---------|
| D-04 | AP-MR01 | 互斥模式为 4 个，非 PRD 原描述的 2 个 |
| D-07 | AP-C01 | writeTrackingStateImmediate 绕过原子保护（TD-4） |
| D-08 | AP-AL02 | 超时阈值：5 分钟（stale）vs 10 分钟（自动终止） |
| D-09 | AP-ST01 | stale 阈值：agent（5 分钟）vs mode（1 小时） |
| D-10 | AP-AL03 | DEADLOCK_CHECK_THRESHOLD 已定义但未使用 |
