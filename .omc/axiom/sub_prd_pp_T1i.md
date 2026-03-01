# Sub-PRD: T-1i — LSP client 计时器泄漏 + 缓冲区上限

**任务 ID：** T-1i
**优先级：** P1（资源安全类，提前至 Batch 1）
**估计工时：** 3h
**目标文件：** `src/tools/lsp/client.ts`
**依赖：** None
**生成时间：** 2026-03-01

---

## 问题分析

### 问题 1：`disconnect()` 不清理 setTimeout 导致计时器泄漏

**位置：** `LspClient.disconnect()`，第 191–207 行

**现状分析：**

```typescript
// 当前 disconnect() 实现（第 191–207 行）
async disconnect(): Promise<void> {
  if (!this.process) return;
  try {
    await this.request('shutdown', null);
    this.notify('exit', null);
  } catch {
    // Ignore errors during shutdown
  }
  this.process.kill();
  this.process = null;
  this.initialized = false;
  this.pendingRequests.clear();   // <-- 仅调用 clear()，未清理 timeout handles
  this.openDocuments.clear();
  this.diagnostics.clear();
}
```

**问题根因：**

`pendingRequests` 是一个 `Map<number, { resolve, reject, timeout: NodeJS.Timeout }>`（第 116–120 行）。

`request()` 方法（第 285–315 行）在创建每个 pending 请求时，通过 `setTimeout` 注册了一个超时回调：

```typescript
const timeoutHandle = setTimeout(() => {
  this.pendingRequests.delete(id);
  reject(new Error(`LSP request '${method}' timed out after ${timeout}ms`));
}, timeout);
```

`disconnect()` 调用 `this.pendingRequests.clear()` 直接清空 Map，但每个条目内的 `timeout` 句柄（`NodeJS.Timeout`）并未被 `clearTimeout()` 取消。这些计时器会继续在事件循环中存活，直到自然触发（最长 15 秒，默认超时值）。

**泄漏后果：**
- 在 `disconnect()` 之后，残留计时器触发时会调用已销毁的 `this.pendingRequests.delete(id)`（Map 已清空，操作无害但多余）以及 `reject(...)` 回调
- `reject` 引用了调用方的 Promise reject 函数，可能导致 UnhandledPromiseRejection
- Node.js 进程不会因 `unref()` 而提前退出，但在高频率连接/断开场景（如测试、批量操作）下，累积的计时器会造成内存压力和难以追踪的 UnhandledRejection 错误

---

### 问题 2：接收缓冲区无大小上限

**位置：** `LspClient.handleData()`，第 212–246 行；`buffer` 字段，第 121 行

**现状分析：**

```typescript
private buffer = '';  // 第 121 行，无大小限制

private handleData(data: string): void {
  this.buffer += data;  // 第 213 行，无条件追加
  // ... 解析循环
}
```

**问题根因：**

`buffer` 字段是一个普通字符串，`handleData()` 每次接收到数据时无条件执行 `this.buffer += data`。当语言服务器行为异常时（例如：崩溃前输出大量错误信息、恶意或异常的服务器实现、进程被劫持后发送大量数据），缓冲区可能无限增长，直到：
- Node.js 进程因 OOM（Out of Memory）崩溃
- 宿主系统分页内存耗尽
- 字符串拼接性能随大小线性退化，导致 CPU 占用飙升

**泄漏后果：**
- 无防护的缓冲区增长会吃尽进程内存
- 攻击面：若 LSP 服务器被攻陷或替换，可通过刷数据造成 DoS
- 在长期运行场景（如 daemon 模式）下无法自愈

---

## 代码定位

| 位置 | 行号 | 当前代码 | 问题 |
|------|------|----------|------|
| `LspClient.buffer` 字段声明 | 121 | `private buffer = '';` | 无大小限制 |
| `LspClient.handleData()` 追加行 | 213 | `this.buffer += data;` | 无上限检查 |
| `LspClient.disconnect()` 清理行 | 204 | `this.pendingRequests.clear();` | 未先遍历调用 clearTimeout |

