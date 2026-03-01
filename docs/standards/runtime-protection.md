# 运行时防护规范

> **ultrapower-version**: 5.5.5
> **优先级**: P0（必须遵守）
> **真理之源**: `docs/standards/audit-report.md`
> **覆盖范围**: T-03a（Hook 输入防护）+ T-03b（State/Mode 防护）

---

## 目录

1. [Hook 输入防护（T-03a）](#1-hook-输入防护t-03a)
   - 1.1 全部 15 类 HookType 必需字段白名单
   - 1.2 bridge-normalize.ts 扩展要求
   - 1.3 未知字段处理规则
   - 1.4 permission-request 强制阻塞要求
2. [State/Mode 防护（T-03b）](#2-statemode-防护t-03b)
   - 2.1 原子写入强制要求
   - 2.2 状态文件并发保护级别对照表
   - 2.3 Windows 平台差异说明
   - 2.4 路径安全：mode 参数白名单
   - 2.5 状态文件损坏恢复流程
   - 2.6 敏感数据处理

---

## 1. Hook 输入防护（T-03a）

### 1.1 全部 15 类 HookType 必需字段白名单

来源：`src/hooks/bridge.ts`（`requiredKeysForHook` 函数）+ `src/hooks/bridge-normalize.ts`

所有 hook 输入必须经过 `bridge-normalize.ts` 的白名单过滤。以下为每类 HookType 的必需字段和敏感级别：

| HookType | 必需字段 | 敏感级别 | 未知字段处理 |
|----------|----------|----------|------------|
| `keyword-detector` | `[]`（默认） | 普通 | 透传（记录 debug 警告） |
| `ralph` | `[]`（默认） | 普通 | 透传（记录 debug 警告） |
| `persistent-mode` | `[]`（默认） | 普通 | 透传（记录 debug 警告） |
| `stop-continuation` | `[]`（默认） | 普通 | 透传（记录 debug 警告） |
| `session-start` | `[]`（默认） | 普通 | 透传（记录 debug 警告） |
| `session-end` | `["sessionId", "directory"]` | **敏感** | 严格白名单，丢弃未知字段 |
| `pre-tool-use` | `[]`（默认） | 普通 | 透传（记录 debug 警告） |
| `post-tool-use` | `[]`（默认） | 普通 | 透传（记录 debug 警告） |
| `autopilot` | `[]`（默认） | 普通 | 透传（记录 debug 警告） |
| `subagent-start` | `["sessionId", "directory"]` | 普通 | 透传（记录 debug 警告） |
| `subagent-stop` | `["sessionId", "directory"]` | 普通 | 透传（记录 debug 警告） |
| `pre-compact` | `["sessionId", "directory"]` | 普通 | 透传（记录 debug 警告） |
| `setup-init` | `["sessionId", "directory"]` | **敏感** | 严格白名单，丢弃未知字段 |
| `setup-maintenance` | `["sessionId", "directory"]` | **敏感** | 严格白名单，丢弃未知字段 |
| `permission-request` | `["sessionId", "directory", "toolName"]` | **敏感，不可静默降级** | 严格白名单，丢弃未知字段 |

**敏感 Hook 白名单（当前实现，来自 `bridge-normalize.ts`）：**

```typescript
const SENSITIVE_HOOKS = new Set([
  'permission-request',
  'setup-init',
  'setup-maintenance',
  'session-end'
]);
```

> **注意（差异点 D-01）**：当前实现为 4 类敏感 hook，PRD 原描述为 3 类（将 setup 视为一类）。`setup` 已拆分为 `setup-init` 和 `setup-maintenance` 两个独立类型。

### 1.2 bridge-normalize.ts 扩展要求

**当前状态**：白名单仅覆盖 4 类敏感 hook，非敏感 hook 的未知字段透传。

**规范要求（v2 目标）**：将白名单扩展至全部 15 类 HookType，每类明确必需字段和禁止字段。

**v1 过渡规则**（当前实现的合理性说明）：
- 敏感 hook（4 类）：严格白名单，未知字段被丢弃 ✅
- 非敏感 hook（11 类）：未知字段透传，记录 debug 警告（设计选择，非疏漏）

### 1.3 未知字段处理规则

```typescript
// 当前实现（bridge-normalize.ts）
function filterPassthrough(input, hookType) {
  const isSensitive = hookType != null && SENSITIVE_HOOKS.has(hookType);
  if (isSensitive) {
    // 严格白名单：只允许 KNOWN_FIELDS，丢弃其他字段
    return filterToKnownFields(input, hookType);
  } else {
    // 非敏感：未知字段透传，仅记录 debug 警告
    logDebugWarning(input, hookType);
    return input;
  }
}
```

**规范要求**：
- 敏感 hook 的未知字段**必须**被丢弃，不得透传
- 非敏感 hook 的未知字段当前透传（v1 可接受），v2 需统一丢弃

### 1.4 permission-request 强制阻塞要求

**当前实现（差异点 D-05）**：

```typescript
// src/hooks/persistent-mode/index.ts
export function createHookOutput(result: PersistentModeResult): {
  continue: boolean; message?: string;
} {
  return { continue: true, message: result.message || undefined };
  // 注意：始终返回 { continue: true }，包括 permission-request 失败时
}
```

**规范要求（待实现）**：

`permission-request` 是安全边界，失败时**不得**静默降级。规范要求：

```typescript
// 目标实现（v2）
export function createHookOutput(
  result: PersistentModeResult,
  hookType?: HookType
): { continue: boolean; message?: string } {
  if (hookType === 'permission-request' && result.error) {
    // 安全边界：permission-request 失败时必须阻塞
    return { continue: false, message: result.message };
  }
  return { continue: true, message: result.message || undefined };
}
```

**当前状态**：v1 记录此不一致性，v2 修复。实现者不得假设 `permission-request` 失败会自动阻塞。

---

## 2. State/Mode 防护（T-03b）

### 2.1 原子写入强制要求

来源：`src/lib/atomic-write.ts`

**所有状态文件写入必须使用以下函数之一**：

```typescript
// 同步原子写入（推荐用于状态文件）
atomicWriteJsonSync(filePath: string, data: unknown): void

// 异步原子写入
atomicWriteJson(filePath: string, data: unknown): Promise<void>

// 原始文件内容写入（非 JSON）
atomicWriteFileSync(filePath: string, content: string): void
```

**禁止直接使用**：

```typescript
// ❌ 禁止
fs.writeFileSync(filePath, JSON.stringify(data));
fs.writeFile(filePath, content, callback);
```

**原子写入完整流程**：

```
1. ensureDirSync(dir)                    — 确保目录存在
2. 独占创建临时文件                        — wx 标志（O_CREAT|O_EXCL|O_WRONLY），权限 0o600
   tmpPath = path.join(dir, `.${base}.tmp.${randomUUID()}`)
3. writeSync(fd, content, 0, 'utf8')     — 写入内容
4. fsyncSync(fd)                         — 落盘
5. closeSync(fd)                         — 关闭文件描述符
6. renameSync(tmpPath, filePath)         — 原子替换
7. 目录级 fsync（best-effort）            — Windows 上可能失败，已捕获异常
```

**文件权限**：所有原子写入文件权限为 `0o600`（仅所有者可读写）。

### 2.2 状态文件并发保护级别对照表

来源：`src/hooks/subagent-tracker/index.ts`、`src/lib/atomic-write.ts`

| 状态文件 | 并发保护机制 | 保护级别 |
|---------|------------|---------|
| `subagent-tracking.json` | debounce（100ms）+ flushInProgress Set + mergeTrackerStates + 文件锁（PID:timestamp） | **最高**（四层保护） |
| `team-state.json` | atomicWriteJsonSync | 中（原子写入，无 debounce） |
| `ralph-state.json` | atomicWriteJsonSync | 中（原子写入，无 debounce） |
| `autopilot-state.json` | atomicWriteJsonSync | 中（原子写入，无 debounce） |
| 其他 `*-state.json` | atomicWriteJsonSync | 中（原子写入，无 debounce） |
| subagent-tracker 内部即时写入 | `writeFileSync`（直接写入） | **低**（无原子保护，差异点 D-07） |

**subagent-tracking.json 锁机制详情**：

```
锁文件格式：PID:timestamp
stale 检测：锁持有超过 5 秒（LOCK_TIMEOUT_MS = 5000），或持有进程已死亡
等待机制：Atomics.wait（syncSleep）
```

**mergeTrackerStates 合并策略**：
- 计数器（tool_calls、cost 等）：取 `Math.max`
- 同一 agent_id 的状态：newer timestamp wins

**规范目标**：
- v1：明确记录此不一致性（本文档已完成）
- v2：统一为 debounce + atomic 双层保护（技术债务 TD-4）

### 2.3 Windows 平台差异说明

来源：`src/lib/atomic-write.ts` 代码注释

**关键差异**：

| 平台 | rename 行为 | 目标文件被占用时 |
|------|------------|----------------|
| POSIX（Linux/macOS） | 原子替换（inode 交换） | 成功（原子操作） |
| Windows | `MoveFileExW with MOVEFILE_REPLACE_EXISTING` | **失败**（抛出错误） |

**当前代码处理方式**：

```typescript
// src/lib/atomic-write.ts
try {
  const dirFd = fs.openSync(dir, 'r');
  fs.fsyncSync(dirFd);
  fs.closeSync(dirFd);
} catch {
  // Some platforms don't support directory fsync - that's okay
  // Windows 上目录级 fsync 失败时静默捕获
}
```

**规范要求**：
- 实现者**不得**假设 Windows 和 POSIX 的 rename 行为一致
- 在 Windows 上，如果目标文件被其他进程持有，`renameSync` 会失败
- 所有涉及文件操作的代码必须考虑 Windows 平台行为差异

### 2.4 路径安全：mode 参数白名单

**安全边界（不可协商）**：`mode` 参数必须通过白名单校验，禁止直接拼接到文件路径。

**合法 mode 值（8 个，来源：`src/hooks/mode-registry/index.ts`）**：

```typescript
// src/lib/validateMode.ts（T-07 实现）
const VALID_MODES = [
  'autopilot', 'ultrapilot', 'team', 'pipeline',
  'ralph', 'ultrawork', 'ultraqa', 'swarm'
] as const;
```

> **注意（差异点 D-03）**：合法 mode 值为 8 个（含 `swarm`），PRD 原描述为 7 个。

**使用方式**：

```typescript
import { validateMode, assertValidMode } from '../lib/validateMode';

// 校验（返回 boolean）
if (!validateMode(mode)) {
  throw new Error(`Invalid mode: ${mode}`);
}

// 断言（抛出异常）
const validMode = assertValidMode(mode);
const stateFilePath = `.omc/state/${validMode}-state.json`;
```

**禁止模式**：

```typescript
// ❌ 禁止：未校验直接拼接
const path = `.omc/state/${mode}-state.json`;  // 路径遍历风险

// ✅ 正确：先校验再拼接
const validMode = assertValidMode(mode);
const path = `.omc/state/${validMode}-state.json`;
```

### 2.5 状态文件损坏恢复流程

来源：`src/lib/atomic-write.ts`（`safeReadJson` 函数）

**检测到损坏 JSON 时的恢复流程**：

```
1. 尝试读取文件
2. JSON.parse 失败（或 ENOENT）
   → safeReadJson 返回 null（不崩溃）
3. 调用方检测到 null
   → 记录错误到 last-tool-error.json
   → 使用空状态初始化（不崩溃）
4. 下次写入时原子覆盖损坏文件
```

**部分写入检测**：
- 文件大小为 0：视为损坏
- JSON 不完整（parse 失败）：视为损坏
- 两种情况均返回 null，由调用方决定恢复策略

```typescript
// src/lib/atomic-write.ts
export function safeReadJson<T>(filePath: string): T | null {
  // ENOENT 或 JSON.parse 失败时返回 null（不崩溃）
}
```

### 2.6 敏感数据处理

**`agent-replay-*.jsonl` 文件**包含完整 agent 对话历史，可能含有代码、密钥片段。

**规范要求**：

| 要求 | 说明 |
|------|------|
| 文件权限 | `0o600`（仅所有者可读写） |
| 数据保留期限 | 7 天，超期自动清理 |
| git 提交 | 禁止提交（`.omc/` 已在 `.gitignore` 中） |
| CI 验证 | 必须验证 `.gitignore` 包含 `.omc/` 目录 |

**验证 `.gitignore` 配置**：

```bash
# CI 检查命令
grep -q "\.omc/" .gitignore || echo "ERROR: .omc/ not in .gitignore"
```

---

## 差异点说明

本规范记录以下与 PRD 的差异点（来源：`audit-report.md`）：

| 差异点 | 描述 | 当前状态 | 规范要求 |
|--------|------|---------|---------|
| D-01 | 敏感 hook 数量 | 4 类（setup 拆分为 setup-init + setup-maintenance） | 以 4 类为准 |
| D-05 | permission-request 失败处理 | 静默降级（返回 `{ continue: true }`） | v2 修复为强制阻塞 |
| D-06 | 非敏感 hook 未知字段 | 透传（记录 debug 警告） | v2 统一丢弃 |
| D-07 | subagent-tracker 内部写入 | `writeFileSync` 直接写入 | v2 统一为 atomicWriteJsonSync |
| D-03 | 合法 mode 数量 | 8 个（含 swarm） | 以 8 个为准 |
