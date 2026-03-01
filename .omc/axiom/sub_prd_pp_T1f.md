# Sub-PRD: T-1f Atomics.wait 主线程执行上下文修复

> **Status**: APPROVED
> **Context**: `.omc/axiom/rough.md` / `manifest.md`
> **作者**: axiom-sub-prd-writer
> **日期**: 2026-03-01

---

## 1. 目标

修复 `Atomics.wait()` 在 Node.js 主线程中被调用时抛出
`TypeError: Cannot use Atomics.wait() on the main thread` 的问题，
防止 hook bridge 因此崩溃。

在整体方案中，该任务属于 **运行时稳定性修复层**：
hook bridge（`src/hooks/`）和 session-registry（`src/notifications/`）
均在 Claude Code 子进程的主线程中运行，而非 Worker 线程，
因此同步阻塞式 `Atomics.wait()` 在这两处均属于非法调用。

---

## 2. 现状分析

### 2.1 受影响位置

| 文件 | 行号 | 函数名 | 调用次数 |
|------|------|--------|----------|
| `src/hooks/subagent-tracker/index.ts` | 167-171 | `syncSleep(ms)` | 6 次（锁等待 + flush 指数退避） |
| `src/notifications/session-registry.ts` | 99-101 | `sleepMs(ms)` | 4 次（锁等待循环） |

### 2.2 调用场景

**`syncSleep`（subagent-tracker）：**
- 行 266, 279, 294, 305：`acquireLock()` 内的自旋锁等待，间隔 `LOCK_RETRY_MS = 50ms`，超时 `LOCK_TIMEOUT_MS = 5000ms`
- 行 462：`debouncedFlush()` 内的指数退避，初始间隔 `FLUSH_RETRY_BASE_MS = 50ms`

**`sleepMs`（session-registry）：**
- 行 212, 218, 230, 247：`acquireRegistryLock()` 内的自旋锁等待，间隔 `LOCK_RETRY_MS = 20ms`，超时 `LOCK_TIMEOUT_MS = 2000ms`

### 2.3 设计约束

- `acquireLock()` 和 `acquireRegistryLock()` 目前是**同步函数**，返回值为 `boolean` 或 `RegistryLockHandle | null`。
- 其所有调用方（`writeTrackingState`、`registerSession` 等）也是同步函数。
- 直接改为 `async/await` 需要同步改造整条调用链，属于**中等范围重构**。

---

## 3. API 契约（I/O）

### 3.1 `syncSleep` 替换方案

```
// 原接口（同步，不可在主线程使用）
function syncSleep(ms: number): void

// 新接口 A：主线程同步轮询（busy-wait，ms 极小时可接受）
function syncSleepPolling(ms: number): void

// 新接口 B：完整异步化（推荐，需改造调用链为 async）
async function asyncSleep(ms: number): Promise<void>

// 运行时分支检测函数
function isMainThread(): boolean
```

### 3.2 `sleepMs` 替换方案（session-registry）

与 `syncSleep` 相同逻辑，仅函数名不同。

### 3.3 副作用

- **不写文件**、不发请求、不弹提示。
- 改动仅影响内部等待行为，外部接口（返回值类型、导出名）不变。

---

## 4. 数据结构

无需新增 model 或 schema。

涉及常量（保持不变）：

```typescript
// subagent-tracker/index.ts
const LOCK_TIMEOUT_MS = 5000;
const LOCK_RETRY_MS  = 50;
const FLUSH_RETRY_BASE_MS = 50;

// session-registry.ts
const LOCK_TIMEOUT_MS = 2000;
const LOCK_RETRY_MS  = 20;
```

---

## 5. 实现规格

### 5.1 执行上下文检测

```typescript
// 方式一：使用 worker_threads 模块（推荐，Node.js 12+）
import { isMainThread } from 'worker_threads';

// 方式二：检测 workerData（仅 Worker 内有值）
import { workerData } from 'worker_threads';
const isMain = workerData === null;

// 封装为工具函数（两文件共用）
function detectIsMainThread(): boolean {
  try {
    const wt = require('worker_threads');
    return wt.isMainThread === true;
  } catch {
    // worker_threads 不可用视为主线程
    return true;
  }
}
```

> 注意：`require('worker_threads')` 在 Node.js < 11.7 会抛出，
> 但 ultrapower 已要求 Node 18+，因此可安全使用。

### 5.2 替换策略选择

根据调用链是否已是异步，选择不同策略：

| 调用链当前类型 | 推荐策略 | 备注 |
|-------------|----------|------|
| 同步函数，ms 极小（≤50ms），循环次数有限 | **策略 A：同步忙等** | 简单，不改接口 |
| 同步函数，ms 较大或循环次数不可控 | **策略 B：异步化** | 需改造调用链 |

两个目标文件的锁等待间隔均为 20-50ms，循环上限由超时控制（2-5s），
属于**小间隔、有界循环**，策略 A 可接受（CPU 占用极低）。
但为符合最佳实践，优先实施**策略 B（异步化）**，策略 A 作为回退。

### 5.3 策略 A：同步忙等（伪代码）

```
function syncSleepPolling(ms: number): void {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    // 纯空循环，ms 极小时 CPU 代价可接受
  }
}

// 主线程路径
function syncSleep(ms: number): void {
  if (detectIsMainThread()) {
    syncSleepPolling(ms)          // 策略 A
  } else {
    Atomics.wait(view, 0, 0, ms)  // 原逻辑，Worker 线程安全
  }
}
```

### 5.4 策略 B：异步化（伪代码，推荐）