---

## 修复方案

### 修复 1：disconnect() 先清理计时器再 clear()

**原则：** 在调用 `clear()` 前，遍历 Map 对每个条目的 `timeout` 字段调用 `clearTimeout()`。

**修改位置：** 第 200–204 行（`this.process.kill()` 之后至 `this.pendingRequests.clear()` 之间）

```
// 伪代码
for each entry in pendingRequests:
    clearTimeout(entry.timeout)
    entry.reject(new Error('LSP client disconnected'))  // 可选：显式拒绝 pending promises
pendingRequests.clear()
```

注意：reject 现有 pending promises 是可选但推荐的做法，可避免调用方永久挂起。

### 修复 2：handleData() 添加 64MB 缓冲区上限

**原则：** 在追加数据前检查 `buffer` 当前大小，超过 64MB 时断开连接并输出警告。

**常量定义：** 在文件顶部或 `LspClient` 类内部定义常量 `MAX_BUFFER_SIZE = 64 * 1024 * 1024`（64MB）

**修改位置：** `handleData()` 方法内，第 213 行 `this.buffer += data` 之前

```
// 伪代码
const MAX_BUFFER_SIZE = 64 * 1024 * 1024  // 64MB

private handleData(data: string): void {
    if (buffer.length + data.length > MAX_BUFFER_SIZE):
        console.error(`LSP buffer exceeded ${MAX_BUFFER_SIZE} bytes, disconnecting`)
        this.disconnect()  // 异步，不 await
        return
    this.buffer += data
    // ... 其余解析逻辑不变
}
```

---

## 实现步骤

### Step 1：在 `LspClient` 类顶部添加缓冲区上限常量（约 5 分钟）

在第 113 行 `export class LspClient {` 之前（或类内部第一个 `private` 字段之前），添加：

```typescript
/** Maximum receive buffer size: 64 MB. Exceeding this disconnects the client. */
const MAX_BUFFER_BYTES = 64 * 1024 * 1024; // 64 MB
```

建议放在类外部与 `IDLE_TIMEOUT_MS` 等常量并列，或放在类内部作为 `private static` 常量。

### Step 2：修改 `handleData()` 添加上限检查（约 15 分钟）

在 `handleData()` 方法（第 212 行）内，`this.buffer += data` 前插入检查：

```typescript
private handleData(data: string): void {
  // Guard: disconnect if buffer grows beyond limit (prevents OOM from runaway servers)
  if (this.buffer.length + data.length > MAX_BUFFER_BYTES) {
    console.error(
      `LSP buffer exceeded ${MAX_BUFFER_BYTES} bytes limit, disconnecting server to prevent OOM`
    );
    this.disconnect().catch(() => {
      // Ignore errors during emergency disconnect
    });
    return;
  }

  this.buffer += data;
  // ... 其余代码不变（第 215–245 行）
```

### Step 3：修改 `disconnect()` 先清理计时器（约 15 分钟）

在 `disconnect()` 方法（第 191 行）内，将现有的 `this.pendingRequests.clear()` 替换为：

```typescript
// Clear all pending request timeouts before clearing the map
for (const [, pending] of this.pendingRequests) {
  clearTimeout(pending.timeout);
  pending.reject(new Error('LSP client disconnected'));
}
this.pendingRequests.clear();
```

完整修改后的 `disconnect()` 方法（第 191–207 行）：

```typescript
async disconnect(): Promise<void> {
  if (!this.process) return;

  try {
    await this.request('shutdown', null);
    this.notify('exit', null);
  } catch {
    // Ignore errors during shutdown
  }

  this.process.kill();
  this.process = null;
  this.initialized = false;

  // Clear pending request timers before clearing the map to prevent timer leaks
  for (const [, pending] of this.pendingRequests) {
    clearTimeout(pending.timeout);
    pending.reject(new Error('LSP client disconnected'));
  }
  this.pendingRequests.clear();

  this.openDocuments.clear();
  this.diagnostics.clear();
}
```

### Step 4：新增测试（约 90 分钟）

在 LSP 测试文件中新增以下测试场景（详见"测试场景"章节）。

### Step 5：运行现有 LSP 测试验证无回归（约 15 分钟）

```bash
npx jest --testPathPattern="lsp" --no-coverage
```

---

## 测试场景

### 场景 1：disconnect() 清理计时器 — 无泄漏

**目的：** 验证 `disconnect()` 调用后，所有 pending 计时器都被取消，不再触发。

**测试步骤：**
1. 创建 `LspClient` 实例（mock process）
2. 通过 `client.request()` 发送 2 个请求（使用较长超时，如 10000ms），不回应这些请求（模拟服务器无响应）
3. 调用 `client.disconnect()`
4. 使用 `jest.useFakeTimers()` 推进虚拟时钟超过超时时间（如 `jest.advanceTimersByTime(20000)`）
5. 断言：没有 UnhandledPromiseRejection 事件触发，或者 Promise 以 "LSP client disconnected" 被 reject（而非超时 reject）

**验收条件：**
- `clearTimeout` 被调用次数 === pending 请求数量
- 计时器触发后不产生 UnhandledRejection

---

### 场景 2：disconnect() 清理计时器 — pending promises 被显式 reject

**目的：** 验证 `disconnect()` 后，原本 pending 的 Promise 以清晰的错误信息被 reject，而非超时。

**测试步骤：**
1. 创建 `LspClient` 实例（mock process）
2. 发起一个不会收到响应的请求，捕获其 Promise
3. 调用 `client.disconnect()`
4. 等待该 Promise

**验收条件：**
- Promise 被 reject，且错误信息为 `'LSP client disconnected'`（而非超时信息）
- Promise 在 disconnect 后立即 settle，而非等待超时

---

### 场景 3：handleData() 缓冲区超限 — 触发断开并输出警告

**目的：** 验证当接收到数据使 buffer 超过 64MB 时，客户端自动断开连接并输出错误日志。

**测试步骤：**
1. 创建 `LspClient` 实例（mock process），使 `this.buffer` 达到 `MAX_BUFFER_BYTES - 10`（通过测试 hook 或直接设置 buffer 属性）
2. 调用 `handleData()` 并传入长度 > 10 的字符串（使 buffer + data > 64MB）
3. 监听 `console.error` 输出

**验收条件：**
- `console.error` 被调用，且包含 "64" 或 "buffer exceeded" 字样
- `disconnect()` 被调用（spy 验证）
- `handleData()` 在超限时立即 return，不执行 `this.buffer += data`

---

### 场景 4：handleData() 正常数据 — 不触发断开

**目的：** 验证小于 64MB 的正常数据可以正常处理，不触发断开。

**测试步骤：**
1. 创建 `LspClient` 实例
2. 调用 `handleData()` 传入小于 64MB 的有效 JSON-RPC 消息
3. 验证消息被正常解析处理

**验收条件：**
- `disconnect()` 未被调用
- `console.error` 未打印缓冲区超限警告
- 消息被正常解析（handleMessage 被调用）

---

### 场景 5：连续 disconnect() 调用的幂等性

**目的：** 验证多次调用 `disconnect()` 不会因计时器已清理而报错。

**测试步骤：**
1. 创建 `LspClient` 实例，发起若干请求
2. 调用 `disconnect()` 两次

**验收条件：**
- 第二次调用不抛出异常（因为 `if (!this.process) return` 守卫）
- 不发生重复 clearTimeout 调用导致的错误

---

## 验收标准