```
// 1. 新增工具函数
function asyncSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 2. 改造 syncSleep / sleepMs
async function asyncSleepContext(ms: number): Promise<void> {
  if (detectIsMainThread()) {
    await asyncSleep(ms)
  } else {
    Atomics.wait(view, 0, 0, ms)  // Worker 线程，保持同步
  }
}

// 3. 改造 acquireLock() -> async acquireLock()
async function acquireLock(directory: string): Promise<boolean> {
  const startTime = Date.now()
  while (Date.now() - startTime < LOCK_TIMEOUT_MS) {
    // ... 原锁逻辑（不变）...
    await asyncSleepContext(LOCK_RETRY_MS)  // 替换 syncSleep
  }
  return false
}

// 4. 同步改造上层调用链为 async
async function writeTrackingState(...): Promise<void> { ... }
async function acquireRegistryLock(): Promise<RegistryLockHandle | null> { ... }
async function acquireRegistryLockOrWait(): Promise<RegistryLockHandle> { ... }
```

### 5.5 Worker 线程注释规范

凡保留 `Atomics.wait()` 的分支，必须添加如下注释：

```typescript
// SAFETY: This code path executes only in a Worker thread context.
// Atomics.wait() is prohibited on the main thread (Node.js restriction).
// Context verified via: require('worker_threads').isMainThread === false
Atomics.wait(view, 0, 0, ms);
```

---

## 6. 测试用例设计

### 6.1 单元测试（Jest）

**测试文件位置：**
- `src/hooks/subagent-tracker/__tests__/syncSleep.test.ts`
- `src/notifications/__tests__/sleepMs.test.ts`

#### 场景一：主线程环境下 syncSleep 不抛出

```
Given: isMainThread === true（Mock worker_threads）
When:  调用 syncSleep(20)
Then:  不抛出任何异常
And:   等待时间 >= 20ms（通过 Date.now() 前后差值验证）
```

#### 场景二：Worker 线程环境下保持 Atomics.wait

```
Given: isMainThread === false（Mock worker_threads）
When:  调用 syncSleep(20)
Then:  调用 Atomics.wait（通过 jest.spyOn(Atomics, 'wait') 验证）
And:   不抛出 TypeError
```

#### 场景三：acquireLock 在主线程完整执行

```
Given: isMainThread === true
And:   无锁文件存在
When:  调用 acquireLock(tmpDir)（或 async 版本）
Then:  返回 true（获锁成功）
And:   整个过程不抛出 TypeError
```

#### 场景四：acquireLock 超时处理

```
Given: 锁文件由存活进程持有
When:  调用 acquireLock(tmpDir)，超时设为 100ms
Then:  在 ~100ms 内返回 false
And:   不挂起进程
```

#### 场景五：hook bridge 集成——不因 TypeError 崩溃

```
Given: 模拟 SubagentStart hook 在主线程触发
When:  执行完整 hook 处理流程（包括文件写入）
Then:  无 TypeError 异常抛出
And:   状态文件写入成功
```

### 6.2 覆盖率要求

- `syncSleep` / `sleepMs` 函数：行覆盖率 100%
- `acquireLock` / `acquireRegistryLock` 分支：覆盖率 ≥ 90%

---

## 7. 验收标准（Gherkin）

```gherkin
Feature: Atomics.wait 主线程兼容性修复

  Scenario: 主线程环境不因 TypeError 崩溃
    Given Node.js 进程运行在主线程
    When  subagent-tracker hook 或 session-registry 触发睡眠等待
    Then  不抛出 "TypeError: Cannot use Atomics.wait() on the main thread"
    And   hook bridge 继续正常运行

  Scenario: Worker 线程保留 Atomics.wait
    Given 代码运行在 Worker 线程（isMainThread === false）
    When  syncSleep 或 sleepMs 被调用
    Then  仍调用 Atomics.wait（效率更高）
    And   代码注释说明该分支为 Worker 线程安全路径

  Scenario: 锁等待在主线程可完成
    Given isMainThread === true
    And   锁文件不存在
    When  acquireLock 或 acquireRegistryLock 被调用
    Then  函数在超时时间内返回（不死锁）
    And   返回获锁成功标志

  Scenario: 新增测试覆盖两种上下文
    Given 存在针对 syncSleep 和 sleepMs 的单元测试
    When  在 CI 中执行 npm test
    Then  主线程路径和 Worker 线程路径均有对应测试用例通过

  Scenario: 现有功能不回归
    Given 修复前已有的集成测试
    When  执行 npm run build && npm test
    Then  所有原有测试继续通过
    And   无 TypeScript 编译错误（tsc --noEmit 零错误）
```

---

## 8. 影响范围（Scope Gate 参考）

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/hooks/subagent-tracker/index.ts` | 修改 | `syncSleep` 函数体 + 调用链异步化 |
| `src/notifications/session-registry.ts` | 修改 | `sleepMs` 函数体 + 调用链异步化 |
| `src/hooks/subagent-tracker/__tests__/syncSleep.test.ts` | 新建 | 单元测试 |
| `src/notifications/__tests__/sleepMs.test.ts` | 新建 | 单元测试 |

无跨模块 API 变更（所有修改函数均为模块内部函数，未 export）。

---

## 9. 风险与注意事项

1. **异步化传染**：将锁函数改为 async 后，所有调用方均需加 `await`，
   需逐一排查确认无遗漏，否则返回 `Promise` 被忽略会导致竞态。
2. **策略 A 忙等**：虽然 ms 极小，在高并发场景（大量 hook 并发触发）
   下仍可能造成短暂 CPU 峰值，建议策略 B 为最终方案。
3. **SharedArrayBuffer 声明**：`session-registry.ts` 中顶层
   `const SLEEP_ARRAY = new Int32Array(new SharedArrayBuffer(4))` 在
   主线程环境可保留（声明本身无害），仅需避免将其传入 `Atomics.wait()`。