| # | 标准 | 验证方式 |
|---|------|---------|
| AC-1 | `disconnect()` 遍历 `pendingRequests` Map，对每个条目调用 `clearTimeout(item.timeout)` | 代码审查 + 测试场景 1 |
| AC-2 | `disconnect()` 调用 `clearTimeout` 之后才调用 `pendingRequests.clear()` | 代码审查（顺序正确） |
| AC-3 | `handleData()` 在追加数据前检查 `buffer.length + data.length > MAX_BUFFER_BYTES` | 代码审查 + 测试场景 3 |
| AC-4 | 超出 64MB 上限时调用 `console.error` 输出包含上限大小的警告 | 测试场景 3 |
| AC-5 | 超出 64MB 上限时调用 `this.disconnect()` 断开连接 | 测试场景 3 |
| AC-6 | 超出 64MB 上限时立即 `return`，不执行 buffer 追加 | 测试场景 3 |
| AC-7 | 新增至少 3 个测试验证上述清理逻辑 | 测试文件审查 |
| AC-8 | 现有 LSP 测试全部通过（零回归） | `jest --testPathPattern=lsp` 输出 |

---

## 风险评估

### 风险 1：pending promise reject 导致调用方未处理异常

**风险级别：** 低

**描述：** `disconnect()` 中主动 reject pending promises 可能导致调用方收到非预期的 `'LSP client disconnected'` 错误，若调用方未正确处理则产生 UnhandledPromiseRejection。

**缓解措施：**
- 这是预期行为改善：原本调用方会等待到超时才收到错误，现在更快收到明确错误
- 调用方已通过 try/catch 包裹 LSP 请求（见各 LSP tool 实现）
- 建议在 PR 描述中注明此行为变更

### 风险 2：handleData() 中调用 `this.disconnect()` 的时序问题

**风险级别：** 低-中

**描述：** `disconnect()` 是异步方法，而 `handleData()` 是同步方法。在 `disconnect()` 完成之前，可能仍有新的 `data` 事件触发（来自 stdout 的已缓冲数据），导致 `handleData()` 被多次调用。

**缓解措施：**
- `disconnect()` 首先设置 `this.process = null`，后续 `handleData()` 即使被调用，缓冲区检查逻辑会发现 buffer 已被重置（disconnect 不清 buffer，但进程已终止）
- 可在 `handleData()` 开头添加 `if (!this.process) return` 的守卫（推荐，属防御性编程）
- 超限检查在追加前就 return，不会造成二次超限

### 风险 3：64MB 上限可能对合法的大型工程项目不足

**风险级别：** 极低

**描述：** 极少数情况下，合法的 LSP 响应（如大型工作区 workspace/symbol 结果）可能接近但不超过 64MB 单次缓冲区大小。

**缓解措施：**
- 64MB 是非常保守的上限，LSP 协议设计上单条消息不应超过几 MB
- 缓冲区是滚动的（每次消息解析后截断），64MB 是未解析数据的累积上限
- 若实践中发现问题，可将常量调整为参数化配置

### 风险 4：测试中访问私有属性

**风险级别：** 低

**描述：** 部分测试场景需要预设 `this.buffer` 的值（私有属性），TypeScript 不允许直接访问。

**缓解措施：**
- 使用 `(client as any).buffer = '...'` 在测试中访问私有属性（常见测试模式）
- 或将 `MAX_BUFFER_BYTES` 导出为常量，在测试中构造恰好超限的输入数据

---

## 附录：关键代码引用

| 引用 | 文件行号 | 说明 |
|------|---------|------|
| `pendingRequests` 字段定义 | 116–120 | 存储 resolve/reject/timeout 三元组 |
| `request()` 中的 `setTimeout` | 302–305 | 创建超时句柄，存入 pendingRequests |
| `disconnect()` 方法 | 191–207 | 当前实现，缺少 clearTimeout 遍历 |
| `buffer` 字段定义 | 121 | 无大小限制的字符串缓冲区 |
| `handleData()` 追加行 | 213 | 无条件追加，缺少上限检查 |
| `handleMessage()` clearTimeout | 256 | 正常消息处理时已正确调用 clearTimeout |
